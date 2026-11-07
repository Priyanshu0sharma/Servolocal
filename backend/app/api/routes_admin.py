from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_

from app.db.database import get_db
from app.db.models import User, Shop, Order, WalletLedger, AreaDemandRequest, AppVersionConfig, PromoBanner
from app.core.security import require_admin
from app.core.fcm_notify import send_push_notification

router = APIRouter(prefix="/api/admin", tags=["Super Admin Control Room"])


# ── Schemas ─────────────────────────────────────────────────────────────

class VerifyShopRequest(BaseModel):
    is_verified: bool = True
    commission_rate_percent: Optional[float] = Field(None, ge=0.0, le=50.0)


class UpdateCommissionRequest(BaseModel):
    category: str
    commission_rate_percent: float = Field(..., ge=0.0, le=50.0)


class PushAppUpdateRequest(BaseModel):
    latest_version: str = "1.0.1"
    min_required_version: str = "1.0.0"
    force_update: bool = False
    update_message: str = "A brand new version of ServoLocal is available with performance improvements!"
    playstore_url: str = "https://play.google.com/store/apps/details?id=in.servolocal.app"
    maintenance_mode: bool = False
    maintenance_message: Optional[str] = "ServoLocal is undergoing scheduled speed optimizations."
    broadcast_push: bool = True


class PromoBannerCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    image_url: str = Field(..., min_length=5)
    target_route: str = "/"
    badge_text: Optional[str] = "SPECIAL OFFER"
    is_active: bool = True
    display_order: int = 0


# ── Helper for Public App Config ─────────────────────────────────────────

async def fetch_app_config_data(db: AsyncSession) -> Dict[str, Any]:
    """Helper used by both public /api/app-config and /api/admin/app-config"""
    cfg_stmt = select(AppVersionConfig).order_by(AppVersionConfig.id.desc()).limit(1)
    cfg = (await db.execute(cfg_stmt)).scalar_one_or_none()

    banners_stmt = select(PromoBanner).where(PromoBanner.is_active == True).order_by(PromoBanner.display_order.asc())
    banners = (await db.execute(banners_stmt)).scalars().all()

    return {
        "success": True,
        "app_version": {
            "latest_version": cfg.latest_version if cfg else "1.0.0",
            "min_required_version": cfg.min_required_version if cfg else "1.0.0",
            "force_update": cfg.force_update if cfg else False,
            "update_message": cfg.update_message if cfg else "Welcome to ServoLocal High-Speed Local Commerce!",
            "playstore_url": cfg.playstore_url if cfg else "https://play.google.com/store/apps/details?id=in.servolocal.app",
            "maintenance_mode": cfg.maintenance_mode if cfg else False,
            "maintenance_message": cfg.maintenance_message if cfg else "ServoLocal is undergoing scheduled speed optimizations.",
            "last_updated": cfg.updated_at.isoformat() if (cfg and cfg.updated_at) else None,
        },
        "banners": [
            {
                "id": b.id,
                "title": b.title,
                "image_url": b.image_url,
                "target_route": b.target_route,
                "badge_text": b.badge_text,
                "display_order": b.display_order,
            }
            for b in banners
        ],
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


# ── 1. GET /api/admin/overview & /api/admin/dashboard-stats ─────────────

@router.get("/overview", status_code=status.HTTP_200_OK)
@router.get("/dashboard-stats", status_code=status.HTTP_200_OK)
async def get_admin_overview(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Super Admin Master Command Center Overview:
    - Real-time GMV, platform fees, and vendor commissions
    - Order radar (total, active, completed, cancelled)
    - Shop counts (total, verified, pending approval, open now)
    - User base breakdown (customers, sellers, delivery partners)
    - Area service expansion requests from unserviceable zones
    - Vendor negative dues ledger & auto-locked account radar (-₹200 limit)
    """
    # 1. Total Orders & Financials
    fin_stmt = select(
        func.count(Order.id),
        func.coalesce(func.sum(Order.grand_total), 0.0),
        func.coalesce(func.sum(Order.platform_fee), 0.0),
        func.coalesce(func.sum(Order.platform_commission_amount), 0.0),
    )
    fin_res = (await db.execute(fin_stmt)).first()
    total_orders, total_gmv, total_platform_fees, total_commissions = fin_res

    # 2. Orders by Status
    active_orders_stmt = select(func.count(Order.id)).where(
        Order.status.in_(["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"])
    )
    active_orders = (await db.execute(active_orders_stmt)).scalar() or 0

    delivered_orders_stmt = select(func.count(Order.id)).where(Order.status == "DELIVERED")
    delivered_orders = (await db.execute(delivered_orders_stmt)).scalar() or 0

    cancelled_orders_stmt = select(func.count(Order.id)).where(Order.status == "CANCELLED")
    cancelled_orders = (await db.execute(cancelled_orders_stmt)).scalar() or 0

    # 3. Shop Breakdown
    total_shops = (await db.execute(select(func.count(Shop.id)))).scalar() or 0
    verified_shops = (await db.execute(select(func.count(Shop.id)).where(Shop.is_verified == True))).scalar() or 0
    pending_approval_shops = (await db.execute(select(func.count(Shop.id)).where(Shop.is_verified == False))).scalar() or 0
    open_now_shops = (await db.execute(select(func.count(Shop.id)).where(Shop.is_open == True))).scalar() or 0

    # 4. Users Breakdown
    customers_count = (await db.execute(select(func.count(User.id)).where(User.role == "customer"))).scalar() or 0
    sellers_count = (await db.execute(select(func.count(User.id)).where(User.role == "seller"))).scalar() or 0
    partners_count = (await db.execute(select(func.count(User.id)).where(User.role == "partner"))).scalar() or 0

    # 5. Area Service Requests
    area_req_count = (await db.execute(select(func.count(AreaDemandRequest.id)))).scalar() or 0
    recent_area_reqs_stmt = select(AreaDemandRequest).order_by(desc(AreaDemandRequest.created_at)).limit(10)
    recent_area_reqs = (await db.execute(recent_area_reqs_stmt)).scalars().all()

    # 6. Dues & Risk Ledger
    dues_stmt = select(func.coalesce(func.sum(User.wallet_balance), 0.0)).where(User.wallet_balance < 0)
    total_negative_dues = (await db.execute(dues_stmt)).scalar() or 0.0

    locked_stmt = select(func.count(User.id)).where(User.wallet_balance <= User.dues_limit)
    locked_accounts = (await db.execute(locked_stmt)).scalar() or 0

    return {
        "success": True,
        "revenue": {
            "total_gmv": round(float(total_gmv), 2),
            "platform_fees_earned": round(float(total_platform_fees), 2),
            "commissions_earned": round(float(total_commissions), 2),
            "net_revenue": round(float(total_platform_fees + total_commissions), 2),
        },
        "orders": {
            "total_orders": total_orders,
            "active_orders": active_orders,
            "completed_orders": delivered_orders,
            "cancelled_orders": cancelled_orders,
        },
        "shops": {
            "total_registered": total_shops,
            "verified_count": verified_shops,
            "pending_approval_count": pending_approval_shops,
            "open_now_count": open_now_shops,
        },
        "users": {
            "total_customers": customers_count,
            "total_sellers": sellers_count,
            "total_delivery_partners": partners_count,
        },
        "area_requests": {
            "total_requests": area_req_count,
            "recent_requests": [
                {
                    "id": r.id,
                    "locality_name": r.locality_name,
                    "pincode": r.pincode,
                    "phone_or_email": r.phone_or_email,
                    "lat": r.lat,
                    "lng": r.lng,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in recent_area_reqs
            ],
        },
        "dues_ledger": {
            "total_dues_outstanding": round(abs(float(total_negative_dues)), 2),
            "auto_locked_accounts_count": locked_accounts,
            "dues_limit_threshold": -200.0,
        }
    }


# ── 2. GET /api/admin/shops ─────────────────────────────────────────────

@router.get("/shops", status_code=status.HTTP_200_OK)
async def list_all_shops_for_admin(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Lists all shops across India with owner contact, verification status, and wallet ledger health."""
    stmt = select(Shop, User).join(User, Shop.owner_id == User.id).order_by(Shop.created_at.desc())
    rows = (await db.execute(stmt)).all()

    return {
        "success": True,
        "total_shops": len(rows),
        "shops": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "locality_name": s.locality_name,
                "management_mode": s.management_mode,
                "is_open": s.is_open,
                "is_verified": s.is_verified,
                "rating": s.rating,
                "commission_rate_percent": s.commission_rate_percent,
                "delivery_radius_km": s.delivery_radius_km,
                "lat": s.lat,
                "lng": s.lng,
                "owner": {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "wallet_balance": u.wallet_balance,
                    "is_locked": u.wallet_balance <= u.dues_limit,
                }
            }
            for s, u in rows
        ]
    }


# ── 3. POST /api/admin/shop/{shop_id}/approve & /verify ─────────────────

@router.post("/shop/{shop_id}/approve", status_code=status.HTTP_200_OK)
@router.post("/shops/{shop_id}/approve", status_code=status.HTTP_200_OK)
@router.post("/shops/{shop_id}/verify", status_code=status.HTTP_200_OK)
async def approve_or_verify_shop(
    shop_id: int,
    req: VerifyShopRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Approves, verifies, or pauses a vendor shop and optionally sets the commission percentage.
    Approved shops instantly become discoverable on the customer feed.
    """
    shop_stmt = select(Shop).where(Shop.id == shop_id)
    shop = (await db.execute(shop_stmt)).scalar_one_or_none()

    if not shop:
        raise HTTPException(status_code=404, detail=f"Shop with ID {shop_id} not found")

    shop.is_verified = req.is_verified
    if req.commission_rate_percent is not None:
        shop.commission_rate_percent = req.commission_rate_percent

    await db.commit()
    await db.refresh(shop)

    return {
        "success": True,
        "shop_id": shop.id,
        "name": shop.name,
        "is_verified": shop.is_verified,
        "commission_rate_percent": shop.commission_rate_percent,
        "message": f"Shop '{shop.name}' verification status set to {shop.is_verified} (Commission: {shop.commission_rate_percent}%)"
    }


# ── 4. POST /api/admin/commission ───────────────────────────────────────

@router.post("/commission", status_code=status.HTTP_200_OK)
async def update_category_commission(
    req: UpdateCommissionRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Updates commission % across an entire category of shops (e.g. Kirana: 8%, Fast Food: 12%)."""
    stmt = select(Shop).where(Shop.category.ilike(req.category.strip()))
    shops = (await db.execute(stmt)).scalars().all()

    for s in shops:
        s.commission_rate_percent = req.commission_rate_percent

    await db.commit()

    return {
        "success": True,
        "category": req.category,
        "new_commission_rate": req.commission_rate_percent,
        "shops_updated_count": len(shops),
        "message": f"Updated commission to {req.commission_rate_percent}% for {len(shops)} shops in '{req.category}'"
    }


# ── 5. GET /api/admin/ledger ────────────────────────────────────────────

@router.get("/ledger", status_code=status.HTTP_200_OK)
async def view_platform_wallet_ledger(
    limit: int = 50,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Views all platform financial transactions, dues deductions, and recharges."""
    stmt = select(WalletLedger, User).join(User, WalletLedger.user_id == User.id).order_by(desc(WalletLedger.created_at)).limit(limit)
    rows = (await db.execute(stmt)).all()

    return {
        "success": True,
        "total_records": len(rows),
        "ledger_entries": [
            {
                "id": l.id,
                "user_name": u.name,
                "user_email": u.email,
                "user_role": u.role,
                "order_id": l.order_id,
                "transaction_type": l.transaction_type,
                "amount": l.amount,
                "balance_after": l.balance_after,
                "notes": l.notes,
                "created_at": l.created_at.isoformat() if l.created_at else None
            }
            for l, u in rows
        ]
    }


# ── 6. POST /api/admin/push-app-update ───────────────────────────────────

@router.post("/push-app-update", status_code=status.HTTP_200_OK)
@router.post("/version-config", status_code=status.HTTP_200_OK)
async def push_app_update(
    req: PushAppUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Remote App Version Management & Push Broadcast:
    1. Saves new version, minimum required version, and force update flag to database.
    2. Broadcasts high-priority FCM push notification to all active devices to prompt the update.
    """
    cfg_stmt = select(AppVersionConfig).order_by(AppVersionConfig.id.desc()).limit(1)
    cfg = (await db.execute(cfg_stmt)).scalar_one_or_none()

    if not cfg:
        cfg = AppVersionConfig(
            latest_version=req.latest_version.strip(),
            min_required_version=req.min_required_version.strip(),
            force_update=req.force_update,
            update_message=req.update_message.strip(),
            playstore_url=req.playstore_url.strip(),
            maintenance_mode=req.maintenance_mode,
            maintenance_message=req.maintenance_message.strip() if req.maintenance_message else None,
        )
        db.add(cfg)
    else:
        cfg.latest_version = req.latest_version.strip()
        cfg.min_required_version = req.min_required_version.strip()
        cfg.force_update = req.force_update
        cfg.update_message = req.update_message.strip()
        cfg.playstore_url = req.playstore_url.strip()
        cfg.maintenance_mode = req.maintenance_mode
        cfg.maintenance_message = req.maintenance_message.strip() if req.maintenance_message else None

    await db.commit()
    await db.refresh(cfg)

    # Broadcast FCM notification if requested
    push_sent_count = 0
    if req.broadcast_push:
        users_stmt = select(User).where(and_(User.fcm_token.isnot(None), User.fcm_token != ""))
        users_with_fcm = (await db.execute(users_stmt)).scalars().all()

        for u in users_with_fcm:
            sent = send_push_notification(
                fcm_token=u.fcm_token,
                title=f"New ServoLocal Update v{req.latest_version}",
                body=req.update_message,
                data={
                    "type": "APP_UPDATE",
                    "latest_version": req.latest_version,
                    "force_update": str(req.force_update).lower(),
                    "playstore_url": req.playstore_url,
                }
            )
            if sent:
                push_sent_count += 1

    return {
        "success": True,
        "message": f"App update v{cfg.latest_version} configured. FCM push sent to {push_sent_count} registered devices.",
        "config": {
            "latest_version": cfg.latest_version,
            "min_required_version": cfg.min_required_version,
            "force_update": cfg.force_update,
            "update_message": cfg.update_message,
            "playstore_url": cfg.playstore_url,
            "maintenance_mode": cfg.maintenance_mode,
            "maintenance_message": cfg.maintenance_message,
        },
        "devices_notified_count": push_sent_count,
    }


# ── 7. POST /api/admin/banners ──────────────────────────────────────────

@router.post("/banners", status_code=status.HTTP_201_CREATED)
async def create_promo_banner(
    req: PromoBannerCreateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new promotional banner displayed dynamically in the app."""
    banner = PromoBanner(
        title=req.title.strip(),
        image_url=req.image_url.strip(),
        target_route=req.target_route.strip(),
        badge_text=req.badge_text.strip() if req.badge_text else None,
        is_active=req.is_active,
        display_order=req.display_order,
    )
    db.add(banner)
    await db.commit()
    await db.refresh(banner)

    return {
        "success": True,
        "message": f"Promo banner '{banner.title}' created successfully.",
        "banner_id": banner.id,
    }


# ── 8. GET /api/admin/app-config (Admin alias for app-config) ───────────

@router.get("/app-config", status_code=status.HTTP_200_OK)
async def get_admin_app_config(
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to inspect current live app-config and promotional banners."""
    return await fetch_app_config_data(db)
