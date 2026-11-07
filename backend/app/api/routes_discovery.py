from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from app.db.database import get_db
from app.db.models import Shop, ShopInventory, MasterCatalogItem
from app.core.geo_engine import is_within_shop_radius, estimate_eta_mins
from app.core.redis_cache import get_cached_json, set_cached_json

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])


def _format_shop_dict(shop: Shop, distance_km: Optional[float] = None, eta: Optional[str] = None) -> Dict[str, Any]:
    return {
        "id": shop.id,
        "name": shop.name,
        "category": shop.category,
        "image_url": shop.image_url,
        "is_open": shop.is_open,
        "rating": shop.rating,
        "management_mode": shop.management_mode,
        "locality_name": shop.locality_name,
        "delivery_scope": shop.delivery_scope,
        "delivery_radius_km": shop.delivery_radius_km,
        "distance_km": distance_km if distance_km is not None else 0.0,
        "local_eta_mins": eta or shop.local_eta_mins,
        "national_eta_days": shop.national_eta_days,
        "free_delivery_enabled": shop.free_delivery_enabled,
        "min_order_for_free_delivery": shop.min_order_for_free_delivery,
        "base_delivery_fee": shop.base_delivery_fee,
        "is_verified": shop.is_verified,
    }


def _format_inventory_item(item: ShopInventory, shop: Optional[Shop] = None) -> Dict[str, Any]:
    return {
        "id": item.id,
        "shop_id": item.shop_id,
        "shop_name": shop.name if shop else None,
        "shop_locality": shop.locality_name if shop else None,
        "shop_is_open": shop.is_open if shop else True,
        "master_item_id": item.master_item_id,
        "is_not_listed_custom": item.is_not_listed_custom,
        "name": item.name,
        "category": item.category,
        "sub_category": item.sub_category,
        "image_url": item.image_url,
        "gallery_images": item.gallery_images or [],
        "weight_or_size": item.weight_or_size,
        "selling_price": item.selling_price,
        "mrp": item.mrp,
        "discount_percent": round(max(0.0, (item.mrp - item.selling_price) / item.mrp * 100), 1) if item.mrp > 0 else 0,
        "available_stock": item.available_stock,
        "in_stock": item.in_stock and item.available_stock > 0,
        "is_pan_india_eligible": item.is_pan_india_eligible,
    }


# ── 1. GET /api/discovery/feed ──────────────────────────────────────────

@router.get("/feed", status_code=status.HTTP_200_OK)
async def get_discovery_feed(
    lat: float = Query(27.0544, description="User Latitude (e.g. Kukas: 27.0544)"),
    lng: float = Query(75.8942, description="User Longitude (e.g. Kukas: 75.8942)"),
    mode: str = Query("LOCAL", description="'LOCAL' (Hyperlocal Instant) or 'PAN_INDIA' (National Courier)"),
    locality: Optional[str] = Query(None, description="Optional locality override e.g. Kukas"),
    db: AsyncSession = Depends(get_db),
):
    """
    Hyperlocal + Pan-India Discovery Engine:
    - In LOCAL mode: Uses geo_engine Haversine formula to strictly isolate shops.
      Kukas users only see shops serving their radius; Kunda shops are 100% hidden.
    - In PAN_INDIA mode: Returns national courier items ('Ships All India • 3-5 Days').
    - Returns structured Blinkit/Zepto-style horizontal rails with 30s Upstash Redis caching.
    """
    clean_mode = mode.upper().strip()
    cache_key = f"feed:{clean_mode}:{round(lat, 3)}:{round(lng, 3)}:{locality or 'all'}"

    # Try cache first for 0-lag response
    cached = await get_cached_json(cache_key)
    if cached:
        return cached

    if clean_mode == "PAN_INDIA":
        # National Courier Feed
        stmt = (
            select(ShopInventory, Shop)
            .join(Shop, ShopInventory.shop_id == Shop.id)
            .where(
                and_(
                    Shop.is_verified == True,
                    or_(
                        ShopInventory.is_pan_india_eligible == True,
                        Shop.delivery_scope.in_(["PAN_INDIA", "BOTH"])
                    )
                )
            )
        )
        result = await db.execute(stmt)
        rows = result.all()

        clothes_rail = []
        custom_3d_rail = []
        all_pan_india = []

        for inv, shop in rows:
            formatted = _format_inventory_item(inv, shop)
            all_pan_india.append(formatted)
            if inv.category == "Clothes":
                clothes_rail.append(formatted)
            elif inv.category in ["Custom/3D", "Handicrafts"]:
                custom_3d_rail.append(formatted)

        feed_data = {
            "mode": "PAN_INDIA",
            "banner_badge": "Ships All India • 3-5 Days Courier Delivery",
            "all_products": all_pan_india,
            "rails": {
                "clothes_rail": clothes_rail,
                "custom_3d_rail": custom_3d_rail,
            }
        }

        await set_cached_json(cache_key, feed_data, ttl_seconds=30)
        return feed_data

    # ── LOCAL MODE (Hyperlocal Instant Delivery with Strict Area Isolation) ──
    shop_stmt = select(Shop).where(Shop.is_verified == True)
    shop_result = await db.execute(shop_stmt)
    all_shops = shop_result.scalars().all()

    served_shops: List[Dict[str, Any]] = []
    served_shop_ids: List[int] = []

    for s in all_shops:
        is_served, distance = is_within_shop_radius(lat, lng, s.lat, s.lng, s.delivery_radius_km)
        if is_served:
            eta = estimate_eta_mins(distance)
            served_shops.append(_format_shop_dict(s, distance_km=distance, eta=eta))
            served_shop_ids.append(s.id)

    # Sort shops: Open first, then by closest distance
    served_shops.sort(key=lambda x: (not x["is_open"], x["distance_km"]))

    # Query inventory items strictly for served shops
    kirana_rail = []
    fast_food_rail = []
    street_stalls_rail = []

    if served_shop_ids:
        inv_stmt = (
            select(ShopInventory, Shop)
            .join(Shop, ShopInventory.shop_id == Shop.id)
            .where(
                and_(
                    ShopInventory.shop_id.in_(served_shop_ids),
                    ShopInventory.in_stock == True,
                    ShopInventory.available_stock > 0
                )
            )
        )
        inv_result = await db.execute(inv_stmt)
        inv_rows = inv_result.all()

        for inv, shop in inv_rows:
            formatted = _format_inventory_item(inv, shop)
            if inv.category == "Kirana":
                kirana_rail.append(formatted)
            elif inv.category in ["Fast Food", "Sweets"]:
                fast_food_rail.append(formatted)
            
            if shop.management_mode == "PARTNER_RUNNER_STALL":
                street_stalls_rail.append(formatted)

    feed_data = {
        "mode": "LOCAL",
        "locality": locality or ("Kukas" if lat >= 27.0 else "Kunda"),
        "total_shops_in_radius": len(served_shops),
        "featured_shops": served_shops,
        "rails": {
            "kirana_rail": kirana_rail[:20],
            "fast_food_rail": fast_food_rail[:20],
            "street_stalls_rail": street_stalls_rail[:20],
        }
    }

    await set_cached_json(cache_key, feed_data, ttl_seconds=30)
    return feed_data


# ── 2. GET /api/discovery/search-suggest ─────────────────────────────────

@router.get("/search-suggest", status_code=status.HTTP_200_OK)
async def search_suggest(
    q: str = Query(..., min_length=1, description="Search query string"),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Instant search auto-complete across:
    1. Master Catalog items & Shop Inventories
    2. Local shops in delivery radius
    3. Category and keyword tags
    """
    query_str = f"%{q.strip().lower()}%"

    # Search Products
    prod_stmt = (
        select(MasterCatalogItem)
        .where(
            or_(
                MasterCatalogItem.name.ilike(query_str),
                MasterCatalogItem.brand.ilike(query_str),
                MasterCatalogItem.category.ilike(query_str),
                MasterCatalogItem.sub_category.ilike(query_str),
                MasterCatalogItem.search_keywords.ilike(query_str),
            )
        )
        .limit(10)
    )
    prod_res = await db.execute(prod_stmt)
    products = prod_res.scalars().all()

    # Search Shops
    shop_stmt = (
        select(Shop)
        .where(
            and_(
                Shop.is_verified == True,
                or_(
                    Shop.name.ilike(query_str),
                    Shop.category.ilike(query_str),
                    Shop.locality_name.ilike(query_str),
                )
            )
        )
        .limit(5)
    )
    shop_res = await db.execute(shop_stmt)
    shops = shop_res.scalars().all()

    return {
        "query": q,
        "suggestions": [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "mrp": p.mrp,
                "image_url": p.image_url,
                "type": "PRODUCT"
            }
            for p in products
        ],
        "shops": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "locality_name": s.locality_name,
                "is_open": s.is_open,
                "image_url": s.image_url,
                "type": "SHOP"
            }
            for s in shops
        ]
    }
