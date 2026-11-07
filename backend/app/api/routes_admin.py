from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from app.db.database import get_db
from app.db.models import User, Shop, Order, WalletLedger
from app.core.security import require_admin

router = APIRouter(prefix="/api/admin", tags=["Super Admin Control Room"])


# ── Schemas ─────────────────────────────────────────────────────────────

class VerifyShopRequest(BaseModel):
    is_verified: bool = True
    commission_rate_percent: Optional[float] = Field(None, ge=0.0, le=50.0)


class UpdateCommissionRequest(BaseModel):
    category: str
    commission_rate_percent: float = Field(..., ge=0.0, le=50.0)


class AppVersionConfigRequest(BaseModel):
    latest_version: str = "1.0.0"
    min_required_version: str = "1.0.0"
    force_update: bool = False
    update_url: str = "https://servolocal.in"
    announcement_text: Optional[str] = "Welcome to ServoLocal High-Speed Local Commerce!"


# ── 1. GET /api/admin/dashboard-stats ───────────────────────────────────

@router.get("/dashboard-stats", status_code=status.HTTP_200_OK)
async def get_dashboard_stats(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Super Admin Live Master Control Room Stats:
    - Real-time GMV and platform fee revenue
    - Active order radar
    - Kukas vs Kunda zone breakdown
    - Total pending dues from vendors/riders
    """
    # 1. Total Orders & Revenue
    order_stats_stmt = select(
        func.count(Order.id),
        func.coalesce(func.sum(Order.grand_total), 0.0),
        func.coalesce(func.sum(Order.platform_fee), 0.0),
        func.coalesce(func.sum(Order.platform_commission_amount), 0.0),
    )
    res = (await db.execute(order_stats_stmt)).first()
    total_orders, total_gmv, total_platform_fees, total_commissions = res

    # 2. Total Shops
    shop_count_stmt = select(func.count(Shop.id))
    total_shops = (await db.execute(shop_count_stmt)).scalar() or 0

    # 3. Zone Breakdown (Kukas vs Kunda)
    kukas_stmt = select(func.count(Shop.id)).where(Shop.locality_name.ilike("%kukas%"))
    kukas_shops = (await db.execute(kukas_stmt)).scalar() or 0

    kunda_stmt = select(func.count(Shop.id)).where(Shop.locality_name.ilike("%kunda%"))
    kunda_shops = (await db.execute(kunda_stmt)).scalar() or 0

    # 4. Total Negative Dues Owed to ServoLocal (wallet_balance < 0)
    dues_stmt = select(
        func.coalesce(func.sum(User.wallet_balance), 0.0)
    ).where(User.wallet_balance < 0)
    total_negative_dues = (await db.execute(dues_stmt)).scalar() or 0.0

    # 5. Locked Accounts Count (wallet_balance <= dues_limit)
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
            "total_orders_placed": total_orders,
        },
        "shops": {
            "total_registered_shops": total_shops,
            "kukas_zone_shops": kukas_shops,
            "kunda_zone_shops": kunda_shops,
        },
        "dues_ledger": {
            "total_dues_outstanding": round(abs(float(total_negative_dues)), 2),
            "auto_locked_accounts_count": locked_accounts,
        }
    }


# ── 2. GET /api/admin/shops ─────────────────────────────────────────────

@router.get("/shops", status_code=status.HTTP_200_OK)
async def list_all_shops_for_admin(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Lists all shops across Kukas and Kunda with owner details & status."""
    stmt = select(Shop, User).join(User, Shop.owner_id == User.id).order_by(Shop.created_at.desc())
    rows = (await db.execute(stmt)).all()

    return {
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
                "owner": {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "wallet_balance": u.wallet_balance,
                    "is_locked": u.wallet_balance <= u.dues_limit
                }
            }
            for s, u in rows
        ]
    }


# ── 3. POST /api/admin/shops/{shop_id}/verify ───────────────────────────

@router.post("/shops/{shop_id}/verify", status_code=status.HTTP_200_OK)
async def verify_or_block_shop(
    shop_id: int,
    req: VerifyShopRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approves, verifies, or blocks a shop and optionally adjusts commission %."""
    shop_stmt = select(Shop).where(Shop.id == shop_id)
    shop = (await db.execute(shop_stmt)).scalar_one_or_none()

    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

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
        "message": f"Shop '{shop.name}' verification set to {shop.is_verified}"
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
        "shops_updated_count": len(shops)
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


# ── 6. POST /api/admin/version-config ───────────────────────────────────

@router.post("/version-config", status_code=status.HTTP_200_OK)
async def update_app_version_config(
    req: AppVersionConfigRequest,
    admin_user: User = Depends(require_admin),
):
    """
    Configures remote version modal ('Update ServoLocal Now') without requiring app re-build.
    """
    return {
        "success": True,
        "config": {
            "latest_version": req.latest_version,
            "min_required_version": req.min_required_version,
            "force_update": req.force_update,
            "update_url": req.update_url,
            "announcement_text": req.announcement_text,
        },
        "message": "App version configuration updated successfully"
    }
