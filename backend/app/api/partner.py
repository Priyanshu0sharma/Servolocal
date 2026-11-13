from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import (
    User,
    Shop,
    PartnerProfile,
    Order,
    OrderItem,
    OrderEvent,
    WalletLedger,
)
from app.api.auth import decode_token

router = APIRouter(prefix="/partner", tags=["Delivery Partner & Rider Hub"])


def get_current_rider(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    token = authorization.split(" ")[1]
    decoded = decode_token(token)
    if decoded.get("role") not in ("partner", "rider", "delivery", "admin"):
        raise HTTPException(status_code=403, detail="Access denied. Delivery partner account required.")
    return decoded


class DutyTogglePayload(BaseModel):
    is_on_duty: bool
    lat: float = 27.0544
    lng: float = 75.8942


class DutyGpsPayload(BaseModel):
    lat: float
    lng: float


class UpdateRiderGpsPayload(BaseModel):
    order_id: int
    lat: float
    lng: float
    heading: Optional[float] = 0.0


class VerifyPinPayload(BaseModel):
    order_id: int
    pickup_pin: Optional[str] = None
    delivery_pin: Optional[str] = None


class OnboardShopPayload(BaseModel):
    owner_name: str
    owner_email: str
    shop_name: str
    category: Optional[str] = "Street Food / Snacks"
    lat: float = 27.0544
    lng: float = 75.8942
    locality_name: Optional[str] = "Kukas, Jaipur"
    is_runner_stall: Optional[bool] = True
    delivery_radius_km: Optional[float] = 3.0
    image_url: Optional[str] = None
    seller_upi_id: Optional[str] = None


@router.post("/duty-toggle")
async def toggle_duty(
    payload: DutyTogglePayload,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Toggles the delivery partner's active duty status (online/offline) and updates GPS.
    """
    user_id = rider.get("id")
    profile_res = await db.execute(select(PartnerProfile).where(PartnerProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if not profile:
        profile = PartnerProfile(
            user_id=user_id,
            is_online=payload.is_on_duty,
            lat=payload.lat,
            lng=payload.lng,
            rating=4.9,
            rating_count=0,
            onboarding_royalty_orders=0,
            updated_at=now,
        )
        db.add(profile)
    else:
        profile.is_online = payload.is_on_duty
        profile.lat = payload.lat
        profile.lng = payload.lng
        profile.updated_at = now

    await db.commit()
    await db.refresh(profile)

    return {
        "success": True,
        "is_on_duty": profile.is_online,
        "lat": profile.lat,
        "lng": profile.lng,
        "message": f"You are now {'ON DUTY - Ready for Orders' if profile.is_online else 'OFF DUTY'}.",
    }


@router.post("/duty-gps")
async def update_duty_gps(
    payload: DutyGpsPayload,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Periodic real GPS beacon from the delivery partner device.
    """
    user_id = rider.get("id")
    profile_res = await db.execute(select(PartnerProfile).where(PartnerProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()

    if profile:
        profile.lat = payload.lat
        profile.lng = payload.lng
        profile.updated_at = datetime.now(timezone.utc)
        await db.commit()

    return {"success": True}


@router.get("/duty-status")
async def get_duty_status(
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns current duty status, active delivery assignment job, and wallet earnings.
    """
    user_id = rider.get("id")
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()

    profile_res = await db.execute(select(PartnerProfile).where(PartnerProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()

    is_online = profile.is_online if profile else False
    lat = profile.lat if profile else 27.0544
    lng = profile.lng if profile else 75.8942

    # Check for active delivery task assigned to this rider
    active_order_res = await db.execute(
        select(Order)
        .where(
            Order.delivery_partner_id == user_id,
            Order.status.in_(["READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"]),
        )
        .order_by(Order.created_at.desc())
        .limit(1)
    )
    active_order = active_order_res.scalar_one_or_none()

    job_data = None
    if active_order:
        shop_res = await db.execute(select(Shop).where(Shop.id == active_order.shop_id))
        shop = shop_res.scalar_one_or_none()
        cust_res = await db.execute(select(User).where(User.id == active_order.customer_id))
        cust = cust_res.scalar_one_or_none()
        items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == active_order.id))
        items = items_res.scalars().all()

        job_data = {
            "id": active_order.id,
            "order_code": active_order.order_code,
            "shop_name": shop.name if shop else "Local Merchant",
            "shop_locality": shop.locality_name if shop else "Kukas, Jaipur",
            "shop_lat": shop.lat if shop else 27.0544,
            "shop_lng": shop.lng if shop else 75.8942,
            "customer_name": cust.name if cust else "Customer",
            "customer_address": active_order.delivery_address,
            "customer_lat": active_order.delivery_lat or 27.0544,
            "customer_lng": active_order.delivery_lng or 75.8942,
            "items_summary": f"{len(items)} items ({', '.join(i.item_name for i in items[:2])})",
            "estimated_earning": active_order.partner_earning_amount or 25.0,
            "status": active_order.status,
            "pickup_pin": active_order.pickup_pin,
        }

    return {
        "is_on_duty": is_online,
        "lat": lat,
        "lng": lng,
        "wallet_balance": round(user.wallet_balance if user else 0.0, 2),
        "servo_coins": user.servo_coins if user else 0,
        "active_job": job_data,
    }


@router.post("/verify-pickup-pin")
async def verify_pickup_pin(
    payload: VerifyPinPayload,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Verifies the pickup PIN provided by merchant, updates order to PICKED_UP / OUT_FOR_DELIVERY.
    """
    user_id = rider.get("id")
    order_res = await db.execute(select(Order).where(Order.id == payload.order_id))
    order = order_res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if not payload.pickup_pin or payload.pickup_pin.strip() != order.pickup_pin.strip():
        raise HTTPException(status_code=400, detail="Invalid Pickup PIN. Please verify with the shopkeeper.")

    order.status = "OUT_FOR_DELIVERY"
    order.delivery_partner_id = user_id
    order.updated_at = datetime.now(timezone.utc)

    # Log audit event
    event = OrderEvent(
        order_id=order.id,
        status="OUT_FOR_DELIVERY",
        note=f"Order picked up by delivery partner #{user_id} with verified PIN.",
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()

    return {"success": True, "message": "Pickup verified! Order is now OUT FOR DELIVERY."}


@router.post("/verify-delivery-pin")
async def verify_delivery_pin(
    payload: VerifyPinPayload,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Verifies the customer's delivery PIN, marks order as DELIVERED, and credits partner earnings.
    """
    user_id = rider.get("id")
    order_res = await db.execute(select(Order).where(Order.id == payload.order_id))
    order = order_res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if not payload.delivery_pin or payload.delivery_pin.strip() != order.delivery_pin.strip():
        raise HTTPException(status_code=400, detail="Invalid Customer Delivery PIN. Please ask customer for correct 4-digit PIN.")

    now = datetime.now(timezone.utc)
    order.status = "DELIVERED"
    order.updated_at = now

    # Credit partner earnings to rider wallet
    earning = order.partner_earning_amount or 25.0
    rider_user_res = await db.execute(select(User).where(User.id == user_id))
    rider_user = rider_user_res.scalar_one_or_none()

    if rider_user:
        rider_user.wallet_balance = (rider_user.wallet_balance or 0.0) + earning
        new_balance = rider_user.wallet_balance
        ledger = WalletLedger(
            user_id=rider_user.id,
            order_id=order.id,
            entry_type="CREDIT",
            amount=earning,
            balance_after=new_balance,
            note=f"Delivery payout for order #{order.order_code}",
            created_at=now,
        )
        db.add(ledger)

    # Log audit event
    event = OrderEvent(
        order_id=order.id,
        status="DELIVERED",
        note=f"Delivered safely to customer with verified Delivery PIN.",
        created_at=now,
    )
    db.add(event)
    await db.commit()

    return {
        "success": True,
        "message": f"Order {order.order_code} successfully delivered! ₹{earning} credited to your wallet.",
        "earned": earning,
    }


@router.post("/update-gps")
async def update_rider_gps(
    payload: UpdateRiderGpsPayload,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates the rider's active location for order tracking.
    """
    user_id = rider.get("id")
    profile_res = await db.execute(select(PartnerProfile).where(PartnerProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()
    if profile:
        profile.lat = payload.lat
        profile.lng = payload.lng
        profile.updated_at = datetime.now(timezone.utc)
        await db.commit()
    return {"success": True}


@router.post("/onboard-shop")
async def onboard_shop_field(
    payload: OnboardShopPayload,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Field scout onboarding of local shop / street stall by delivery partner.
    """
    rider_id = rider.get("id")
    now = datetime.now(timezone.utc)

    # Create merchant user if not existing
    email_clean = payload.owner_email.lower().strip()
    user_res = await db.execute(select(User).where(User.email.ilike(email_clean)))
    merchant_user = user_res.scalar_one_or_none()

    if not merchant_user:
        merchant_user = User(
            email=email_clean,
            name=payload.owner_name.strip(),
            role="seller",
            servo_coins=0,
            wallet_balance=0.0,
            terms_accepted=True,
            location_permission_granted=True,
            is_active=True,
            created_at=now,
        )
        db.add(merchant_user)
        await db.commit()
        await db.refresh(merchant_user)

    # Create new shop
    new_shop = Shop(
        owner_id=merchant_user.id,
        name=payload.shop_name.strip(),
        category=payload.category or "Street Food / Snacks",
        image_url=payload.image_url,
        is_open=True,
        rating=5.0,
        management_mode="PARTNER_RUNNER_STALL" if payload.is_runner_stall else "DIRECT_MERCHANT",
        lat=payload.lat,
        lng=payload.lng,
        locality_name=payload.locality_name or "Kukas, Jaipur",
        delivery_scope="LOCAL_ONLY",
        delivery_radius_km=payload.delivery_radius_km or 3.0,
        free_delivery_enabled=True,
        min_order_for_free_delivery=150.0,
        base_delivery_fee=15.0,
        seller_upi_id=payload.seller_upi_id,
        commission_rate_percent=5.0,
        is_verified=True,
        created_at=now,
    )
    db.add(new_shop)

    # Increment scout onboarding royalty count
    profile_res = await db.execute(select(PartnerProfile).where(PartnerProfile.user_id == rider_id))
    profile = profile_res.scalar_one_or_none()
    if profile:
        profile.onboarding_royalty_orders = (profile.onboarding_royalty_orders or 0) + 1

    await db.commit()
    await db.refresh(new_shop)

    return {
        "success": True,
        "message": f"Shop '{new_shop.name}' onboarded successfully!",
        "shop_id": new_shop.id,
    }


@router.get("/active-riders")
async def get_active_riders(
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    List online delivery partners for dispatch coordination.
    """
    res = await db.execute(
        select(PartnerProfile, User)
        .join(User, PartnerProfile.user_id == User.id)
        .where(PartnerProfile.is_online == True)
    )
    rows = res.all()
    return [
        {
            "user_id": u.id,
            "name": u.name,
            "phone": u.email,
            "lat": p.lat,
            "lng": p.lng,
            "vehicle_type": p.vehicle_type or "Bike",
            "rating": p.rating,
        }
        for p, u in rows
    ]


@router.get("/track-order/{order_id}")
async def rider_track_order(
    order_id: int,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Rider job details view.
    """
    order_res = await db.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    shop_res = await db.execute(select(Shop).where(Shop.id == order.shop_id))
    shop = shop_res.scalar_one_or_none()
    cust_res = await db.execute(select(User).where(User.id == order.customer_id))
    cust = cust_res.scalar_one_or_none()

    return {
        "id": order.id,
        "order_code": order.order_code,
        "status": order.status,
        "pickup_pin": order.pickup_pin,
        "delivery_pin": order.delivery_pin,
        "shop": {
            "name": shop.name if shop else "Shop",
            "locality": shop.locality_name if shop else "",
            "lat": shop.lat if shop else 27.0544,
            "lng": shop.lng if shop else 75.8942,
        },
        "customer": {
            "name": cust.name if cust else "Customer",
            "address": order.delivery_address,
            "lat": order.delivery_lat,
            "lng": order.delivery_lng,
        },
    }

