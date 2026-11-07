from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from app.db.database import get_db
from app.db.models import Shop, ShopInventory, MasterCatalogItem, AreaDemandRequest
from app.core.geo_engine import is_within_shop_radius, estimate_eta_mins
from app.core.redis_cache import get_cached_json, set_cached_json

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])


# ── Schemas ─────────────────────────────────────────────────────────────

class AreaDemandSubmitRequest(BaseModel):
    lat: float
    lng: float
    locality_name: Optional[str] = None
    area_name: Optional[str] = None
    pincode: Optional[str] = None
    phone_or_email: Optional[str] = None
    email: Optional[str] = None


def _format_shop_dict(
    shop: Shop,
    distance_km: Optional[float] = None,
    eta: Optional[str] = None,
    is_scheduled_route: bool = False,
    scheduled_area_name: Optional[str] = None,
    scheduled_eta: Optional[str] = None
) -> Dict[str, Any]:
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
        "custom_serviceable_areas": getattr(shop, "custom_serviceable_areas", []) or [],
        "is_scheduled_route": is_scheduled_route,
        "scheduled_area_name": scheduled_area_name,
        "scheduled_eta": scheduled_eta,
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
    lat: float = Query(27.0544, description="User Latitude"),
    lng: float = Query(75.8942, description="User Longitude"),
    mode: str = Query("LOCAL", description="'LOCAL' (Hyperlocal Instant) or 'PAN_INDIA' (National Courier)"),
    locality: Optional[str] = Query(None, description="Optional user locality string"),
    db: AsyncSession = Depends(get_db),
):
    """
    Dynamic All-India Serviceability & Discovery Engine:
    - NO hardcoded locality limits: Works from ANY coordinate or pincode in India.
    - In LOCAL mode: Calculates Haversine distance against all verified shops.
    - If no local shops serve this location (local_shops_count == 0):
      Returns is_area_serviceable = False, a helpful unserviceable message,
      AND Pan-India eligible items so the screen is NEVER dead.
    - If served: Returns is_area_serviceable = True with sorted open shops and rails.
    - Upstash Redis caching enabled with 30s TTL.
    """
    clean_mode = mode.upper().strip()
    cache_key = f"feed:{clean_mode}:{round(lat, 3)}:{round(lng, 3)}:{locality or 'auto'}"

    cached = await get_cached_json(cache_key)
    if cached:
        return cached

    # Query Pan-India products (always available as fallback and national catalog)
    pan_india_stmt = (
        select(ShopInventory, Shop)
        .join(Shop, ShopInventory.shop_id == Shop.id)
        .where(
            and_(
                Shop.is_verified == True,
                or_(
                    ShopInventory.is_pan_india_eligible == True,
                    Shop.delivery_scope.in_(["PAN_INDIA", "BOTH"])
                ),
                ShopInventory.in_stock == True,
                ShopInventory.available_stock > 0
            )
        )
    )
    pan_india_rows = (await db.execute(pan_india_stmt)).all()

    pan_india_items = [_format_inventory_item(inv, shop) for inv, shop in pan_india_rows]

    # Graceful catalog fallback: If vendor inventory has no Pan-India items yet,
    # pull from the Master Brand Catalog so the app is NEVER blank or dead.
    if not pan_india_items:
        master_stmt = select(MasterCatalogItem).limit(30)
        master_rows = (await db.execute(master_stmt)).scalars().all()
        pan_india_items = [
            {
                "id": m.id,
                "shop_id": None,
                "shop_name": "ServoLocal Pan-India Direct",
                "shop_locality": "National Fulfillment Center",
                "shop_is_open": True,
                "master_item_id": m.id,
                "is_not_listed_custom": False,
                "name": m.name,
                "category": m.category,
                "sub_category": m.sub_category,
                "image_url": m.image_url,
                "gallery_images": m.gallery_images or [],
                "default_weight_or_size": m.default_weight_or_size,
                "selling_price": m.mrp,
                "mrp": m.mrp,
                "in_stock": True,
                "available_stock": 100,
                "is_pan_india_eligible": True,
                "estimated_delivery": "3-5 Days (Courier)",
            }
            for m in master_rows
        ]

    clothes_rail = [item for item in pan_india_items if item["category"] == "Clothes"]
    custom_3d_rail = [item for item in pan_india_items if item["category"] in ["Custom/3D", "Handicrafts"]]

    if clean_mode == "PAN_INDIA":
        feed_data = {
            "mode": "PAN_INDIA",
            "is_area_serviceable": True,
            "banner_badge": "Ships All India • 3-5 Days Courier Delivery",
            "all_products": pan_india_items,
            "rails": {
                "clothes_rail": clothes_rail,
                "custom_3d_rail": custom_3d_rail,
            }
        }
        await set_cached_json(cache_key, feed_data, ttl_seconds=30)
        return feed_data

    # ── LOCAL HYPERLOCAL MODE ──────────────────────────────────────────
    shop_stmt = select(Shop).where(Shop.is_verified == True)
    shop_result = await db.execute(shop_stmt)
    all_shops = shop_result.scalars().all()

    served_shops: List[Dict[str, Any]] = []
    served_shop_ids: List[int] = []
    clean_user_locality = (locality or "").strip().lower()

    for s in all_shops:
        is_served, distance = is_within_shop_radius(lat, lng, s.lat, s.lng, s.delivery_radius_km)

        # Multi-Village / Scheduled Neighboring Route Match (e.g. Dundlod -> Balwantpura)
        scheduled_match = None
        if clean_user_locality and getattr(s, "custom_serviceable_areas", None):
            for area_obj in (s.custom_serviceable_areas or []):
                target_name = (area_obj.get("area_name") or "").strip().lower()
                if target_name and (target_name in clean_user_locality or clean_user_locality in target_name):
                    scheduled_match = area_obj
                    break

        if is_served:
            eta = estimate_eta_mins(distance)
            served_shops.append(_format_shop_dict(s, distance_km=distance, eta=eta, is_scheduled_route=False))
            served_shop_ids.append(s.id)
        elif scheduled_match:
            sched_eta = scheduled_match.get("eta_label", "6-7 hrs (Same Day Route)")
            served_shops.append(
                _format_shop_dict(
                    s,
                    distance_km=distance,
                    eta=sched_eta,
                    is_scheduled_route=True,
                    scheduled_area_name=scheduled_match.get("area_name"),
                    scheduled_eta=sched_eta,
                )
            )
            served_shop_ids.append(s.id)

    # Sort shops: Instant Open first, then Scheduled Open, then by distance
    served_shops.sort(key=lambda x: (not x["is_open"], x.get("is_scheduled_route", False), x["distance_km"]))

    # Dynamic Serviceability Check
    is_serviceable = len(served_shops) > 0
    scheduled_only = is_serviceable and all(s.get("is_scheduled_route") for s in served_shops)

    if not is_serviceable:
        area_message = "Instant 15-min delivery is coming soon to your area! Meanwhile, shop Pan-India items or register as the first shop/partner here."
    elif scheduled_only:
        area_message = f"Scheduled route delivery is available in {locality} from nearby partner stores!"
    else:
        area_message = None

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
        "is_area_serviceable": is_serviceable,
        "has_scheduled_routes": any(s.get("is_scheduled_route") for s in served_shops),
        "area_message": area_message,
        "unserviceable_message": area_message,
        "user_coordinates": {"lat": lat, "lng": lng},
        "locality": locality or f"Location ({round(lat, 4)}, {round(lng, 4)})",
        "total_shops_in_radius": len(served_shops),
        "featured_shops": served_shops,
        "scheduled_route_shops": [s for s in served_shops if s.get("is_scheduled_route")],
        "rails": {
            "kirana_rail": kirana_rail[:20],
            "fast_food_rail": fast_food_rail[:20],
            "street_stalls_rail": street_stalls_rail[:20],
            "scheduled_route_rail": [s for s in served_shops if s.get("is_scheduled_route")],
        },
        # All Pan-India products returned so the app is never empty
        "pan_india_items": pan_india_items,
        "pan_india_fallback_items": pan_india_items[:15],
    }

    await set_cached_json(cache_key, feed_data, ttl_seconds=30)
    return feed_data


# ── 2. POST /api/discovery/request-service & /request-area ─────────────

@router.post("/request-service", status_code=status.HTTP_201_CREATED)
@router.post("/request-area", status_code=status.HTTP_201_CREATED)
async def submit_area_demand_request(
    req: AreaDemandSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Demand-aggregation tool:
    Users in unserviceable areas submit their locality and contact info.
    Admin dashboard visualizes demand heatmaps to prioritize next delivery launch zones.
    """
    loc_name = (req.locality_name or req.area_name or f"Location ({round(req.lat, 4)}, {round(req.lng, 4)})").strip()
    contact = (req.phone_or_email or req.email or "unspecified").strip().lower()

    demand = AreaDemandRequest(
        lat=req.lat,
        lng=req.lng,
        locality_name=loc_name,
        pincode=req.pincode.strip() if req.pincode else None,
        phone_or_email=contact,
    )
    db.add(demand)
    await db.commit()
    await db.refresh(demand)

    return {
        "success": True,
        "message": f"Demand recorded for '{loc_name}'! We will alert you the moment ServoLocal delivery launches in your area.",
        "request_id": demand.id,
    }


# ── 3. GET /api/discovery/search-suggest ─────────────────────────────────

@router.get("/search-suggest", status_code=status.HTTP_200_OK)
async def search_suggest(
    q: str = Query(..., min_length=1, description="Search query string"),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Instant search auto-complete across Master Catalog, inventories, and shops.
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
