from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.session import get_db
from app.db.models import Shop, ShopInventory, MasterCatalogItem

router = APIRouter(prefix="/discovery", tags=["Discovery"])


@router.get("/feed")
async def get_discovery_feed(
    lat: float = 27.0544,
    lng: float = 75.8942,
    mode: str = "LOCAL",
    locality: Optional[str] = "Kukas, Jaipur",
    db: AsyncSession = Depends(get_db),
):
    """
    Hyperlocal discovery feed directly querying real PostgreSQL database for
    active shops and products.
    """
    try:
        # Fetch real shops from DB
        shops_res = await db.execute(select(Shop).order_by(Shop.rating.desc()))
        db_shops = shops_res.scalars().all()

        # Fetch real inventory products prioritizing verified master catalog products
        inv_res = await db.execute(
            select(ShopInventory)
            .order_by(
                ShopInventory.master_item_id.desc().nullslast(),
                ShopInventory.id.desc()
            )
            .limit(120)
        )
        db_inventory = inv_res.scalars().all()

        seen_product_names = set()
        products_data = []
        for p in db_inventory:
            norm_name = p.name.strip().lower()
            if norm_name in seen_product_names:
                continue
            seen_product_names.add(norm_name)
            products_data.append({
                "id": p.master_item_id or p.id,
                "inventory_id": p.id,
                "name": p.name,
                "category": p.category,
                "sub_category": p.sub_category,
                "unit": p.weight_or_size,
                "default_weight_or_size": p.weight_or_size,
                "selling_price": p.selling_price,
                "mrp": p.mrp,
                "image_url": p.image_url,
                "is_veg": p.is_veg,
                "in_stock": p.in_stock,
                "available_stock": p.available_stock,
                "shop_id": p.shop_id,
                "local_eta_mins": p.fulfillment_time_slot or "⚡ 10 mins",
                "delivery_mode": p.delivery_mode or "IN_MINUTES",
            })

        return {
            "mode": mode,
            "is_area_serviceable": True,
            "user_locality": locality,
            "banner_badge": "⚡ 10-15 Min Delivery",
            "message": f"Delivering live from {len(shops_data)} local stores near {locality}",
            "shops": shops_data,
            "all_products": products_data,
            "rails": {
                "featured_shops": shops_data,
                "popular_products": products_data[:8],
            },
        }
    except Exception as e:
        # Graceful fallback to guarantee uptime
        return {
            "mode": mode,
            "is_area_serviceable": True,
            "user_locality": locality,
            "banner_badge": "⚡ 10-15 Min Delivery",
            "message": f"Delivering live from local stores near {locality}",
            "shops": [],
            "all_products": [],
        }


@router.get("/search-suggest")
async def search_suggest(
    q: str = Query(..., min_length=1),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Real database search autocomplete querying shop_inventory & master_catalog_items.
    """
    clean_q = f"%{q.lower().strip()}%"
    try:
        res = await db.execute(
            select(ShopInventory)
            .where(
                or_(
                    ShopInventory.name.ilike(clean_q),
                    ShopInventory.category.ilike(clean_q),
                    ShopInventory.sub_category.ilike(clean_q),
                )
            )
            .limit(15)
        )
        items = res.scalars().all()
        seen_names = set()
        products_out = []
        for p in items:
            normalized_name = p.name.strip().lower()
            if normalized_name not in seen_names:
                seen_names.add(normalized_name)
                products_out.append({
                    "id": p.master_item_id or p.id,
                    "name": p.name,
                    "category": p.category,
                    "sub_category": p.sub_category,
                    "selling_price": p.selling_price,
                    "mrp": p.mrp,
                    "image_url": p.image_url,
                    "weight_or_size": p.weight_or_size,
                    "shop_id": p.shop_id,
                })
        return {
            "query": q,
            "count": len(products_out),
            "products": products_out,
        }
    except Exception:
        return {"query": q, "count": 0, "products": []}
