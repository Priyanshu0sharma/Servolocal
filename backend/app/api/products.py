from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from app.db.session import get_db
from app.db.models import MasterCatalogItem, ShopInventory, Shop, ProductImage

router = APIRouter(prefix="/products", tags=["Product Catalog"])


@router.get("/{product_id}")
async def get_product_details(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch comprehensive master product details including variants, specifications,
    and verified brand metadata.
    """
    # 1. First look up in master_catalog_items
    master_res = await db.execute(
        select(MasterCatalogItem).where(MasterCatalogItem.id == product_id)
    )
    product = master_res.scalar_one_or_none()

    # 2. If not found by direct ID in master, check if it's an inventory item id
    if not product:
        inv_res = await db.execute(
            select(ShopInventory).where(ShopInventory.id == product_id)
        )
        inv_item = inv_res.scalar_one_or_none()
        if inv_item and inv_item.master_item_id:
            master_res = await db.execute(
                select(MasterCatalogItem).where(MasterCatalogItem.id == inv_item.master_item_id)
            )
            product = master_res.scalar_one_or_none()

    if not product:
        # Fallback to returning from shop_inventory directly
        inv_res = await db.execute(
            select(ShopInventory).where(ShopInventory.id == product_id)
        )
        fallback_item = inv_res.scalar_one_or_none()
        if not fallback_item:
            raise HTTPException(status_code=404, detail="Product not found")

        return {
            "id": fallback_item.id,
            "master_id": fallback_item.master_item_id or fallback_item.id,
            "name": fallback_item.name,
            "brand": "Local Verified",
            "category": fallback_item.category,
            "sub_category": fallback_item.sub_category,
            "unit": fallback_item.weight_or_size,
            "pack_size": fallback_item.weight_or_size,
            "selling_price": fallback_item.selling_price,
            "mrp": fallback_item.mrp,
            "discount_percent": round(((fallback_item.mrp - fallback_item.selling_price) / fallback_item.mrp) * 100) if fallback_item.mrp > fallback_item.selling_price else 0,
            "image_url": fallback_item.image_url,
            "is_veg": fallback_item.is_veg if fallback_item.is_veg is not None else True,
            "description": f"Fresh and authentic {fallback_item.name} sourced from verified local stores.",
            "gallery_images": fallback_item.gallery_images or [{"url": fallback_item.image_url, "type": "FRONT"}],
            "available_stock": fallback_item.available_stock,
            "in_stock": fallback_item.in_stock,
            "primary_shop_id": fallback_item.shop_id,
        }

    # Fetch gallery images from product_images table
    imgs_res = await db.execute(
        select(ProductImage)
        .where(ProductImage.master_item_id == product.id)
        .order_by(ProductImage.sort_order.asc())
    )
    product_images = imgs_res.scalars().all()

    gallery = [
        {
            "id": img.id,
            "url": img.image_url,
            "type": img.image_type,
            "caption": img.caption or product.name,
            "sort_order": img.sort_order,
        }
        for img in product_images
    ]

    # If product_images table is empty for this item, use product.gallery_images JSON
    if not gallery:
        if isinstance(product.gallery_images, list) and len(product.gallery_images) > 0:
            gallery = [
                {"url": g.get("url", product.image_url), "type": g.get("type", "FRONT"), "caption": g.get("caption", product.name)}
                if isinstance(g, dict) else {"url": str(g), "type": "FRONT", "caption": product.name}
                for g in product.gallery_images
            ]
        else:
            gallery = [{"url": product.image_url, "type": "FRONT", "caption": product.name}]

    # Fetch variants (other items with same brand and category or same base name)
    variants_res = await db.execute(
        select(MasterCatalogItem)
        .where(
            and_(
                MasterCatalogItem.brand == product.brand,
                MasterCatalogItem.category == product.category,
                MasterCatalogItem.id != product.id
            )
        )
        .limit(4)
    )
    sibling_variants = variants_res.scalars().all()
    variants_data = [
        {
            "id": v.id,
            "name": v.name,
            "unit": v.unit or v.default_weight_or_size,
            "selling_price": v.selling_price or v.mrp,
            "mrp": v.mrp,
            "discount_percent": v.discount_percent or 0,
        }
        for v in sibling_variants
    ]

    return {
        "id": product.id,
        "master_id": product.id,
        "barcode": product.barcode,
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "sub_category": product.sub_category,
        "unit": product.unit or product.default_weight_or_size,
        "pack_size": product.pack_size or product.default_weight_or_size,
        "selling_price": product.selling_price or product.mrp,
        "mrp": product.mrp,
        "discount_percent": product.discount_percent or 0,
        "image_url": product.image_url,
        "is_veg": product.is_veg if product.is_veg is not None else True,
        "description": product.description or f"High quality {product.name} from {product.brand}.",
        "gallery_images": gallery,
        "variants": variants_data,
        "status": product.status,
    }


@router.get("/{product_id}/images")
async def get_product_images(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all multi-view gallery photos for a product.
    """
    res = await db.execute(
        select(ProductImage)
        .where(ProductImage.master_item_id == product_id)
        .order_by(ProductImage.sort_order.asc())
    )
    images = res.scalars().all()
    return [
        {
            "id": img.id,
            "url": img.image_url,
            "type": img.image_type,
            "caption": img.caption,
            "sort_order": img.sort_order,
        }
        for img in images
    ]


@router.get("/{product_id}/offers")
async def get_product_offers(
    product_id: int,
    lat: Optional[float] = 27.0544,
    lng: Optional[float] = 75.8942,
    mode: Optional[str] = "ALL",
    db: AsyncSession = Depends(get_db),
):
    """
    The Core ServoLocal Multi-Vendor Comparison Engine:
    Returns all eligible independent shops selling this product, their specific
    prices, available stock, delivery mode, and ETA.
    """
    # 1. Determine master product ID
    master_id = product_id
    master_res = await db.execute(
        select(MasterCatalogItem).where(MasterCatalogItem.id == product_id)
    )
    master_prod = master_res.scalar_one_or_none()

    if not master_prod:
        inv_res = await db.execute(
            select(ShopInventory).where(ShopInventory.id == product_id)
        )
        inv_item = inv_res.scalar_one_or_none()
        if inv_item and inv_item.master_item_id:
            master_id = inv_item.master_item_id
        elif inv_item:
            master_id = inv_item.id

    # 2. Query all shop_inventory rows matching this master item or matching item name
    q = (
        select(ShopInventory, Shop)
        .join(Shop, ShopInventory.shop_id == Shop.id)
        .where(
            and_(
                Shop.is_open == True,
                ShopInventory.in_stock == True,
                or_(
                    ShopInventory.master_item_id == master_id,
                    ShopInventory.id == product_id,
                    (ShopInventory.name == master_prod.name) if master_prod else False
                )
            )
        )
    )

    if mode and mode != "ALL":
        q = q.where(ShopInventory.delivery_mode == mode)

    res = await db.execute(q)
    rows = res.all()

    offers = []
    for inv, shop in rows:
        discount_pct = (
            round(((inv.mrp - inv.selling_price) / inv.mrp) * 100)
            if inv.mrp > inv.selling_price
            else 0
        )

        offers.append({
            "inventory_id": inv.id,
            "shop_id": shop.id,
            "shop_name": shop.name,
            "shop_category": shop.category,
            "shop_rating": shop.rating,
            "is_verified": shop.is_verified,
            "locality_name": shop.locality_name,
            "distance_km": round(shop.delivery_radius_km * 0.3, 1),
            "selling_price": inv.selling_price,
            "mrp": inv.mrp,
            "discount_percent": discount_pct,
            "available_stock": inv.available_stock,
            "in_stock": inv.in_stock,
            "delivery_mode": inv.delivery_mode or "IN_MINUTES",
            "fulfillment_time_slot": inv.fulfillment_time_slot or shop.local_eta_mins,
            "free_delivery_enabled": shop.free_delivery_enabled,
            "min_order_for_free_delivery": shop.min_order_for_free_delivery,
            "base_delivery_fee": shop.base_delivery_fee,
        })

    # Sort offers: lowest price first, then verified stores
    offers.sort(key=lambda x: (x["selling_price"], not x["is_verified"]))

    return {
        "product_id": product_id,
        "master_id": master_id,
        "total_offers": len(offers),
        "offers": offers,
    }

