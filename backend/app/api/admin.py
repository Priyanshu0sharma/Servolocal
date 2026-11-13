from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models import (
    Order,
    OrderItem,
    Shop,
    ShopInventory,
    User,
    PartnerProfile,
    MasterCatalogItem,
    OrderEvent,
    WalletLedger,
)
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
    today_sales = (
        await db.execute(
            select(func.sum(Order.grand_total)).where(Order.created_at >= today_start)
        )
    ).scalar() or 0.0
    shops_count = (await db.execute(select(func.count(Shop.id)))).scalar() or 0
    active_shops = (
        await db.execute(select(func.count(Shop.id)).where(Shop.is_open == True))
    ).scalar() or 0
    pending_approvals = (
        await db.execute(select(func.count(Shop.id)).where(Shop.is_verified == False))
    ).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_customers = (await db.execute(select(func.count(User.id)).where(User.role == "customer"))).scalar() or 0
    total_merchants = (await db.execute(select(func.count(User.id)).where(User.role == "seller"))).scalar() or 0
    total_riders = (await db.execute(select(func.count(User.id)).where(User.role.in_(["partner", "rider"])))).scalar() or 0
    total_sales = (await db.execute(select(func.sum(Order.grand_total)))).scalar() or 0.0

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_merchants": total_merchants,
        "total_riders": total_riders,
        "total_shops": shops_count,
        "active_shops": active_shops,
        "total_orders": orders_count,
        "today_orders": today_orders,
        "total_gmv": round(total_sales, 2),
        "today_gmv": round(today_sales, 2),
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


# ─── USER & PARTNER MANAGEMENT ─────────────────────────────────────────────

@router.get("/users")
async def get_admin_users(
    role: Optional[str] = None,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    List customers, merchants, and delivery partners with wallet balances & statuses.
    """
    query = select(User).order_by(User.id.desc()).limit(100)
    if role:
        query = query.where(User.role == role)
    res = await db.execute(query)
    users = res.scalars().all()

    out = []
    for u in users:
        out.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "wallet_balance": round(u.wallet_balance or 0.0, 2),
            "servo_coins": u.servo_coins or 0,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    return out


@router.post("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Activate or suspend a user account.
    """
    res = await db.execute(select(User).where(User.id == user_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = not target.is_active
    await db.commit()
    return {"success": True, "user_id": target.id, "is_active": target.is_active}


# ─── MASTER PRODUCT CATALOG MANAGEMENT ────────────────────────────────────

class MasterItemCreatePayload(BaseModel):
    name: str
    brand: str = "Local"
    category: str
    sub_category: str
    default_weight_or_size: str = "1 Unit"
    mrp: float
    selling_price: Optional[float] = None
    discount_percent: Optional[float] = 0.0
    image_url: str
    is_veg: bool = True
    description: Optional[str] = None


@router.get("/catalog")
async def get_admin_catalog(
    q: Optional[str] = None,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    List master catalog products for platform catalog management.
    """
    query = select(MasterCatalogItem).order_by(MasterCatalogItem.id.desc()).limit(100)
    if q:
        query = query.where(MasterCatalogItem.name.ilike(f"%{q.strip()}%"))
    res = await db.execute(query)
    items = res.scalars().all()

    return [
        {
            "id": it.id,
            "name": it.name,
            "brand": it.brand,
            "category": it.category,
            "sub_category": it.sub_category,
            "default_weight_or_size": it.default_weight_or_size,
            "mrp": it.mrp,
            "selling_price": it.selling_price or it.mrp,
            "discount_percent": it.discount_percent or 0.0,
            "image_url": it.image_url,
            "is_veg": it.is_veg,
            "description": it.description,
            "created_at": it.created_at.isoformat() if it.created_at else None,
        }
        for it in items
    ]


@router.post("/catalog")
async def create_admin_catalog_item(
    payload: MasterItemCreatePayload,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a new verified product to the platform master catalog.
    """
    item = MasterCatalogItem(
        name=payload.name.strip(),
        brand=payload.brand.strip(),
        category=payload.category.strip(),
        sub_category=payload.sub_category.strip(),
        default_weight_or_size=payload.default_weight_or_size.strip(),
        mrp=payload.mrp,
        selling_price=payload.selling_price or payload.mrp,
        discount_percent=payload.discount_percent or 0.0,
        image_url=payload.image_url.strip(),
        is_veg=payload.is_veg,
        description=payload.description.strip() if payload.description else None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"success": True, "item_id": item.id, "message": "Master product created successfully"}


# ─── SETTLEMENTS & AUDITS ─────────────────────────────────────────────────

@router.get("/settlements")
async def get_admin_settlements(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Financial settlements, merchant payouts, and delivery partner ledgers.
    """
    orders_res = await db.execute(select(Order).order_by(Order.id.desc()).limit(100))
    orders = orders_res.scalars().all()

    total_gmv = sum(o.grand_total for o in orders)
    platform_commission = sum(o.platform_commission_amount or (o.grand_total * 0.05) for o in orders)
    partner_payouts = sum(o.partner_earning_amount or 25.0 for o in orders if o.status == "DELIVERED")

    return {
        "total_gmv": round(total_gmv, 2),
        "platform_commission": round(platform_commission, 2),
        "partner_payouts_completed": round(partner_payouts, 2),
        "recent_transactions": [
            {
                "order_id": o.id,
                "order_code": o.order_code,
                "amount": o.grand_total,
                "commission": round(o.platform_commission_amount or (o.grand_total * 0.05), 2),
                "partner_earning": o.partner_earning_amount or 25.0,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "status": o.status,
                "date": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders[:25]
        ],
    }


@router.get("/audits")
async def get_admin_audits(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream live order lifecycle events and audit notes.
    """
    events_res = await db.execute(
        select(OrderEvent).order_by(OrderEvent.created_at.desc()).limit(60)
    )
    events = events_res.scalars().all()

    return [
        {
            "id": e.id,
            "order_id": e.order_id,
            "status": e.status,
            "note": e.note,
            "timestamp": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


