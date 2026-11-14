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
from app.api.discovery import calculate_haversine_distance

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
    locality_name: Optional[str] = None
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
            Order.status.in_(["ASSIGNED", "ACCEPTED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"]),
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
            "shop_locality": shop.locality_name if shop else "Local Area",
            "shop_lat": shop.lat if shop else 27.0544,
            "shop_lng": shop.lng if shop else 75.8942,
            "customer_name": cust.name if cust else "Customer",
            "customer_phone": cust.phone if (cust and cust.phone) else "+919352286423",
            "customer_address": active_order.delivery_address,
            "customer_lat": active_order.delivery_lat or 27.0544,
            "customer_lng": active_order.delivery_lng or 75.8942,
            "items_summary": f"{len(items)} items ({', '.join(i.item_name for i in items[:2])})",
            "items_count": len(items),
            "grand_total": active_order.grand_total,
            "payment_method": active_order.payment_method,
            "payment_status": active_order.payment_status,
            "is_cod": active_order.payment_method == "COD",
            "cod_amount": active_order.grand_total if active_order.payment_method == "COD" else 0.0,
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


@router.get("/available-orders")
async def get_available_orders(
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns live unassigned orders ready or preparing for pickup near this delivery partner (Zomato style radar).
    """
    user_id = rider.get("id")
    profile_res = await db.execute(select(PartnerProfile).where(PartnerProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()

    if not profile or not profile.is_online:
        return {"orders": [], "message": "Go ON DUTY to receive delivery requests."}

    # Find unassigned active orders
    orders_res = await db.execute(
        select(Order)
        .where(
            Order.delivery_partner_id.is_(None),
            Order.status.in_(["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"]),
        )
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    unassigned_orders = orders_res.scalars().all()

    rider_lat = profile.lat if (profile and profile.lat) else 27.0544
    rider_lng = profile.lng if (profile and profile.lng) else 75.8942

    available = []
    for ord_obj in unassigned_orders:
        shop_res = await db.execute(select(Shop).where(Shop.id == ord_obj.shop_id))
        shop = shop_res.scalar_one_or_none()
        cust_res = await db.execute(select(User).where(User.id == ord_obj.customer_id))
        cust = cust_res.scalar_one_or_none()
        items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == ord_obj.id))
        items = items_res.scalars().all()

        shop_lat = shop.lat if (shop and shop.lat) else 27.0544
        shop_lng = shop.lng if (shop and shop.lng) else 75.8942
        cust_lat = ord_obj.delivery_lat or shop_lat
        cust_lng = ord_obj.delivery_lng or shop_lng

        pickup_dist = round(calculate_haversine_distance(rider_lat, rider_lng, shop_lat, shop_lng), 1)
        drop_dist = round(calculate_haversine_distance(shop_lat, shop_lng, cust_lat, cust_lng), 1)
        total_trip = round(pickup_dist + drop_dist, 1)

        available.append({
            "id": ord_obj.id,
            "order_code": ord_obj.order_code,
            "status": ord_obj.status,
            "shop_name": shop.name if shop else "Local Store",
            "shop_locality": shop.locality_name if shop else "Local Area",
            "shop_lat": shop_lat,
            "shop_lng": shop_lng,
            "customer_name": cust.name if cust else "Verified Customer",
            "customer_phone": cust.phone if (cust and cust.phone) else "+919352286423",
            "customer_address": ord_obj.delivery_address,
            "customer_lat": cust_lat,
            "customer_lng": cust_lng,
            "items_summary": f"{len(items)} items ({', '.join(i.item_name for i in items[:2])})",
            "items_count": len(items),
            "grand_total": ord_obj.grand_total,
            "payment_method": ord_obj.payment_method,
            "payment_status": ord_obj.payment_status,
            "is_cod": ord_obj.payment_method == "COD",
            "cod_amount": ord_obj.grand_total if ord_obj.payment_method == "COD" else 0.0,
            "estimated_earning": ord_obj.partner_earning_amount or 25.0,
            "pickup_distance_km": pickup_dist,
            "drop_distance_km": drop_dist,
            "total_trip_km": total_trip,
            "created_at": ord_obj.created_at.isoformat() if ord_obj.created_at else None,
        })

    return {"orders": available, "count": len(available)}


@router.post("/orders/{order_id}/accept")
async def accept_delivery_order(
    order_id: int,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Rider accepts an available delivery order. Sets delivery_partner_id atomically.
    """
    user_id = rider.get("id")
    order_res = await db.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.delivery_partner_id and order.delivery_partner_id != user_id:
        raise HTTPException(status_code=400, detail="This order has already been accepted by another delivery partner.")

    order.delivery_partner_id = user_id
    if order.status in ("PLACED", "CONFIRMED"):
        order.status = "ASSIGNED"
    order.updated_at = datetime.now(timezone.utc)

    # Log audit event
    user_res = await db.execute(select(User).where(User.id == user_id))
    rider_user = user_res.scalar_one_or_none()
    rider_name = rider_user.name if rider_user else f"Partner #{user_id}"

    event = OrderEvent(
        order_id=order.id,
        status="ASSIGNED",
        note=f"Delivery accepted by partner {rider_name}.",
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()

    return {
        "success": True,
        "message": f"Order #{order.order_code} assigned to you! Proceed to store for pickup.",
        "order_id": order.id,
        "order_code": order.order_code,
        "pickup_pin": order.pickup_pin,
    }


@router.post("/orders/{order_id}/reject")
async def reject_delivery_order(
    order_id: int,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Rider declines delivery offer.
    """
    return {"success": True, "message": "Delivery assignment declined."}



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
    if order.payment_method == "COD":
        order.payment_status = "PAID"

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

        # If COD order, log floating cash collection
        if order.payment_method == "COD":
            cash_ledger = WalletLedger(
                user_id=rider_user.id,
                order_id=order.id,
                entry_type="CASH_COLLECTION",
                amount=order.grand_total,
                balance_after=new_balance,
                note=f"Cash collected from customer for COD Order #{order.order_code}",
                created_at=now,
            )
            db.add(cash_ledger)

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
        "is_cod": order.payment_method == "COD",
        "cash_collected": order.grand_total if order.payment_method == "COD" else 0.0,
    }


class PayoutRequestPayload(BaseModel):
    amount: float
    upi_id: Optional[str] = None


@router.get("/earnings")
async def get_partner_earnings(
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns live delivery partner earnings summary, today's metrics, floating cash in hand, and transaction history.
    """
    user_id = rider.get("id")
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Partner account not found.")

    # Fetch recent ledger entries
    ledger_res = await db.execute(
        select(WalletLedger)
        .where(WalletLedger.user_id == user_id)
        .order_by(WalletLedger.created_at.desc())
        .limit(30)
    )
    ledgers = ledger_res.scalars().all()

    # Calculate today's earnings & orders
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders_res = await db.execute(
        select(Order)
        .where(
            Order.delivery_partner_id == user_id,
            Order.status == "DELIVERED",
            Order.updated_at >= today_start,
        )
    )
    today_orders = today_orders_res.scalars().all()
    today_earned = sum(o.partner_earning_amount or 25.0 for o in today_orders)

    # Calculate floating cash in hand (COD orders delivered)
    today_cod_orders = [o for o in today_orders if o.payment_method == "COD"]
    cash_in_hand = sum(o.grand_total for o in today_cod_orders)

    # Total lifetime completed deliveries
    total_orders_res = await db.execute(
        select(Order).where(Order.delivery_partner_id == user_id, Order.status == "DELIVERED")
    )
    total_orders = total_orders_res.scalars().all()
    total_lifetime_earned = sum(o.partner_earning_amount or 25.0 for o in total_orders)

    return {
        "wallet_balance": round(user.wallet_balance or 0.0, 2),
        "upi_id": user.upi_id,
        "today_earned": round(today_earned, 2),
        "today_orders_count": len(today_orders),
        "total_orders_count": len(total_orders),
        "total_lifetime_earned": round(total_lifetime_earned, 2),
        "cash_in_hand": round(cash_in_hand, 2),
        "dues_limit": user.dues_limit or 1500.0,
        "transactions": [
            {
                "id": l.id,
                "entry_type": l.entry_type,
                "amount": round(l.amount, 2),
                "balance_after": round(l.balance_after, 2),
                "note": l.note,
                "order_id": l.order_id,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in ledgers
        ],
    }


@router.post("/payout-request")
async def request_partner_payout(
    payload: PayoutRequestPayload,
    rider: dict = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    """
    Withdraw available partner wallet earnings to registered UPI ID.
    """
    user_id = rider.get("id")
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Partner account not found.")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid withdrawal amount.")

    current_bal = float(user.wallet_balance or 0.0)
    if current_bal < payload.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient wallet balance. You have ₹{current_bal:.2f} available.",
        )

    payout_upi = payload.upi_id or user.upi_id
    if not payout_upi:
        raise HTTPException(status_code=400, detail="Please provide a valid UPI ID (e.g. 98290XXXXX@paytm) for payout.")

    user.wallet_balance = round(current_bal - payload.amount, 2)
    if payload.upi_id:
        user.upi_id = payload.upi_id.strip()

    now = datetime.now(timezone.utc)
    ledger = WalletLedger(
        user_id=user.id,
        entry_type="DEBIT",
        amount=payload.amount,
        balance_after=user.wallet_balance,
        note=f"Instant payout transfer to UPI: {payout_upi}",
        created_at=now,
    )
    db.add(ledger)
    await db.commit()

    return {
        "success": True,
        "message": f"Payout of ₹{payload.amount:.2f} transferred to {payout_upi} successfully!",
        "new_balance": user.wallet_balance,
        "payout_ref": f"TXN-{int(now.timestamp())}",
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
        locality_name=payload.locality_name or "Local Area",
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

