from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models import Order, OrderItem, Shop, ShopInventory, User
from app.api.auth import decode_token

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


def verify_admin(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = authorization.split(" ")[1]
    decoded = decode_token(token)
    if decoded.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return decoded


class UpdateStatusRequest(BaseModel):
    status: str  # PLACED, PACKING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED


@router.get("/stats")
async def get_admin_stats(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get real platform statistics from PostgreSQL database.
    """
    orders_count = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    shops_count = (await db.execute(select(func.count(Shop.id)))).scalar() or 0
    products_count = (await db.execute(select(func.count(ShopInventory.id)))).scalar() or 0
    total_sales = (await db.execute(select(func.sum(Order.grand_total)))).scalar() or 0.0

    return {
        "admin_email": user.get("email"),
        "total_orders": orders_count,
        "total_shops": shops_count,
        "total_products": products_count,
        "total_sales_inr": round(total_sales, 2),
    }


@router.get("/orders")
async def get_all_orders(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    List all orders in the system for admin oversight.
    """
    res = await db.execute(select(Order).order_by(Order.created_at.desc()).limit(50))
    orders = res.scalars().all()

    out = []
    for o in orders:
        items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))
        items = items_res.scalars().all()
        out.append({
            "id": o.id,
            "order_code": o.order_code,
            "customer_id": o.customer_id,
            "shop_id": o.shop_id,
            "status": o.status,
            "grand_total": o.grand_total,
            "delivery_pin": o.delivery_pin,
            "pickup_pin": o.pickup_pin,
            "delivery_address": o.delivery_address,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items": [
                {
                    "item_name": it.item_name,
                    "weight_or_size": it.weight_or_size,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                }
                for it in items
            ],
        })
    return out


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    payload: UpdateStatusRequest,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update live order status from admin dashboard.
    """
    res = await db.execute(select(Order).where(Order.id == order_id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    order.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(order)

    return {
        "success": True,
        "order_id": order.id,
        "new_status": order.status,
    }

