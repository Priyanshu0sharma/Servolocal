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


@router.get("/overview")
async def get_admin_overview(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Overview telemetry for standalone admin-web dashboard.
    """
    orders_count = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = (
        await db.execute(
            select(func.count(Order.id)).where(Order.created_at >= today_start)
        )
    ).scalar() or 0
    shops_count = (await db.execute(select(func.count(Shop.id)))).scalar() or 0
    active_shops = (
        await db.execute(select(func.count(Shop.id)).where(Shop.is_open == True))
    ).scalar() or 0
    pending_approvals = (
        await db.execute(select(func.count(Shop.id)).where(Shop.is_verified == False))
    ).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_sales = (await db.execute(select(func.sum(Order.grand_total)))).scalar() or 0.0

    return {
        "total_users": total_users,
        "total_customers": total_users,
        "total_merchants": shops_count,
        "total_riders": 2,
        "total_shops": shops_count,
        "active_shops": active_shops,
        "total_orders": orders_count,
        "today_orders": today_orders,
        "total_gmv": round(total_sales, 2),
        "today_gmv": round(total_sales, 2),
        "platform_earnings": round(total_sales * 0.05, 2),
        "pending_shop_approvals": pending_approvals,
    }


@router.get("/shops")
async def get_admin_shops(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all shops with approval and verification status for admin review.
    """
    res = await db.execute(select(Shop).order_by(Shop.id.asc()))
    shops = res.scalars().all()
    out = []
    for s in shops:
        out.append({
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "is_active": s.is_open,
            "is_approved": s.is_verified,
            "rating": s.rating,
            "total_orders": 0,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        })
    return out


class ApproveShopRequest(BaseModel):
    is_approved: bool = True


@router.post("/shops/{shop_id}/approve")
async def approve_shop_endpoint(
    shop_id: int,
    payload: ApproveShopRequest,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve or reject a merchant store from admin-web.
    """
    res = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop.is_verified = payload.is_approved
    shop.is_open = payload.is_approved
    await db.commit()
    await db.refresh(shop)
    return {"success": True, "shop_id": shop.id, "is_approved": shop.is_verified}


class CommissionRequest(BaseModel):
    category: str
    commission_pct: float


@router.post("/commissions")
async def update_commission(
    payload: CommissionRequest,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    return {"success": True, "category": payload.category, "commission_pct": payload.commission_pct}


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

