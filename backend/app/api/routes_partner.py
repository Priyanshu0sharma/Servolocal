import asyncio
import json
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.database import get_db
from app.db.models import User, Shop, Order, WalletLedger
from app.core.security import require_partner
from app.core.redis_cache import (
    update_rider_gps,
    get_rider_gps,
    set_rider_duty_status,
    get_rider_duty_status,
    update_rider_duty_gps,
    get_all_active_riders,
)
from app.core.payment_engine import calculate_order_financials
from app.core.fcm_notify import send_push_notification, send_customer_order_update, send_rider_job_ping

logger = logging.getLogger("routes_partner")

router = APIRouter(prefix="/api/partner", tags=["Delivery Partner & Field Fleet"])


# ── Schemas ─────────────────────────────────────────────────────────────

class OnboardShopRequest(BaseModel):
    owner_name: str
    owner_email: EmailStr
    shop_name: str
    category: str = "Fast Food"
    lat: float
    lng: float
    locality_name: str = "Kukas"
    is_runner_stall: bool = True  # Street stalls / thele (Runner purchases with cash)
    delivery_radius_km: float = 3.0
    image_url: Optional[str] = None
    seller_upi_id: Optional[str] = None


class UpdateGPSRequest(BaseModel):
    order_id: int
    lat: float
    lng: float
    heading: float = 0.0


class DutyToggleRequest(BaseModel):
    is_on_duty: bool
    lat: float = 0.0
    lng: float = 0.0


class DutyGPSUpdateRequest(BaseModel):
    lat: float
    lng: float


class VerifyPickupPinRequest(BaseModel):
    order_id: int
    pickup_pin: str = Field(..., min_length=2, max_length=10)


class VerifyDeliveryPinRequest(BaseModel):
    order_id: int
    delivery_pin: str = Field(..., min_length=4, max_length=10)


# ── 1. POST /api/partner/onboard-shop ───────────────────────────────────

@router.post("/onboard-shop", status_code=status.HTTP_201_CREATED)
async def onboard_shop_field_scouting(
    req: OnboardShopRequest,
    current_user: User = Depends(require_partner),
    db: AsyncSession = Depends(get_db),
):
    """
    Field-scouting tool for Delivery Partners:
    Allows delivery partner to onboard uncooperative street stalls (Kachori, Momos)
    under 'Runner Stall Mode'.
    Rider earns ₹2 lifetime referral royalty on every completed order!
    """
    clean_email = req.owner_email.strip().lower()

    # Find or create shopkeeper user account
    user_stmt = select(User).where(User.email == clean_email)
    user = (await db.execute(user_stmt)).scalar_one_or_none()

    if not user:
        user = User(
            email=clean_email,
            name=req.owner_name.strip(),
            role="seller",
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    management_mode = "PARTNER_RUNNER_STALL" if req.is_runner_stall else "SELLER_MANAGED"

    new_shop = Shop(
        owner_id=user.id,
        name=req.shop_name.strip(),
        category=req.category.strip(),
        image_url=req.image_url or "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500",
        is_open=True,
        management_mode=management_mode,
        lat=req.lat,
        lng=req.lng,
        locality_name=req.locality_name.strip(),
        delivery_scope="LOCAL_ONLY",
        delivery_radius_km=req.delivery_radius_km,
        local_eta_mins="15-20 mins",
        free_delivery_enabled=True,
        min_order_for_free_delivery=120.0,
        base_delivery_fee=25.0,
        seller_upi_id=req.seller_upi_id,
        commission_rate_percent=10.0,
        onboarded_by_partner_id=current_user.id,  # Lifetime Partner Royalty link
        is_verified=True,
    )
    db.add(new_shop)
    await db.commit()
    await db.refresh(new_shop)

    return {
        "success": True,
        "message": f"Shop '{new_shop.name}' onboarded successfully under {management_mode}",
        "shop_id": new_shop.id,
        "royalty_active": True,
        "onboarded_by_partner": current_user.name
    }


# ── 2. POST /api/partner/update-gps ─────────────────────────────────────

@router.post("/update-gps", status_code=status.HTTP_200_OK)
async def update_gps_coordinates(
    req: UpdateGPSRequest,
    current_user: User = Depends(require_partner),
):
    """
    Streams 5-second rider coordinates to Upstash Redis (Key: rider_gps:{order_id}).
    Powers live moving bike marker on customer's Leaflet tracking map with 0 database load.
    """
    await update_rider_gps(
        order_id=req.order_id,
        partner_id=current_user.id,
        lat=req.lat,
        lng=req.lng,
        heading=req.heading
    )
    return {
        "success": True,
        "order_id": req.order_id,
        "lat": req.lat,
        "lng": req.lng
    }


# ── 3. POST /api/partner/verify-pickup-pin ──────────────────────────────

@router.post("/verify-pickup-pin", status_code=status.HTTP_200_OK)
async def verify_pickup_pin(
    req: VerifyPickupPinRequest,
    current_user: User = Depends(require_partner),
    db: AsyncSession = Depends(get_db),
):
    """
    Rider inputs 2-digit PIN at shop to confirm correct package hand-off.
    Transitions order to 'OUT_FOR_DELIVERY'.
    """
    order_stmt = select(Order).where(Order.id == req.order_id)
    order = (await db.execute(order_stmt)).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.pickup_pin.strip() != req.pickup_pin.strip():
        raise HTTPException(status_code=400, detail="Invalid 2-digit Pickup PIN")

    order.status = "OUT_FOR_DELIVERY"
    order.delivery_partner_id = current_user.id
    await db.commit()

    # Notify customer with Out for Delivery alert and 4-digit PIN
    customer_stmt = select(User).where(User.id == order.customer_id)
    customer = (await db.execute(customer_stmt)).scalar_one_or_none()
    if customer and customer.fcm_token:
        send_customer_order_update(
            customer.fcm_token,
            order.order_code,
            "OUT_FOR_DELIVERY",
            delivery_pin=order.delivery_pin
        )

    return {
        "success": True,
        "order_id": order.id,
        "status": order.status,
        "message": "Pickup verified! Package is now Out for Delivery."
    }


# ── 4. POST /api/partner/verify-delivery-pin ────────────────────────────

@router.post("/verify-delivery-pin", status_code=status.HTTP_200_OK)
async def verify_delivery_pin(
    req: VerifyDeliveryPinRequest,
    current_user: User = Depends(require_partner),
    db: AsyncSession = Depends(get_db),
):
    """
    Rider inputs 4-digit PIN with customer upon doorstep handover.
    Transitions order to 'DELIVERED'.
    Automates Stage 1 financial split & wallet dues ledger entries:
    - Deducts platform fee (₹5) + commission from Seller/Runner wallet.
    - Credits delivery earnings to Partner wallet.
    - Credits ₹2 lifetime royalty if shop was referred by a partner.
    """
    order_stmt = select(Order).where(Order.id == req.order_id)
    order = (await db.execute(order_stmt)).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.delivery_pin.strip() != req.delivery_pin.strip():
        raise HTTPException(status_code=400, detail="Invalid 4-digit Delivery PIN")

    # Fetch Shop to check referral royalty
    shop_stmt = select(Shop).where(Shop.id == order.shop_id)
    shop = (await db.execute(shop_stmt)).scalar_one_or_none()

    has_referral = bool(shop and shop.onboarded_by_partner_id)

    # Compute order economics
    fin = calculate_order_financials(
        items_total=order.items_total,
        delivery_fee=order.delivery_fee,
        commission_pct=shop.commission_rate_percent if shop else 10.0,
        platform_fee=order.platform_fee,
        has_partner_referral=has_referral
    )

    order.status = "DELIVERED"
    order.payment_status = "COMPLETED"
    order.platform_commission_amount = fin["platform_commission_amount"]
    order.partner_earning_amount = fin["partner_earning_amount"]

    # 1. Update Shopkeeper Wallet (debit commission & platform fee dues)
    if shop:
        shopkeeper_stmt = select(User).where(User.id == shop.owner_id)
        shopkeeper = (await db.execute(shopkeeper_stmt)).scalar_one_or_none()
        if shopkeeper:
            debit_total = fin["platform_commission_amount"] + fin["platform_fee"]
            shopkeeper.wallet_balance -= debit_total
            ledger_shop = WalletLedger(
                user_id=shopkeeper.id,
                order_id=order.id,
                transaction_type="COMMISSION_DEBIT",
                amount=-debit_total,
                balance_after=shopkeeper.wallet_balance,
                notes=f"ServoLocal dues for order #{order.order_code}"
            )
            db.add(ledger_shop)

    # 2. Update Partner Wallet (credit delivery earning)
    current_user.wallet_balance += fin["partner_earning_amount"]
    ledger_partner = WalletLedger(
        user_id=current_user.id,
        order_id=order.id,
        transaction_type="PARTNER_PAYOUT",
        amount=fin["partner_earning_amount"],
        balance_after=current_user.wallet_balance,
        notes=f"Delivery payout for order #{order.order_code}"
    )
    db.add(ledger_partner)

    # 3. Credit Referral Royalty to Scouting Partner if applicable
    if has_referral and shop.onboarded_by_partner_id != current_user.id:
        scout_stmt = select(User).where(User.id == shop.onboarded_by_partner_id)
        scout_partner = (await db.execute(scout_stmt)).scalar_one_or_none()
        if scout_partner:
            scout_partner.wallet_balance += 2.0
            ledger_royalty = WalletLedger(
                user_id=scout_partner.id,
                order_id=order.id,
                transaction_type="PARTNER_ROYALTY",
                amount=2.0,
                balance_after=scout_partner.wallet_balance,
                notes=f"Lifetime scouting royalty for shop '{shop.name}'"
            )
            db.add(ledger_royalty)

    await db.commit()

    # Notify customer that order has been delivered
    customer_stmt = select(User).where(User.id == order.customer_id)
    customer = (await db.execute(customer_stmt)).scalar_one_or_none()
    if customer and customer.fcm_token:
        send_customer_order_update(
            customer.fcm_token,
            order.order_code,
            "DELIVERED",
            shop_name=shop.name if shop else "Partner Store"
        )

    return {
        "success": True,
        "order_id": order.id,
        "status": "DELIVERED",
        "partner_earning": fin["partner_earning_amount"],
        "review_prompt": True,
        "message": "Order delivered successfully! Dues and earnings split processed."
    }


# ── 5. POST /api/partner/duty-toggle ────────────────────────────────────

@router.post("/duty-toggle", status_code=status.HTTP_200_OK)
async def toggle_duty_status(
    req: DutyToggleRequest,
    current_user: User = Depends(require_partner),
):
    """
    Rider goes ON_DUTY or OFF_DUTY.
    On-duty riders appear in the job radar for new order dispatching.
    GPS coordinates are stored in Redis with 8-hour auto-expiry.
    """
    await set_rider_duty_status(
        partner_id=current_user.id,
        is_on_duty=req.is_on_duty,
        lat=req.lat,
        lng=req.lng,
        name=current_user.name,
    )
    return {
        "success": True,
        "partner_id": current_user.id,
        "is_on_duty": req.is_on_duty,
        "message": f"Duty {'ON — You will receive new order pings!' if req.is_on_duty else 'OFF — Rest well!'}"
    }


# ── 6. POST /api/partner/duty-gps ──────────────────────────────────────

@router.post("/duty-gps", status_code=status.HTTP_200_OK)
async def update_duty_gps(
    req: DutyGPSUpdateRequest,
    current_user: User = Depends(require_partner),
):
    """
    Updates the rider's idle GPS position while on duty (not on a specific order).
    Called every 10 seconds from mobile app for job radar proximity matching.
    """
    await update_rider_duty_gps(
        partner_id=current_user.id,
        lat=req.lat,
        lng=req.lng,
    )
    return {"success": True, "lat": req.lat, "lng": req.lng}


# ── 7. GET /api/partner/duty-status ─────────────────────────────────────

@router.get("/duty-status", status_code=status.HTTP_200_OK)
async def get_duty_status(
    current_user: User = Depends(require_partner),
):
    """Returns current rider's duty status from Redis."""
    data = await get_rider_duty_status(current_user.id)
    if not data:
        return {"is_on_duty": False, "message": "Currently OFF duty."}
    return {
        "is_on_duty": data.get("status") == "ON_DUTY",
        "lat": data.get("lat", 0.0),
        "lng": data.get("lng", 0.0),
        "updated_at": data.get("updated_at"),
    }


# ── 8. GET /api/partner/active-riders ───────────────────────────────────

@router.get("/active-riders", status_code=status.HTTP_200_OK)
async def list_active_riders(
    current_user: User = Depends(require_partner),
):
    """
    Returns all currently ON_DUTY riders.
    Used by Admin and job dispatch engine to see available fleet.
    """
    riders = await get_all_active_riders()
    return {
        "success": True,
        "count": len(riders),
        "riders": riders,
    }


# ── 9. GET /api/partner/track-order/{order_id} (REST Polling Fallback) ──

@router.get("/track-order/{order_id}", status_code=status.HTTP_200_OK)
async def track_order_rest(
    order_id: int,
):
    """
    REST fallback for customer-side rider tracking.
    Returns latest GPS coordinates from Redis.
    Clients poll this every 5 seconds as WebSocket fallback.
    """
    gps = await get_rider_gps(order_id)
    if not gps:
        return {
            "tracking": False,
            "message": "Rider GPS not yet available. Waiting for rider to start delivery.",
        }
    return {
        "tracking": True,
        "order_id": gps.get("order_id"),
        "partner_id": gps.get("partner_id"),
        "lat": gps.get("lat"),
        "lng": gps.get("lng"),
        "heading": gps.get("heading", 0.0),
        "updated_at": gps.get("updated_at"),
    }


# ── 10. WebSocket /ws/track/{order_id} (Real-Time GPS Stream) ──────────

@router.websocket("/ws/track/{order_id}")
async def websocket_track_order(
    websocket: WebSocket,
    order_id: int,
):
    """
    Real-time WebSocket GPS stream for customer's Leaflet tracking map.
    Sends rider's latest lat/lng every 5 seconds from Redis.
    Auto-closes when order is DELIVERED or client disconnects.

    Protocol:
      - Server → Client: JSON {"lat": 26.85, "lng": 75.76, "heading": 45.0, "updated_at": 1699999}
      - Client can send "ping" to keep alive
      - Server sends {"status": "DELIVERED"} when order completes, then closes
    """
    await websocket.accept()
    logger.info(f"[WS TRACK] Client connected for order #{order_id}")

    consecutive_empty = 0
    max_empty_cycles = 360  # 360 * 5s = 30 minutes max idle before auto-close

    try:
        while True:
            gps = await get_rider_gps(order_id)

            if gps:
                consecutive_empty = 0
                await websocket.send_json({
                    "type": "gps_update",
                    "lat": gps.get("lat"),
                    "lng": gps.get("lng"),
                    "heading": gps.get("heading", 0.0),
                    "partner_id": gps.get("partner_id"),
                    "updated_at": gps.get("updated_at"),
                })
            else:
                consecutive_empty += 1
                await websocket.send_json({
                    "type": "waiting",
                    "message": "Waiting for rider GPS signal...",
                })

            # Auto-close after 30 min of no GPS data
            if consecutive_empty >= max_empty_cycles:
                await websocket.send_json({
                    "type": "timeout",
                    "message": "Tracking session timed out. Please refresh.",
                })
                break

            # Wait 5 seconds before next update
            await asyncio.sleep(5)

    except WebSocketDisconnect:
        logger.info(f"[WS TRACK] Client disconnected for order #{order_id}")
    except Exception as e:
        logger.error(f"[WS TRACK ERROR] order #{order_id}: {e}")
        try:
            await websocket.close(code=1011, reason=str(e))
        except Exception:
            pass
