from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.db.models import PaymentIntent, Order, User, WalletLedger
from app.core.razorpay_client import razorpay_service
from app.api.auth import decode_token

router = APIRouter(prefix="/payments", tags=["Payments & Razorpay"])


def get_current_customer(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in.",
        )
    token = authorization.split(" ")[1]
    return decode_token(token)


class CreatePaymentOrderRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR")
    receipt: str = Field(..., description="Order code / receipt reference")
    notes: Optional[Dict[str, str]] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: Optional[int] = None


@router.post("/create-order")
async def create_razorpay_order(
    payload: CreatePaymentOrderRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new Razorpay payment order for customer checkout and persists in PaymentIntent.
    """
    if not razorpay_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Razorpay payment gateway is not configured.",
        )

    order = razorpay_service.create_order(
        amount_in_rupees=payload.amount,
        receipt=payload.receipt,
        notes=payload.notes,
    )

    if not order:
        raise HTTPException(status_code=500, detail="Failed to initialize payment gateway order.")

    try:
        p_intent = PaymentIntent(
            purpose="CUSTOMER_ORDER_CHECKOUT",
            amount=payload.amount,
            razorpay_order_id=order.get("id"),
            status="CREATED",
            created_at=datetime.now(timezone.utc),
        )
        db.add(p_intent)
        await db.commit()
    except Exception:
        pass

    return {
        "success": True,
        "payment_order": order,
        "key_id": razorpay_service.key_id,
    }


@router.post("/verify")
async def verify_razorpay_payment(
    payload: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Cryptographically verifies the Razorpay payment signature and updates payment status.
    """
    if not razorpay_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Razorpay payment gateway is not configured.",
        )

    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment signature. Transaction verification failed.",
        )

    try:
        # Update PaymentIntent
        await db.execute(
            update(PaymentIntent)
            .where(PaymentIntent.razorpay_order_id == payload.razorpay_order_id)
            .values(
                razorpay_payment_id=payload.razorpay_payment_id,
                status="PAID",
            )
        )
        # If order_id provided, mark order payment_status PAID
        if payload.order_id:
            await db.execute(
                update(Order)
                .where(Order.id == payload.order_id)
                .values(payment_status="PAID")
            )
        await db.commit()
    except Exception:
        pass

    return {
        "success": True,
        "verified": True,
        "message": "Payment verified successfully!",
        "payment_id": payload.razorpay_payment_id,
    }


# ─── WALLET TOP-UP WITH RAZORPAY (UPI QR, CARDS, NETBANKING) ───────────────

class WalletTopupCreateRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR to add to wallet")


class WalletTopupVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount: float


@router.post("/wallet/topup/create-order")
async def create_wallet_topup_order(
    payload: WalletTopupCreateRequest,
    customer: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a dedicated Razorpay payment order for adding real money / tokens to customer wallet.
    """
    if not razorpay_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Razorpay payment gateway is not configured.",
        )

    receipt = f"wal_{customer.get('id')}_{int(datetime.now(timezone.utc).timestamp())}"
    order = razorpay_service.create_order(
        amount_in_rupees=payload.amount,
        receipt=receipt,
        notes={"user_id": str(customer.get("id")), "purpose": "WALLET_TOPUP"},
    )
    if not order:
        raise HTTPException(status_code=500, detail="Failed to initialize Razorpay wallet top-up order.")

    try:
        p_intent = PaymentIntent(
            purpose="WALLET_TOPUP",
            amount=payload.amount,
            razorpay_order_id=order.get("order_id") or order.get("id"),
            status="CREATED",
            created_at=datetime.now(timezone.utc),
        )
        db.add(p_intent)
        await db.commit()
    except Exception:
        pass

    return {
        "success": True,
        "payment_order": order,
        "key_id": razorpay_service.key_id,
        "amount": payload.amount,
    }


@router.post("/wallet/topup/verify")
async def verify_wallet_topup(
    payload: WalletTopupVerifyRequest,
    customer: dict = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Cryptographically verifies Razorpay payment signature and credits real INR balance and bonus coins to customer wallet.
    """
    if not razorpay_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Razorpay payment gateway is not configured.",
        )

    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment signature. Transaction verification failed.",
        )

    user_id = customer.get("id")
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Credit wallet
    user.wallet_balance = (user.wallet_balance or 0.0) + payload.amount
    # Bonus ServoCoins: 10% bonus tokens
    bonus_coins = int(payload.amount * 0.1)
    user.servo_coins = (user.servo_coins or 0) + bonus_coins

    ledger = WalletLedger(
        user_id=user.id,
        entry_type="CREDIT",
        amount=payload.amount,
        balance_after=user.wallet_balance,
        note=f"Wallet Top-Up via Razorpay UPI/Card ({payload.razorpay_payment_id})",
        created_at=datetime.now(timezone.utc),
    )
    db.add(ledger)

    # Update PaymentIntent
    try:
        await db.execute(
            update(PaymentIntent)
            .where(PaymentIntent.razorpay_order_id == payload.razorpay_order_id)
            .values(razorpay_payment_id=payload.razorpay_payment_id, status="PAID")
        )
    except Exception:
        pass

    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "verified": True,
        "message": f"₹{payload.amount:.2f} successfully credited to your wallet balance!",
        "new_balance": round(user.wallet_balance, 2),
        "new_coins": user.servo_coins,
        "bonus_coins": bonus_coins,
        "payment_id": payload.razorpay_payment_id,
    }



