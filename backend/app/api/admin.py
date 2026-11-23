from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

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
    AppVersionConfig,
    PlatformSetting,
    PromoBanner,
)
from app.api.auth import active_session

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


def verify_admin(session: dict = Depends(active_session)) -> dict:
    if session["role"] not in ("admin",):
        raise HTTPException(status_code=403, detail="Account role does not have access.")
    return session


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
        "platform_earnings": round(await db.scalar(select(func.sum(Order.platform_commission_amount))) or 0.0, 2),
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
    order_counts = dict((await db.execute(select(Order.shop_id, func.count(Order.id)).group_by(Order.shop_id))).all())
    out = []
    for s in shops:
        out.append({
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "is_active": s.is_open,
            "is_approved": s.is_verified,
            "rating": s.rating,
            "commission_pct": s.commission_rate_percent,
            "total_orders": order_counts.get(s.id, 0),
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
    commission_pct: float = Field(ge=0, le=100)


@router.post("/commissions")
async def update_commission(
    payload: CommissionRequest,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    changed = await db.execute(update(Shop).where(func.lower(Shop.category) == payload.category.strip().lower())
                               .values(commission_rate_percent=payload.commission_pct))
    if not changed.rowcount:
        raise HTTPException(404, "No shops in this category.")
    await db.commit()
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
    if target.id == user["id"] and target.is_active:
        raise HTTPException(409, "Use another administrator to suspend this account.")
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
    platform_commission = sum(o.platform_commission_amount for o in orders)
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
                "commission": round(o.platform_commission_amount, 2),
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


# ── 10. OTA Dynamic App Config & Promo Banners (Server-Driven UI) ─────────────

class AppConfigUpdatePayload(BaseModel):
    latest_version: Optional[str] = "1.0.0"
    min_required_version: Optional[str] = "1.0.0"
    force_update: Optional[bool] = False
    update_message: Optional[str] = "ServoLocal is running the latest version."
    playstore_url: Optional[str] = "https://play.google.com/store/apps"
    maintenance_mode: Optional[bool] = False
    maintenance_message: Optional[str] = None
    ticker_text: Optional[str] = None


class PromoBannerPayload(BaseModel):
    id: Optional[int] = None
    title: str
    image_url: str
    target_route: str = "/"
    badge_text: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


@router.get("/app-config")
async def get_admin_app_config(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get full dynamic app configuration, platform settings, and promo banners for OTA admin management.
    """
    config_res = await db.execute(select(AppVersionConfig).limit(1))
    config = config_res.scalar_one_or_none()

    banners_res = await db.execute(
        select(PromoBanner).order_by(PromoBanner.display_order.asc(), PromoBanner.id.desc())
    )
    banners = banners_res.scalars().all()

    ticker_res = await db.execute(select(PlatformSetting).where(PlatformSetting.key == "ticker_text"))
    ticker_setting = ticker_res.scalar_one_or_none()
    ticker_text = (
        ticker_setting.value.get("text")
        if ticker_setting and isinstance(ticker_setting.value, dict)
        else "🎉 Grand Launch Offer! Up to 50% OFF on Local Shops | Free Delivery on Selected Stores"
    )

    return {
        "latest_version": config.latest_version if config else "1.0.0",
        "min_required_version": config.min_required_version if config else "1.0.0",
        "force_update": config.force_update if config else False,
        "update_message": config.update_message if config else "Please update ServoLocal.",
        "playstore_url": config.playstore_url if config else "https://play.google.com/store/apps",
        "maintenance_mode": config.maintenance_mode if config else False,
        "maintenance_message": config.maintenance_message if config else None,
        "ticker_text": ticker_text,
        "banners": [
            {
                "id": b.id,
                "title": b.title,
                "image_url": b.image_url,
                "target_route": b.target_route,
                "badge_text": b.badge_text,
                "is_active": b.is_active,
                "display_order": b.display_order,
            }
            for b in banners
        ],
    }


@router.post("/app-config")
async def update_admin_app_config(
    payload: AppConfigUpdatePayload,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update OTA dynamic app configuration without requiring app releases or rebuilds.
    """
    config_res = await db.execute(select(AppVersionConfig).limit(1))
    config = config_res.scalar_one_or_none()

    if not config:
        config = AppVersionConfig(
            latest_version=payload.latest_version or "1.0.0",
            min_required_version=payload.min_required_version or "1.0.0",
            force_update=bool(payload.force_update),
            update_message=payload.update_message or "Please update ServoLocal.",
            playstore_url=payload.playstore_url or "https://play.google.com/store/apps",
            maintenance_mode=bool(payload.maintenance_mode),
            maintenance_message=payload.maintenance_message,
        )
        db.add(config)
    else:
        if payload.latest_version is not None:
            config.latest_version = payload.latest_version
        if payload.min_required_version is not None:
            config.min_required_version = payload.min_required_version
        if payload.force_update is not None:
            config.force_update = payload.force_update
        if payload.update_message is not None:
            config.update_message = payload.update_message
        if payload.playstore_url is not None:
            config.playstore_url = payload.playstore_url
        if payload.maintenance_mode is not None:
            config.maintenance_mode = payload.maintenance_mode
        config.maintenance_message = payload.maintenance_message

    if payload.ticker_text is not None:
        ticker_res = await db.execute(select(PlatformSetting).where(PlatformSetting.key == "ticker_text"))
        ticker_setting = ticker_res.scalar_one_or_none()
        if not ticker_setting:
            ticker_setting = PlatformSetting(key="ticker_text", value={"text": payload.ticker_text})
            db.add(ticker_setting)
        else:
            ticker_setting.value = {"text": payload.ticker_text}

    await db.commit()
    return {"success": True, "message": "App configuration updated successfully!"}


@router.get("/banners")
async def get_admin_banners(
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    banners_res = await db.execute(select(PromoBanner).order_by(PromoBanner.display_order.asc(), PromoBanner.id.desc()))
    banners = banners_res.scalars().all()
    return [
        {
            "id": b.id,
            "title": b.title,
            "image_url": b.image_url,
            "target_route": b.target_route,
            "badge_text": b.badge_text,
            "is_active": b.is_active,
            "display_order": b.display_order,
        }
        for b in banners
    ]


@router.post("/banners")
async def save_admin_banner(
    payload: PromoBannerPayload,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.id:
        b_res = await db.execute(select(PromoBanner).where(PromoBanner.id == payload.id))
        banner = b_res.scalar_one_or_none()
        if not banner:
            raise HTTPException(status_code=404, detail="Banner not found")
        banner.title = payload.title
        banner.image_url = payload.image_url
        banner.target_route = payload.target_route
        banner.badge_text = payload.badge_text
        banner.is_active = payload.is_active
        banner.display_order = payload.display_order
    else:
        banner = PromoBanner(
            title=payload.title,
            image_url=payload.image_url,
            target_route=payload.target_route,
            badge_text=payload.badge_text,
            is_active=payload.is_active,
            display_order=payload.display_order,
        )
        db.add(banner)

    await db.commit()
    return {"success": True, "message": "Banner saved successfully!"}


@router.delete("/banners/{banner_id}")
async def delete_admin_banner(
    banner_id: int,
    user: dict = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    b_res = await db.execute(select(PromoBanner).where(PromoBanner.id == banner_id))
    banner = b_res.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    await db.delete(banner)
    await db.commit()
    return {"success": True, "message": f"Banner {banner_id} removed"}



