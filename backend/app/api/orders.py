import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.session import get_db
from app.db.models import (
    Order,
    OrderItem,
    OrderReview,
    OrderEvent,
    Shop,
    ShopInventory,
    User,
    PartnerProfile,
    Coupon,
    PaymentIntent,
    WalletLedger,
)
from app.api.auth import active_session

router = APIRouter(prefix="/orders", tags=["Orders"])


class CartItemPayload(BaseModel):
    inventory_id: int
    quantity: int = Field(gt=0)
    name: Optional[str] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    weight_or_size: Optional[str] = None


class CartQuoteRequest(BaseModel):
    shop_id: int
    items: List[CartItemPayload]
    delivery_lat: Optional[float] = 27.0544
    delivery_lng: Optional[float] = 75.8942
    coupon_code: Optional[str] = None


class CheckoutRequest(BaseModel):
    shop_id: int
    items: List[CartItemPayload]
    delivery_address: str
    delivery_lat: Optional[float] = 27.0544
    delivery_lng: Optional[float] = 75.8942
    payment_method: Literal["DIRECT_SHOP_UPI", "RAZORPAY", "WALLET", "COD", "UPI", "CARD"] = "DIRECT_SHOP_UPI"  # DIRECT_SHOP_UPI, RAZORPAY, WALLET, COD, UPI, CARD
    expected_total: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    payment_id: Optional[str] = None
    customer_notes: Optional[str] = None
    coupon_code: Optional[str] = None


class OrderReviewRequest(BaseModel):
    order_id: int
    shop_rating: int
    partner_rating: Optional[int] = 5
    comment: Optional[str] = None


class ClearDuesPayload(BaseModel):
    shop_id: int
    amount: float = Field(gt=0, allow_inf_nan=False)


@router.post("/cart-quote")
async def get_cart_quote(payload: CartQuoteRequest, db: AsyncSession = Depends(get_db)):
    """
    Calculate real-time bill with real shop inventory prices, stock validation, delivery rules, and coupons.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    shop_res = await db.execute(select(Shop).where(Shop.id == payload.shop_id))
    shop = shop_res.scalar_one_or_none()
    if not shop or not shop.is_verified or not shop.is_open:
        raise HTTPException(status_code=404, detail="Shop unavailable.")

    items_total = 0.0
    validated_items = []

    for item in payload.items:
        inv_res = await db.execute(
            select(ShopInventory).where(
                ShopInventory.id == item.inventory_id,
                ShopInventory.shop_id == shop.id,
            )
        )
        inv = inv_res.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=400, detail=f"Item #{item.inventory_id} not available in this shop.")

        qty = item.quantity
        if not inv.in_stock or inv.available_stock < qty:
            raise HTTPException(
                status_code=400,
                detail=f"Only {inv.available_stock} units available for '{inv.name}'. Requested: {qty}.",
            )

        line_total = inv.selling_price * qty
        items_total += line_total
        validated_items.append({
            "inventory_id": inv.id,
            "name": inv.name,
            "selling_price": inv.selling_price,
            "quantity": qty,
            "line_total": line_total,
        })

    # Shop free delivery rule
    threshold = shop.min_order_for_free_delivery if shop.free_delivery_enabled else 150.0
    free_unlocked = shop.free_delivery_enabled and (items_total >= threshold)
    delivery_fee = 0.0 if free_unlocked else shop.base_delivery_fee
    platform_fee = 5.0

    discount = 0.0
    coupon_applied = False
    coupon_message = ""

    if payload.coupon_code:
        code = payload.coupon_code.upper().strip()
        coupon_res = await db.execute(
            select(Coupon).where(
                Coupon.code == code, Coupon.is_active.is_(True),
                or_(Coupon.expires_at.is_(None), Coupon.expires_at > datetime.now(timezone.utc)),
                or_(Coupon.usage_limit.is_(None), Coupon.used_count < Coupon.usage_limit),
            )
        )
        coupon = coupon_res.scalar_one_or_none()

        if coupon:
            if items_total < coupon.min_order_value:
                coupon_message = f"Coupon requires minimum order of ₹{coupon.min_order_value}"
            else:
                if coupon.discount_type == "FREE_DELIVERY":
                    discount = delivery_fee
                elif coupon.discount_type == "PERCENTAGE":
                    discount = min(coupon.max_discount or 999.0, items_total * (coupon.value / 100.0))
                else:  # FLAT
                    discount = min(items_total, coupon.value)
                coupon_applied = True
                coupon_message = coupon.description or f"Coupon {code} applied successfully!"
        else:
            coupon_message = "Invalid or expired coupon code."

    grand_total = max(0.0, round(items_total + delivery_fee + platform_fee - discount, 2))

    return {
        "shop_id": payload.shop_id,
        "items_total": round(items_total, 2),
        "delivery_fee": round(delivery_fee, 2),
        "platform_fee": round(platform_fee, 2),
        "discount_amount": round(discount, 2),
        "coupon_code": payload.coupon_code,
        "coupon_applied": coupon_applied,
        "coupon_message": coupon_message,
        "grand_total": grand_total,
        "free_delivery_threshold": threshold,
        "amount_needed_for_free_delivery": max(0.0, round(threshold - items_total, 2)),
        "free_delivery_unlocked": free_unlocked,
        "progress_percent": min(100, int((items_total / threshold) * 100)) if threshold > 0 else 100,
        "validated_items": validated_items,
    }


@router.post("/checkout")
async def checkout_order(
    payload: CheckoutRequest,
    user_payload: dict = Depends(active_session),
    db: AsyncSession = Depends(get_db),
):
    """
    Places real order with transaction: verifies inventory, reserves stock, creates order & order items,
    and logs audit history.
    """
    user_id = user_payload.get("id")
    user_res = await db.execute(select(User).where(User.id == user_id).with_for_update().execution_options(populate_existing=True))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot checkout with an empty cart.")

    # Verify shop
    shop_res = await db.execute(select(Shop).where(Shop.id == payload.shop_id).with_for_update())
    shop = shop_res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Selected store does not exist.")

    if not shop.is_verified or not shop.is_open:
        raise HTTPException(status_code=400, detail=f"{shop.name} is currently closed.")

    now = datetime.now(timezone.utc)

    await db.execute(select(ShopInventory.id).where(
        ShopInventory.shop_id == shop.id,
        ShopInventory.id.in_([item.inventory_id for item in payload.items]),
    ).order_by(ShopInventory.id).with_for_update())
    coupon = None
    if payload.coupon_code:
        coupon = await db.scalar(select(Coupon).where(Coupon.code == payload.coupon_code.upper().strip()).with_for_update())
    quote = await get_cart_quote(CartQuoteRequest(**payload.model_dump()), db)
    if coupon and quote["coupon_applied"]:
        coupon.used_count += 1
    items_total = quote["items_total"]
    delivery_fee = quote["delivery_fee"]
    platform_fee = quote["platform_fee"]
    grand_total = quote["grand_total"]
    if payload.expected_total is not None and round(payload.expected_total * 100) != round(grand_total * 100):
        raise HTTPException(409, "Cart prices have changed. Refresh your quote before checking out.")
    order_items_to_create = []
    for item in payload.items:
        inv = await db.get(ShopInventory, item.inventory_id)
        if inv.available_stock < item.quantity:
            raise HTTPException(400, f"Insufficient stock for {inv.name}.")
        inv.available_stock -= item.quantity
        inv.sold_count += item.quantity
        inv.in_stock = inv.available_stock > 0
        order_items_to_create.append({
            "inventory_id": inv.id, "item_name": inv.name, "weight_or_size": inv.weight_or_size,
            "unit_price": inv.selling_price, "quantity": item.quantity,
            "total_price": inv.selling_price * item.quantity,
        })

    # Generate secure, unique order code and random 4-digit PINs
    order_code = f"SL-{secrets.token_hex(5).upper()}"
    pickup_pin = str(1000 + secrets.randbelow(9000))
    delivery_pin = str(1000 + secrets.randbelow(9000))

    # Process WALLET payment deduction atomically
    if payload.payment_method == "WALLET":
        current_wallet = float(user.wallet_balance or 0.0)
        if current_wallet < grand_total:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance. You have ₹{current_wallet:.2f}, but order total is ₹{grand_total:.2f}. Please add money to your wallet.",
            )
        user.wallet_balance = round(current_wallet - grand_total, 2)
        ledger = WalletLedger(
            user_id=user.id,
            shop_id=shop.id,
            entry_type="DEBIT",
            amount=grand_total,
            balance_after=user.wallet_balance,
            note=f"Payment for Order #{order_code} at {shop.name}",
            created_at=now,
        )
        db.add(ledger)

    is_paid = payload.payment_method == "WALLET"
    if payload.payment_method in ("RAZORPAY", "UPI", "CARD"):
        intent = await db.scalar(select(PaymentIntent).where(
            PaymentIntent.user_id == user.id, PaymentIntent.purpose == "CUSTOMER_ORDER_CHECKOUT",
            PaymentIntent.status == "PAID", PaymentIntent.razorpay_payment_id == payload.payment_id,
        ).with_for_update()) if payload.payment_id else None
        if intent is None or round(intent.amount * 100) != round(grand_total * 100):
            raise HTTPException(409, "A verified payment matching the order total is required.")
        intent.status = "APPLIED"
        is_paid = True
    status = "CONFIRMED" if is_paid else "CREATED"

    customer_notes = payload.customer_notes.strip() if payload.customer_notes else ""
    if payload.payment_id:
        customer_notes = f"{customer_notes} (PaymentRef: {payload.payment_id})".strip()

    new_order = Order(
        order_code=order_code,
        customer_id=user.id,
        shop_id=shop.id,
        delivery_partner_id=None,
        status=status,
        delivery_scope=shop.delivery_scope or "LOCAL_ONLY",
        pickup_pin=pickup_pin,
        delivery_pin=delivery_pin,
        payment_method=payload.payment_method,
        payment_status="PAID" if is_paid else "PENDING",
        items_total=round(items_total, 2),
        delivery_fee=round(delivery_fee, 2),
        platform_fee=platform_fee,
        discount_amount=quote["discount_amount"],
        grand_total=grand_total,
        platform_commission_amount=round(grand_total * shop.commission_rate_percent / 100, 2),
        partner_earning_amount=25.0,
        delivery_address=payload.delivery_address.strip(),
        delivery_lat=payload.delivery_lat,
        delivery_lng=payload.delivery_lng,
        customer_notes=customer_notes if customer_notes else None,
        created_at=now,
        updated_at=now,
    )
    db.add(new_order)
    await db.flush()

    # Insert individual order items
    for oi in order_items_to_create:
        db_item = OrderItem(
            order_id=new_order.id,
            inventory_id=oi["inventory_id"],
            item_name=oi["item_name"],
            weight_or_size=oi["weight_or_size"],
            unit_price=oi["unit_price"],
            quantity=oi["quantity"],
            total_price=oi["total_price"],
        )
        db.add(db_item)

    # Add audit event
    event = OrderEvent(
        order_id=new_order.id,
        status=status,
        note=f"Order placed by customer {user.name} via {payload.payment_method}.",
        created_at=now,
    )
    db.add(event)
    await db.commit()

    return {
        "success": True,
        "message": "Order placed successfully!",
        "order_code": new_order.order_code,
        "delivery_pin": new_order.delivery_pin,
        "pickup_pin": new_order.pickup_pin,
        "status": new_order.status,
        "grand_total": new_order.grand_total,
        "new_wallet_balance": round(user.wallet_balance, 2) if user.wallet_balance is not None else None,
        "order": {
            "id": new_order.id,
            "order_code": new_order.order_code,
            "status": new_order.status,
            "grand_total": new_order.grand_total,
            "pickup_pin": new_order.pickup_pin,
            "delivery_pin": new_order.delivery_pin,
            "payment_method": new_order.payment_method,
            "payment_status": new_order.payment_status,
            "delivery_address": new_order.delivery_address,
            "shop_name": shop.name,
            "shop_locality": shop.locality_name,
        },
    }


@router.get("/track/{order_id}")
async def track_order(order_id: str, customer: dict = Depends(active_session), db: AsyncSession = Depends(get_db)):
    """
    Track order live status, PINs, and real delivery partner updates.
    Truthfully reports assigned status without fabricating rider names or GPS.
    """
    query = select(Order).where(Order.customer_id == customer["id"])
    if order_id.isdigit():
        query = query.where(Order.id == int(order_id))
    else:
        query = query.where(Order.order_code == order_id)

    res = await db.execute(query)
    order = res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")

    shop_res = await db.execute(select(Shop).where(Shop.id == order.shop_id))
    shop = shop_res.scalar_one_or_none()

    # Fetch audit timeline
    events_res = await db.execute(
        select(OrderEvent)
        .where(OrderEvent.order_id == order.id)
        .order_by(OrderEvent.created_at.asc())
    )
    events = events_res.scalars().all()

    # Fetch real rider details if assigned
    rider_info = None
    if order.delivery_partner_id:
        partner_user_res = await db.execute(select(User).where(User.id == order.delivery_partner_id))
        p_user = partner_user_res.scalar_one_or_none()
        p_profile_res = await db.execute(select(PartnerProfile).where(PartnerProfile.user_id == order.delivery_partner_id))
        p_profile = p_profile_res.scalar_one_or_none()

        # A profile may hold a shift's previous fix. Only share fixes received on this delivery leg.
        share_fix = (p_profile and p_profile.is_online and order.status in ("OUT_FOR_DELIVERY", "PICKED_UP")
                     and p_profile.updated_at >= order.updated_at)
        if p_user:
            rider_info = {
                "name": p_user.name,
                "phone": p_user.phone,
                "vehicle": p_profile.vehicle_type if p_profile else "Bike",
                "rating": p_profile.rating if p_profile else 4.9,
                "lat": p_profile.lat if share_fix else None,
                "lng": p_profile.lng if share_fix else None,
                "location_updated_at": p_profile.updated_at.replace(tzinfo=timezone.utc).isoformat() if share_fix else None,
            }

    return {
        "id": order.id,
        "order_code": order.order_code,
        "status": order.status,
        "grand_total": order.grand_total,
        "delivery_pin": order.delivery_pin,
        "pickup_pin": order.pickup_pin,
        "delivery_address": order.delivery_address,
        "destination": {"lat": order.delivery_lat, "lng": order.delivery_lng},
        "shop": {
            "name": shop.name if shop else "Local Store",
            "locality": shop.locality_name if shop else "",
            "lat": shop.lat if shop else None,
            "lng": shop.lng if shop else None,
        },
        "rider": rider_info,
        "timeline": [
            {
                "status": e.status,
                "note": e.note,
                "timestamp": e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
    }


@router.get("/my-orders")
async def get_my_orders(
    user_payload: dict = Depends(active_session),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all past orders for the authenticated customer from Neon PostgreSQL.
    Optimized: 2 queries total instead of N+1 sequential round-trips.
    """
    customer_id = user_payload.get("id")
    stmt = (
        select(Order, Shop)
        .outerjoin(Shop, Order.shop_id == Shop.id)
        .where(Order.customer_id == customer_id)
        .order_by(Order.created_at.desc())
        .limit(30)
    )
    res = await db.execute(stmt)
    rows = res.all()

    if not rows:
        return []

    order_ids = [order.id for order, _ in rows]
    items_stmt = select(OrderItem).where(OrderItem.order_id.in_(order_ids))
    items_res = await db.execute(items_stmt)
    all_items = items_res.scalars().all()

    items_by_order: dict[int, list] = {}
    for item in all_items:
        items_by_order.setdefault(item.order_id, []).append(item)

    out = []
    for order, shop in rows:
        items = items_by_order.get(order.id, [])
        out.append({
            "id": order.id,
            "order_code": order.order_code,
            "shop_name": shop.name if shop else "Local Merchant",
            "status": order.status,
            "grand_total": order.grand_total,
            "delivery_address": order.delivery_address,
            "payment_method": order.payment_method,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "items_count": len(items),
            "items_summary": ", ".join(i.item_name for i in items[:2]) + (f" + {len(items)-2} more" if len(items) > 2 else "") if items else "Order package",
        })

    return out


@router.post("/review")
async def submit_review(
    payload: OrderReviewRequest,
    user_payload: dict = Depends(active_session),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit customer feedback and ratings into order_reviews table.
    """
    user_id = user_payload.get("id")
    order_res = await db.execute(select(Order).where(Order.id == payload.order_id, Order.customer_id == user_id))
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or does not belong to you.")

    review = OrderReview(
        order_id=order.id,
        customer_id=user_id,
        shop_id=order.shop_id,
        partner_id=order.delivery_partner_id,
        shop_rating=payload.shop_rating,
        partner_rating=payload.partner_rating or 5,
        comment=payload.comment,
        created_at=datetime.now(timezone.utc),
    )
    db.add(review)
    await db.commit()
    return {"success": True, "message": "Review saved in database!"}


@router.post("/clear-dues")
async def clear_dues(
    payload: ClearDuesPayload,
    user_payload: dict = Depends(active_session),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates payment intent for shopkeeper to settle outstanding dues.
    """
    user_id = user_payload.get("id")
    if user_payload["role"] != "seller" or not await db.scalar(select(Shop.id).where(Shop.id == payload.shop_id, Shop.owner_id == user_id)):
        raise HTTPException(403, "Shop owner access required.")
    now = datetime.now(timezone.utc)

    intent = PaymentIntent(
        purpose="CLEAR_DUES",
        shop_id=payload.shop_id,
        user_id=user_id,
        amount=payload.amount,
        status="PENDING",
        created_at=now,
    )
    db.add(intent)
    await db.commit()
    await db.refresh(intent)

    return {
        "success": True,
        "intent_id": intent.id,
        "amount": payload.amount,
        "message": "Payment intent initialized for dues clearance.",
    }
