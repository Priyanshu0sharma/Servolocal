import base64
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.database import get_db
from app.db.models import User, Shop, ShopInventory, MasterCatalogItem
from app.core.security import require_seller
from app.core.storage_r2 import upload_image_to_r2
from app.core.fcm_notify import send_low_stock_alert

router = APIRouter(prefix="/api/seller", tags=["Seller Hub"])


# ── Schemas ─────────────────────────────────────────────────────────────

class ShopSetupRequest(BaseModel):
    name: str = Field(..., min_length=2)
    category: str = Field(..., description="Kirana, Fast Food, Sweets, Clothes, Custom/3D")
    image_url: Optional[str] = None
    is_open: bool = True
    management_mode: str = Field("SELLER_MANAGED", description="SELLER_MANAGED or PARTNER_RUNNER_STALL")
    lat: float
    lng: float
    locality_name: str = Field("Kukas", description="Kukas, Kunda, Amer, etc.")
    delivery_scope: str = Field("LOCAL_ONLY", description="LOCAL_ONLY, PAN_INDIA, or BOTH")
    delivery_radius_km: float = Field(3.0, ge=1.0, le=15.0)
    free_delivery_enabled: bool = True
    min_order_for_free_delivery: float = Field(150.0, ge=50.0)
    base_delivery_fee: float = Field(25.0, ge=0.0)
    seller_upi_id: Optional[str] = None
    custom_serviceable_areas: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class AddFromMasterRequest(BaseModel):
    master_item_id: int
    selling_price: float = Field(..., gt=0)
    stock_quantity: int = Field(50, ge=1)
    is_pan_india_eligible: bool = False


class AddCustomInventoryRequest(BaseModel):
    name: str = Field(..., min_length=2)
    category: str
    sub_category: Optional[str] = None
    selling_price: float = Field(..., gt=0)
    mrp: float = Field(..., gt=0)
    weight_or_size: str = Field("1 unit")
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    stock_quantity: int = Field(50, ge=1)
    low_stock_threshold: int = Field(5, ge=1)
    is_pan_india_eligible: bool = False


# ── 1. POST /api/seller/shop-setup ──────────────────────────────────────

@router.post("/shop-setup", status_code=status.HTTP_200_OK)
async def setup_or_update_shop(
    req: ShopSetupRequest,
    current_user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates or updates the seller's shop profile.
    Configures live GPS coordinates, Blinkit-style free-delivery threshold (₹150+),
    delivery radius slider (1-15 km), and direct UPI ID.
    """
    stmt = select(Shop).where(Shop.owner_id == current_user.id)
    result = await db.execute(stmt)
    shop = result.scalar_one_or_none()

    if not shop:
        shop = Shop(
            owner_id=current_user.id,
            name=req.name.strip(),
            category=req.category.strip(),
            image_url=req.image_url,
            is_open=req.is_open,
            management_mode=req.management_mode,
            lat=req.lat,
            lng=req.lng,
            locality_name=req.locality_name.strip(),
            delivery_scope=req.delivery_scope,
            delivery_radius_km=req.delivery_radius_km,
            free_delivery_enabled=req.free_delivery_enabled,
            min_order_for_free_delivery=req.min_order_for_free_delivery,
            base_delivery_fee=req.base_delivery_fee,
            seller_upi_id=req.seller_upi_id,
            custom_serviceable_areas=req.custom_serviceable_areas or [],
            is_verified=True,
        )
        db.add(shop)
    else:
        shop.name = req.name.strip()
        shop.category = req.category.strip()
        if req.image_url:
            shop.image_url = req.image_url
        shop.is_open = req.is_open
        shop.management_mode = req.management_mode
        shop.lat = req.lat
        shop.lng = req.lng
        shop.locality_name = req.locality_name.strip()
        shop.delivery_scope = req.delivery_scope
        shop.delivery_radius_km = req.delivery_radius_km
        shop.free_delivery_enabled = req.free_delivery_enabled
        shop.min_order_for_free_delivery = req.min_order_for_free_delivery
        shop.base_delivery_fee = req.base_delivery_fee
        shop.custom_serviceable_areas = req.custom_serviceable_areas or []
        if req.seller_upi_id:
            shop.seller_upi_id = req.seller_upi_id

    await db.commit()
    await db.refresh(shop)

    return {
        "success": True,
        "message": "Shop profile updated successfully",
        "shop": {
            "id": shop.id,
            "name": shop.name,
            "category": shop.category,
            "is_open": shop.is_open,
            "lat": shop.lat,
            "lng": shop.lng,
            "locality_name": shop.locality_name,
            "delivery_radius_km": shop.delivery_radius_km,
            "min_order_for_free_delivery": shop.min_order_for_free_delivery,
            "seller_upi_id": shop.seller_upi_id,
            "custom_serviceable_areas": shop.custom_serviceable_areas or [],
        }
    }


# ── 2. POST /api/seller/inventory/add-from-master ───────────────────────

@router.post("/inventory/add-from-master", status_code=status.HTTP_201_CREATED)
async def add_inventory_from_master(
    req: AddFromMasterRequest,
    current_user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    1-Click Master Catalog addition:
    Pulls pre-loaded commercial brand images (Parle-G, Maggi, Amul Milk)
    so seller doesn't need to take photos. Just set selling price & stock!
    """
    # 1. Verify seller has an active shop
    shop_stmt = select(Shop).where(Shop.owner_id == current_user.id)
    shop_res = await db.execute(shop_stmt)
    shop = shop_res.scalar_one_or_none()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete Shop Setup before adding products"
        )

    # 2. Fetch Master item
    master_stmt = select(MasterCatalogItem).where(MasterCatalogItem.id == req.master_item_id)
    master_res = await db.execute(master_stmt)
    master_item = master_res.scalar_one_or_none()
    if not master_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Master Catalog item with ID {req.master_item_id} not found"
        )

    # 3. Check if already exists in shop inventory
    inv_check = select(ShopInventory).where(
        and_(
            ShopInventory.shop_id == shop.id,
            ShopInventory.master_item_id == master_item.id
        )
    )
    existing_inv = (await db.execute(inv_check)).scalar_one_or_none()

    if existing_inv:
        # Update existing
        existing_inv.selling_price = req.selling_price
        existing_inv.available_stock += req.stock_quantity
        existing_inv.total_stock += req.stock_quantity
        existing_inv.in_stock = True
        existing_inv.is_pan_india_eligible = req.is_pan_india_eligible
        await db.commit()
        await db.refresh(existing_inv)
        item_obj = existing_inv
    else:
        # Create new
        new_item = ShopInventory(
            shop_id=shop.id,
            master_item_id=master_item.id,
            is_not_listed_custom=False,
            name=master_item.name,
            category=master_item.category,
            sub_category=master_item.sub_category,
            image_url=master_item.image_url,
            gallery_images=master_item.gallery_images or [],
            variants=getattr(master_item, "variants", []) or [],
            is_veg=getattr(master_item, "is_veg", True),
            weight_or_size=master_item.default_weight_or_size,
            selling_price=req.selling_price,
            mrp=master_item.mrp,
            total_stock=req.stock_quantity,
            sold_count=0,
            available_stock=req.stock_quantity,
            low_stock_threshold=5,
            in_stock=True,
            is_pan_india_eligible=req.is_pan_india_eligible
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        item_obj = new_item

    return {
        "success": True,
        "message": f"'{master_item.name}' added to inventory",
        "item": {
            "id": item_obj.id,
            "name": item_obj.name,
            "selling_price": item_obj.selling_price,
            "available_stock": item_obj.available_stock,
            "image_url": item_obj.image_url
        }
    }


# ── 3. POST /api/seller/inventory/add-custom ────────────────────────────

@router.post("/inventory/add-custom", status_code=status.HTTP_201_CREATED)
async def add_custom_inventory(
    req: AddCustomInventoryRequest,
    current_user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    '+ Item Not Listed' upload button for clothes, sweets, and 3D prints.
    Supports instant upload to Cloudflare R2 bucket.
    """
    shop_stmt = select(Shop).where(Shop.owner_id == current_user.id)
    shop_res = await db.execute(shop_stmt)
    shop = shop_res.scalar_one_or_none()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop profile required before adding items"
        )

    # Process photo upload if provided via base64
    final_image_url = req.image_url or "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500"

    if req.image_base64:
        try:
            # Strip header if present (e.g. data:image/jpeg;base64,...)
            raw_b64 = req.image_base64.split(",")[-1]
            image_bytes = base64.b64decode(raw_b64)
            filename = f"custom_{req.name.replace(' ', '_')[:20]}.jpg"
            final_image_url = upload_image_to_r2(
                file_bytes=image_bytes,
                filename=filename,
                content_type="image/jpeg",
                folder="custom-seller-items"
            )
        except Exception as e:
            print(f"[IMAGE UPLOAD ERROR] {e}. Falling back to provided URL.")

    custom_item = ShopInventory(
        shop_id=shop.id,
        master_item_id=None,
        is_not_listed_custom=True,
        name=req.name.strip(),
        category=req.category.strip(),
        sub_category=req.sub_category.strip() if req.sub_category else None,
        image_url=final_image_url,
        gallery_images=[final_image_url],
        weight_or_size=req.weight_or_size.strip(),
        selling_price=req.selling_price,
        mrp=req.mrp,
        total_stock=req.stock_quantity,
        sold_count=0,
        available_stock=req.stock_quantity,
        low_stock_threshold=req.low_stock_threshold,
        in_stock=True,
        is_pan_india_eligible=req.is_pan_india_eligible,
    )
    db.add(custom_item)
    await db.commit()
    await db.refresh(custom_item)

    return {
        "success": True,
        "message": f"Custom item '{custom_item.name}' added successfully",
        "item": {
            "id": custom_item.id,
            "name": custom_item.name,
            "category": custom_item.category,
            "selling_price": custom_item.selling_price,
            "image_url": custom_item.image_url,
            "is_pan_india_eligible": custom_item.is_pan_india_eligible
        }
    }


# ── 4. GET /api/seller/inventory ────────────────────────────────────────

@router.get("/inventory", status_code=status.HTTP_200_OK)
async def get_seller_inventory(
    current_user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists all inventory items with low-stock warnings.
    Triggers FCM push alerts if any item has critically low stock.
    """
    shop_stmt = select(Shop).where(Shop.owner_id == current_user.id)
    shop_res = await db.execute(shop_stmt)
    shop = shop_res.scalar_one_or_none()
    if not shop:
        return {"items": [], "stats": {"total_items": 0, "low_stock_count": 0}}

    inv_stmt = select(ShopInventory).where(ShopInventory.shop_id == shop.id).order_by(ShopInventory.created_at.desc())
    inv_res = await db.execute(inv_stmt)
    items = inv_res.scalars().all()

    items_list = []
    low_stock_count = 0

    for item in items:
        is_low = item.available_stock <= item.low_stock_threshold
        if is_low:
            low_stock_count += 1
            # Dispatch low stock FCM alert if token registered
            if current_user.fcm_token:
                send_low_stock_alert(current_user.fcm_token, shop.name, item.name, item.available_stock)

        items_list.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "sub_category": item.sub_category,
            "selling_price": item.selling_price,
            "mrp": item.mrp,
            "available_stock": item.available_stock,
            "total_stock": item.total_stock,
            "low_stock_threshold": item.low_stock_threshold,
            "is_low_stock": is_low,
            "in_stock": item.in_stock,
            "is_not_listed_custom": item.is_not_listed_custom,
            "is_pan_india_eligible": item.is_pan_india_eligible,
            "weight_or_size": item.weight_or_size,
            "variants": getattr(item, "variants", []) or [],
            "is_veg": getattr(item, "is_veg", True),
            "image_url": item.image_url,
        })

    return {
        "shop": {
            "id": shop.id,
            "name": shop.name,
            "is_open": shop.is_open,
            "locality": shop.locality_name,
        },
        "stats": {
            "total_items": len(items_list),
            "low_stock_count": low_stock_count,
            "total_inventory_value": sum(i["selling_price"] * i["available_stock"] for i in items_list),
        },
        "items": items_list
    }
