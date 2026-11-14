from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import (
    User,
    Shop,
    ShopInventory,
    MasterCatalogItem,
    Order,
    OrderItem,
    OrderEvent,
    WalletLedger,
)
from app.api.auth import decode_token

router = APIRouter(prefix="/seller", tags=["Seller Hub"])


def get_current_seller(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    token = authorization.split(" ")[1]
    decoded = decode_token(token)
    if decoded.get("role") not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Access denied. Merchant account required.")
    return decoded


class ShopSetupPayload(BaseModel):
    name: str
    category: str
    image_url: Optional[str] = None
    is_open: bool = True
    management_mode: Optional[str] = "DIRECT_MERCHANT"
    lat: float = 27.0544
    lng: float = 75.8942
    locality_name: Optional[str] = "Local Area"
    delivery_scope: str = "LOCAL_ONLY"
    delivery_radius_km: float = 5.0
    free_delivery_enabled: bool = True
    min_order_for_free_delivery: float = 150.0
    base_delivery_fee: float = 15.0
    seller_upi_id: Optional[str] = None


class AddFromMasterPayload(BaseModel):
    master_item_id: int
    selling_price: float
    stock_quantity: int = 50
    is_pan_india_eligible: bool = False


class AddCustomItemPayload(BaseModel):
    name: str
    category: str
    sub_category: Optional[str] = None
    selling_price: float
    mrp: float
    weight_or_size: str
    image_url: Optional[str] = None
    stock_quantity: int = 50
    low_stock_threshold: int = 10
    is_pan_india_eligible: bool = False


class UpdateInventoryItemPayload(BaseModel):
    selling_price: Optional[float] = None
    available_stock: Optional[int] = None
    in_stock: Optional[bool] = None
    is_pan_india_eligible: Optional[bool] = None
    low_stock_threshold: Optional[int] = None


class UpdateOrderStatusPayload(BaseModel):
    status: str  # ACCEPTED_BY_SHOP, PREPARING, READY_FOR_PICKUP, REJECTED


class ToggleShopPayload(BaseModel):
    is_open: Optional[bool] = None


@router.post("/shop-setup")
async def setup_or_update_shop(
    payload: ShopSetupPayload,
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Setup or update shop configuration in Neon DB for authenticated merchant.
    """
    seller_id = seller.get("id")
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == seller_id))
    shop = shop_res.scalar_one_or_none()

    if not shop:
        shop = Shop(
            owner_id=seller_id,
            name=payload.name.strip(),
            category=payload.category.strip(),
            image_url=payload.image_url,
            is_open=payload.is_open,
            rating=5.0,
            management_mode=payload.management_mode or "DIRECT_MERCHANT",
            lat=payload.lat,
            lng=payload.lng,
            locality_name=payload.locality_name.strip(),
            delivery_scope=payload.delivery_scope,
            delivery_radius_km=payload.delivery_radius_km,
            free_delivery_enabled=payload.free_delivery_enabled,
            min_order_for_free_delivery=payload.min_order_for_free_delivery,
            base_delivery_fee=payload.base_delivery_fee,
            seller_upi_id=payload.seller_upi_id,
            commission_rate_percent=5.0,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(shop)
    else:
        shop.name = payload.name.strip()
        shop.category = payload.category.strip()
        if payload.image_url:
            shop.image_url = payload.image_url
        shop.is_open = payload.is_open
        shop.lat = payload.lat
        shop.lng = payload.lng
        shop.locality_name = payload.locality_name.strip()
        shop.delivery_scope = payload.delivery_scope
        shop.delivery_radius_km = payload.delivery_radius_km
        shop.free_delivery_enabled = payload.free_delivery_enabled
        shop.min_order_for_free_delivery = payload.min_order_for_free_delivery
        shop.base_delivery_fee = payload.base_delivery_fee
        if payload.seller_upi_id:
            shop.seller_upi_id = payload.seller_upi_id

    await db.commit()
    await db.refresh(shop)

    return {
        "success": True,
        "message": "Shop configuration saved successfully!",
        "shop": {
            "id": shop.id,
            "name": shop.name,
            "category": shop.category,
            "image_url": shop.image_url,
            "is_open": shop.is_open,
            "lat": shop.lat,
            "lng": shop.lng,
            "locality_name": shop.locality_name,
            "delivery_radius_km": shop.delivery_radius_km,
            "free_delivery_enabled": shop.free_delivery_enabled,
            "min_order_for_free_delivery": shop.min_order_for_free_delivery,
            "base_delivery_fee": shop.base_delivery_fee,
        },
    }


@router.get("/inventory")
async def get_shop_inventory(
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch the merchant's real live inventory list from shop_inventory.
    """
    seller_id = seller.get("id")
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == seller_id))
    shop = shop_res.scalar_one_or_none()

    if not shop:
        # Fallback to shop 1 or first shop if admin / onboarding
        shop_res = await db.execute(select(Shop).order_by(Shop.id.asc()).limit(1))
        shop = shop_res.scalar_one_or_none()

    if not shop:
        return []

    inv_res = await db.execute(
        select(ShopInventory)
        .where(ShopInventory.shop_id == shop.id)
        .order_by(ShopInventory.id.desc())
    )
    items = inv_res.scalars().all()

    return [
        {
            "id": i.id,
            "shop_id": i.shop_id,
            "master_item_id": i.master_item_id,
            "is_not_listed_custom": i.is_not_listed_custom,
            "name": i.name,
            "category": i.category,
            "sub_category": i.sub_category,
            "image_url": i.image_url,
            "weight_or_size": i.weight_or_size,
            "selling_price": i.selling_price,
            "mrp": i.mrp,
            "total_stock": i.total_stock,
            "available_stock": i.available_stock,
            "sold_count": i.sold_count,
            "low_stock_threshold": i.low_stock_threshold,
            "is_low_stock": i.available_stock <= i.low_stock_threshold,
            "in_stock": i.in_stock and i.available_stock > 0,
            "is_pan_india_eligible": i.is_pan_india_eligible,
            "delivery_mode": i.delivery_mode,
            "fulfillment_time_slot": i.fulfillment_time_slot,
        }
        for i in items
    ]


@router.post("/inventory/add-from-master")
async def add_inventory_from_master(
    payload: AddFromMasterPayload,
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Adds an existing verified Master Catalog item directly to the merchant's inventory.
    """
    seller_id = seller.get("id")
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == seller_id))
    shop = shop_res.scalar_one_or_none()

    if not shop:
        shop = (await db.execute(select(Shop).order_by(Shop.id.asc()).limit(1))).scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=400, detail="Please set up your shop before adding inventory.")

    master_res = await db.execute(
        select(MasterCatalogItem).where(MasterCatalogItem.id == payload.master_item_id)
    )
    master_item = master_res.scalar_one_or_none()
    if not master_item:
        raise HTTPException(status_code=404, detail="Master catalog item not found.")

    # Check if item already exists in shop's inventory
    existing_res = await db.execute(
        select(ShopInventory).where(
            ShopInventory.shop_id == shop.id,
            ShopInventory.master_item_id == master_item.id,
        )
    )
    existing = existing_res.scalar_one_or_none()

    if existing:
        existing.selling_price = payload.selling_price
        existing.available_stock += payload.stock_quantity
        existing.total_stock += payload.stock_quantity
        existing.in_stock = True
        existing.is_pan_india_eligible = payload.is_pan_india_eligible
        await db.commit()
        await db.refresh(existing)
        return {"success": True, "message": "Item stock updated in your inventory!", "item_id": existing.id}

    new_inv = ShopInventory(
        shop_id=shop.id,
        master_item_id=master_item.id,
        is_not_listed_custom=False,
        name=master_item.name,
        category=master_item.category,
        sub_category=master_item.sub_category,
        image_url=master_item.image_url,
        gallery_images=master_item.gallery_images or [],
        weight_or_size=master_item.default_weight_or_size or "1 Unit",
        selling_price=payload.selling_price,
        mrp=master_item.mrp,
        total_stock=payload.stock_quantity,
        available_stock=payload.stock_quantity,
        sold_count=0,
        low_stock_threshold=10,
        in_stock=payload.stock_quantity > 0,
        is_pan_india_eligible=payload.is_pan_india_eligible,
        is_veg=master_item.is_veg,
        delivery_mode="PAN_INDIA" if payload.is_pan_india_eligible else "IN_MINUTES",
        fulfillment_time_slot="10-15 Mins",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_inv)
    await db.commit()
    await db.refresh(new_inv)

    return {
        "success": True,
        "message": f"{master_item.name} added to your shop inventory!",
        "item_id": new_inv.id,
    }


@router.post("/inventory/add-custom")
async def add_custom_inventory(
    payload: AddCustomItemPayload,
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Adds a custom unlisted item directly to the merchant's inventory.
    """
    seller_id = seller.get("id")
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == seller_id))
    shop = shop_res.scalar_one_or_none()

    if not shop:
        shop = (await db.execute(select(Shop).order_by(Shop.id.asc()).limit(1))).scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=400, detail="Please set up your shop first.")

    image_url = payload.image_url or "https://pub-8897640d3c294b099af1aa1be730700b.r2.dev/products/placeholder.jpg"

    new_inv = ShopInventory(
        shop_id=shop.id,
        master_item_id=None,
        is_not_listed_custom=True,
        name=payload.name.strip(),
        category=payload.category.strip(),
        sub_category=payload.sub_category.strip() if payload.sub_category else None,
        image_url=image_url,
        gallery_images=[],
        weight_or_size=payload.weight_or_size.strip(),
        selling_price=payload.selling_price,
        mrp=payload.mrp,
        total_stock=payload.stock_quantity,
        available_stock=payload.stock_quantity,
        sold_count=0,
        low_stock_threshold=payload.low_stock_threshold or 10,
        in_stock=payload.stock_quantity > 0,
        is_pan_india_eligible=payload.is_pan_india_eligible,
        is_veg=True,
        delivery_mode="PAN_INDIA" if payload.is_pan_india_eligible else "IN_MINUTES",
        fulfillment_time_slot="10-15 Mins",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_inv)
    await db.commit()
    await db.refresh(new_inv)

    return {
        "success": True,
        "message": f"Custom item '{payload.name}' added to inventory!",
        "item_id": new_inv.id,
    }


@router.patch("/inventory/{item_id}")
async def update_inventory_item(
    item_id: int,
    payload: UpdateInventoryItemPayload,
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates price, stock count, and availability of an inventory item.
    """
    seller_id = seller.get("id")
    res = await db.execute(select(ShopInventory).where(ShopInventory.id == item_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    if payload.selling_price is not None:
        item.selling_price = max(1.0, payload.selling_price)
    if payload.available_stock is not None:
        item.available_stock = max(0, payload.available_stock)
        item.in_stock = item.available_stock > 0
    if payload.in_stock is not None:
        item.in_stock = payload.in_stock
    if payload.is_pan_india_eligible is not None:
        item.is_pan_india_eligible = payload.is_pan_india_eligible
    if payload.low_stock_threshold is not None:
        item.low_stock_threshold = payload.low_stock_threshold

    await db.commit()
    await db.refresh(item)
    return {"success": True, "message": "Inventory item updated!", "item_id": item.id}


@router.get("/orders")
async def get_seller_orders(
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all incoming and active orders for this merchant shop.
    """
    seller_id = seller.get("id")
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == seller_id))
    shop = shop_res.scalar_one_or_none()

    if not shop:
        shop = (await db.execute(select(Shop).order_by(Shop.id.asc()).limit(1))).scalar_one_or_none()

    if not shop:
        return {"orders": []}

    orders_res = await db.execute(
        select(Order)
        .where(Order.shop_id == shop.id)
        .order_by(Order.created_at.desc())
        .limit(50)
    )
    orders = orders_res.scalars().all()

    out = []
    for o in orders:
        items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))
        items = items_res.scalars().all()

        customer_res = await db.execute(select(User).where(User.id == o.customer_id))
        cust = customer_res.scalar_one_or_none()

        out.append({
            "id": o.id,
            "order_code": o.order_code,
            "customer_name": cust.name if cust else "Valued Customer",
            "customer_phone": cust.email if cust else "",
            "delivery_address": o.delivery_address,
            "status": o.status,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "items_total": o.items_total,
            "delivery_fee": o.delivery_fee,
            "platform_fee": o.platform_fee,
            "grand_total": o.grand_total,
            "pickup_pin": o.pickup_pin,
            "delivery_pin": o.delivery_pin,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items": [
                {
                    "id": item.id,
                    "item_name": item.item_name,
                    "weight_or_size": item.weight_or_size,
                    "unit_price": item.unit_price,
                    "quantity": item.quantity,
                    "total_price": item.total_price,
                }
                for item in items
            ],
        })

    return {"orders": out}


@router.post("/orders/{order_id}/status")
async def update_seller_order_status(
    order_id: int,
    payload: UpdateOrderStatusPayload,
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Validates and updates order state (ACCEPTED_BY_SHOP, PREPARING, READY_FOR_PICKUP, REJECTED).
    Logs event into order_events table.
    """
    valid_transitions = [
        "ACCEPTED",
        "ACCEPTED_BY_SHOP",
        "CONFIRMED",
        "PREPARING",
        "READY_FOR_PICKUP",
        "REJECTED",
        "CANCELLED",
    ]
    new_status = payload.status.upper().strip()

    if new_status not in valid_transitions:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    order_res = await db.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)

    # Add audit event
    event = OrderEvent(
        order_id=order.id,
        status=new_status,
        note=f"Status updated by shop merchant to {new_status}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()

    return {"success": True, "message": f"Order status updated to {new_status}!"}


@router.post("/shop-toggle")
async def toggle_shop_open(
    payload: ToggleShopPayload,
    seller: dict = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """
    Toggles shop status between Open and Closed.
    """
    seller_id = seller.get("id")
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == seller_id))
    shop = shop_res.scalar_one_or_none()

    if not shop:
        shop = (await db.execute(select(Shop).order_by(Shop.id.asc()).limit(1))).scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found.")

    if payload.is_open is not None:
        shop.is_open = payload.is_open
    else:
        shop.is_open = not shop.is_open

    await db.commit()
    return {"success": True, "is_open": shop.is_open}

