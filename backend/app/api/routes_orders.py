import secrets
import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.db.database import get_db
from app.db.models import User, Shop, ShopInventory, Order, OrderItem, OrderReview, WalletLedger, Coupon
from app.core.security import require_customer, get_current_user
from app.core.payment_engine import (
    create_razorpay_order,
    verify_razorpay_signature,
    generate_direct_shop_upi_link,
    calculate_order_financials,
)
from app.core.fcm_notify import send_loud_order_ring, send_customer_order_update

router = APIRouter(prefix="/api/orders", tags=["Orders & Checkout"])


# ── Schemas ─────────────────────────────────────────────────────────────

class CartItemRequest(BaseModel):
    inventory_id: int
    quantity: int = Field(1, ge=1)
    variant_id: Optional[str] = None
    pack_label: Optional[str] = None


class CartQuoteRequest(BaseModel):
    shop_id: int
    items: List[CartItemRequest]
    delivery_lat: Optional[float] = 27.0544
    delivery_lng: Optional[float] = 75.8942
    coupon_code: Optional[str] = None


class CheckoutRequest(BaseModel):
    shop_id: int
    items: List[CartItemRequest]
    delivery_address: str = Field(..., min_length=5)
    delivery_lat: float
    delivery_lng: float
    payment_method: str = Field("DIRECT_SHOP_UPI", description="RAZORPAY, DIRECT_SHOP_UPI, COD")
    customer_notes: Optional[str] = None
    coupon_code: Optional[str] = None


async def evaluate_coupon(coupon_code: Optional[str], items_total: float, db: AsyncSession) -> Dict[str, Any]:
    if not coupon_code or not coupon_code.strip():
        return {"discount": 0.0, "code": None, "applied": False, "message": ""}

    code_clean = coupon_code.strip().upper()

    # 1. Check database for active coupon
    c_stmt = select(Coupon).where(and_(Coupon.code == code_clean, Coupon.is_active == True))
    coupon = (await db.execute(c_stmt)).scalar_one_or_none()

    if coupon:
        if items_total < coupon.min_order_amount:
            needed = coupon.min_order_amount - items_total
            return {
                "discount": 0.0,
                "code": code_clean,
                "applied": False,
                "message": f"Add ₹{needed:.0f} more items to apply '{code_clean}'"
            }
        if coupon.discount_type == "PERCENT":
            discount = min(coupon.max_discount_amount, round(items_total * (coupon.discount_value / 100.0), 2))
        else:
            discount = min(items_total, coupon.discount_value)
        return {
            "discount": discount,
            "code": code_clean,
            "applied": True,
            "message": f"🎉 Coupon '{code_clean}' applied! Saved ₹{discount:.0f}"
        }

    # 2. Built-in instant promo codes (WELCOME50, SERVO20)
    if code_clean == "WELCOME50":
        if items_total >= 149.0:
            return {"discount": 50.0, "code": code_clean, "applied": True, "message": "🎉 WELCOME50 applied! Flat ₹50 OFF"}
        else:
            needed = 149.0 - items_total
            return {"discount": 0.0, "code": code_clean, "applied": False, "message": f"Add ₹{needed:.0f} more to apply WELCOME50"}
    elif code_clean == "SERVO20":
        if items_total >= 99.0:
            return {"discount": 20.0, "code": code_clean, "applied": True, "message": "🎉 SERVO20 applied! Flat ₹20 OFF"}
        else:
            needed = 99.0 - items_total
            return {"discount": 0.0, "code": code_clean, "applied": False, "message": f"Add ₹{needed:.0f} more to apply SERVO20"}

    return {"discount": 0.0, "code": code_clean, "applied": False, "message": f"Coupon code '{code_clean}' is invalid"}



class ClearDuesRequest(BaseModel):
    amount: float = Field(200.0, ge=10.0)
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


class OrderReviewRequest(BaseModel):
    order_id: int
    shop_rating: int = Field(5, ge=1, le=5)
    partner_rating: Optional[int] = Field(5, ge=1, le=5)
    comment: Optional[str] = None


# ── 1. POST /api/orders/cart-quote ──────────────────────────────────────

@router.post("/cart-quote", status_code=status.HTTP_200_OK)
async def get_cart_quote(
    req: CartQuoteRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Blinkit/Zepto-style dynamic progress bar calculator:
    - Calculates amount remaining for FREE delivery ('Add ₹30 more to unlock Free Delivery')
    - Returns smart upsell recommendations from the same shop priced between ₹20 and ₹60.
    """
    shop_stmt = select(Shop).where(Shop.id == req.shop_id)
    shop = (await db.execute(shop_stmt)).scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    items_total = 0.0
    item_categories = set()

    for cart_item in req.items:
        inv_stmt = select(ShopInventory).where(
            and_(
                ShopInventory.id == cart_item.inventory_id,
                ShopInventory.shop_id == req.shop_id
            )
        )
        inv = (await db.execute(inv_stmt)).scalar_one_or_none()
        if inv:
            item_price = inv.selling_price
            if cart_item.variant_id and inv.variants:
                for v in (inv.variants or []):
                    if v.get("id") == cart_item.variant_id:
                        item_price = float(v.get("price", item_price))
                        break
            items_total += item_price * cart_item.quantity
            item_categories.add(inv.sub_category or inv.category)

    # Free delivery logic
    free_delivery_threshold = shop.min_order_for_free_delivery
    is_free = shop.free_delivery_enabled and (items_total >= free_delivery_threshold)
    delivery_fee = 0.0 if is_free else shop.base_delivery_fee
    amount_needed = max(0.0, round(free_delivery_threshold - items_total, 2))
    platform_fee = 5.0

    # Coupon Evaluation
    coupon_eval = await evaluate_coupon(req.coupon_code, items_total, db)
    discount_amount = coupon_eval["discount"]

    grand_total = max(0.0, round(items_total + delivery_fee + platform_fee - discount_amount, 2))

    # Smart Upsell Suggestions from same shop (small impulse add-ons ₹15 - ₹60)
    upsell_stmt = (
        select(ShopInventory)
        .where(
            and_(
                ShopInventory.shop_id == req.shop_id,
                ShopInventory.id.notin_([i.inventory_id for i in req.items]),
                ShopInventory.selling_price <= max(60.0, amount_needed + 15.0),
                ShopInventory.in_stock == True,
                ShopInventory.available_stock > 0
            )
        )
        .limit(6)
    )
    upsell_res = await db.execute(upsell_stmt)
    upsell_items = upsell_res.scalars().all()

    return {
        "shop_id": shop.id,
        "shop_name": shop.name,
        "items_total": round(items_total, 2),
        "delivery_fee": delivery_fee,
        "platform_fee": platform_fee,
        "discount_amount": discount_amount,
        "coupon_code": coupon_eval["code"],
        "coupon_applied": coupon_eval["applied"],
        "coupon_message": coupon_eval["message"],
        "grand_total": grand_total,
        "free_delivery_threshold": free_delivery_threshold,
        "amount_needed_for_free_delivery": amount_needed,
        "free_delivery_unlocked": is_free,
        "progress_percent": min(100.0, round((items_total / free_delivery_threshold) * 100, 1)) if free_delivery_threshold > 0 else 100.0,
        "smart_upsells": [
            {
                "id": u.id,
                "name": u.name,
                "price": u.selling_price,
                "mrp": u.mrp,
                "image_url": u.image_url,
                "weight_or_size": u.weight_or_size
            }
            for u in upsell_items
        ]
    }


# ── 2. POST /api/orders/checkout ────────────────────────────────────────

@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def checkout_order(
    req: CheckoutRequest,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Checkout Engine with 3 payment rails:
    1. DIRECT_SHOP_UPI (0% fee deep-link straight to vendor UPI)
    2. RAZORPAY (Full online payment gateway)
    3. COD (Cash On Delivery)

    Enforces -₹200 auto-pause cutoff for vendor.
    Generates 2-digit pickup PIN and 4-digit delivery PIN.
    Triggers 0.2s order alert buzzer to shopkeeper.
    """
    shop_stmt = select(Shop).where(Shop.id == req.shop_id)
    shop = (await db.execute(shop_stmt)).scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    if not shop.is_open:
        raise HTTPException(status_code=400, detail="This shop is currently CLOSED")

    # Check vendor dues auto-lock
    owner_stmt = select(User).where(User.id == shop.owner_id)
    owner = (await db.execute(owner_stmt)).scalar_one_or_none()
    if owner and owner.wallet_balance <= owner.dues_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shop orders temporarily paused due to pending ServoLocal dues. Please settle dues to resume."
        )

    # Validate items and calculate subtotal
    items_total = 0.0
    order_items_to_create = []

    for item_req in req.items:
        inv_stmt = select(ShopInventory).where(
            and_(
                ShopInventory.id == item_req.inventory_id,
                ShopInventory.shop_id == req.shop_id
            )
        )
        inv = (await db.execute(inv_stmt)).scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail=f"Inventory item ID {item_req.inventory_id} not found")

        if inv.available_stock < item_req.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {inv.available_stock} units of '{inv.name}' available in stock"
            )

        # Multi-pack variant resolution
        unit_price = inv.selling_price
        pack_label = inv.weight_or_size
        if item_req.variant_id and inv.variants:
            for v in (inv.variants or []):
                if v.get("id") == item_req.variant_id:
                    unit_price = float(v.get("price", unit_price))
                    pack_label = v.get("weight_or_size", pack_label)
                    break
        elif item_req.pack_label:
            pack_label = item_req.pack_label

        line_total = round(unit_price * item_req.quantity, 2)
        items_total += line_total

        # Decrement stock
        inv.available_stock -= item_req.quantity
        inv.sold_count += item_req.quantity

        order_items_to_create.append({
            "inventory_id": inv.id,
            "item_name": inv.name,
            "weight_or_size": pack_label,
            "variant_id": item_req.variant_id,
            "selected_pack_label": pack_label,
            "unit_price": unit_price,
            "quantity": item_req.quantity,
            "total_price": line_total
        })

    # Financials
    is_free = shop.free_delivery_enabled and (items_total >= shop.min_order_for_free_delivery)
    delivery_fee = 0.0 if is_free else shop.base_delivery_fee
    platform_fee = 5.0

    # Coupon Evaluation & Discount
    coupon_eval = await evaluate_coupon(req.coupon_code, items_total, db)
    discount_amount = coupon_eval["discount"]
    grand_total = max(0.0, round(items_total + delivery_fee + platform_fee - discount_amount, 2))

    # Unique Codes & PINs
    order_code = f"SL-{secrets.randbelow(900000) + 100000}"
    pickup_pin = f"{secrets.randbelow(90) + 10}"      # 2-digit PIN
    delivery_pin = f"{secrets.randbelow(9000) + 1000}" # 4-digit PIN

    # Payment Rail Setup
    payment_method = req.payment_method.upper().strip()
    razorpay_order_id = None
    upi_intent_link = None

    if payment_method == "RAZORPAY":
        rzp_order = create_razorpay_order(grand_total, receipt_id=order_code)
        razorpay_order_id = rzp_order.get("id")
    elif payment_method == "DIRECT_SHOP_UPI":
        target_upi = shop.seller_upi_id or "servolocal@oksbi"
        upi_intent_link = generate_direct_shop_upi_link(
            upi_id=target_upi,
            shop_name=shop.name,
            amount_inr=grand_total,
            order_number=order_code
        )

    # Create Order
    new_order = Order(
        order_code=order_code,
        customer_id=current_user.id,
        shop_id=shop.id,
        delivery_partner_id=None,
        status="PLACED",
        delivery_scope="LOCAL",
        pickup_pin=pickup_pin,
        delivery_pin=delivery_pin,
        payment_method=payment_method,
        payment_status="PENDING",
        razorpay_order_id=razorpay_order_id,
        items_total=round(items_total, 2),
        delivery_fee=delivery_fee,
        platform_fee=platform_fee,
        discount_amount=discount_amount,
        grand_total=grand_total,
        delivery_address=req.delivery_address.strip(),
        delivery_lat=req.delivery_lat,
        delivery_lng=req.delivery_lng,
        customer_notes=req.customer_notes
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    # Attach order items
    for oi in order_items_to_create:
        db_oi = OrderItem(
            order_id=new_order.id,
            inventory_id=oi["inventory_id"],
            item_name=oi["item_name"],
            weight_or_size=oi["weight_or_size"],
            variant_id=oi.get("variant_id"),
            selected_pack_label=oi.get("selected_pack_label"),
            unit_price=oi["unit_price"],
            quantity=oi["quantity"],
            total_price=oi["total_price"]
        )
        db.add(db_oi)

    await db.commit()

    # Trigger Loud Order Ring Buzzer to Shopkeeper
    if owner and owner.fcm_token:
        send_loud_order_ring(owner.fcm_token, order_code, grand_total, mode="NEW_ORDER")

    # Send Order Placed Confirmation to Customer
    if current_user and current_user.fcm_token:
        send_customer_order_update(current_user.fcm_token, order_code, "PLACED", shop_name=shop.name)

    return {
        "success": True,
        "message": f"Order #{order_code} placed successfully!",
        "order": {
            "id": new_order.id,
            "order_code": new_order.order_code,
            "status": new_order.status,
            "grand_total": new_order.grand_total,
            "pickup_pin": new_order.pickup_pin,
            "delivery_pin": new_order.delivery_pin,
            "payment_method": new_order.payment_method,
            "razorpay_order_id": razorpay_order_id,
            "upi_intent_link": upi_intent_link,
            "shop_name": shop.name,
            "shop_locality": shop.locality_name,
        }
    }


# ── 3. POST /api/orders/clear-dues ──────────────────────────────────────

@router.post("/clear-dues", status_code=status.HTTP_200_OK)
async def clear_platform_dues(
    req: ClearDuesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sellers / Delivery Partners with negative wallet dues (<= -₹200 limit)
    recharge their account via Razorpay to un-pause orders immediately.
    """
    if req.razorpay_order_id and req.razorpay_payment_id and req.razorpay_signature:
        # Verify Razorpay signature
        is_valid = verify_razorpay_signature(
            req.razorpay_order_id,
            req.razorpay_payment_id,
            req.razorpay_signature
        )
        if not is_valid:
            raise HTTPException(status_code=400, detail="Razorpay payment signature verification failed")

    # Credit user wallet balance
    current_user.wallet_balance += req.amount
    ledger = WalletLedger(
        user_id=current_user.id,
        order_id=None,
        transaction_type="RAZORPAY_RECHARGE",
        amount=req.amount,
        balance_after=current_user.wallet_balance,
        notes=f"Dues cleared via Razorpay ({req.razorpay_payment_id or 'Online'})",
        razorpay_payment_id=req.razorpay_payment_id
    )
    db.add(ledger)
    await db.commit()

    return {
        "success": True,
        "message": f"₹{req.amount:.2f} credited! Your account dues are cleared.",
        "new_balance": current_user.wallet_balance,
        "is_unlocked": current_user.wallet_balance > current_user.dues_limit
    }


# ── 4. POST /api/orders/review ──────────────────────────────────────────

@router.post("/review", status_code=status.HTTP_201_CREATED)
async def submit_order_review(
    req: OrderReviewRequest,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Submits real-time 1-5 star ratings for Shop and Delivery Partner.
    Dynamically recalculates shop's public rating.
    """
    order_stmt = select(Order).where(Order.id == req.order_id)
    order = (await db.execute(order_stmt)).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only review your own orders")

    # Check if review already exists
    existing_stmt = select(OrderReview).where(OrderReview.order_id == order.id)
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Review already submitted for this order")

    review = OrderReview(
        order_id=order.id,
        customer_id=current_user.id,
        shop_id=order.shop_id,
        partner_id=order.delivery_partner_id,
        shop_rating=req.shop_rating,
        partner_rating=req.partner_rating or 5,
        comment=req.comment
    )
    db.add(review)

    # Recalculate Shop rating
    avg_stmt = select(func.avg(OrderReview.shop_rating)).where(OrderReview.shop_id == order.shop_id)
    avg_rating = (await db.execute(avg_stmt)).scalar()
    if avg_rating:
        shop_stmt = select(Shop).where(Shop.id == order.shop_id)
        shop = (await db.execute(shop_stmt)).scalar_one_or_none()
        if shop:
            shop.rating = round(float(avg_rating), 1)

    await db.commit()

    return {
        "success": True,
        "message": "Thank you for your feedback!",
        "shop_rating": req.shop_rating
    }
