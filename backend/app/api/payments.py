from asyncio import to_thread
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import active_session
from app.core.razorpay_client import razorpay_service
from app.db.models import PaymentIntent, User, WalletLedger
from app.db.session import get_db

router = APIRouter(prefix="/payments", tags=["Payments & Razorpay"])


class WalletTopupCreateRequest(BaseModel):
    amount: float = Field(gt=0, multiple_of=0.01, allow_inf_nan=False)


class CreatePaymentOrderRequest(WalletTopupCreateRequest):
    receipt: str = Field(min_length=1, max_length=40)
    notes: Optional[dict[str, str]] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


async def create_intent(db, user_id, purpose, amount, receipt, notes):
    if not razorpay_service.is_configured:
        raise HTTPException(503, "Razorpay is unavailable.")
    order = await to_thread(razorpay_service.create_order, amount, receipt, notes)
    if not order or not order.get("order_id"):
        raise HTTPException(502, "Payment order creation failed.")
    db.add(PaymentIntent(purpose=purpose, user_id=user_id, amount=amount,
                         razorpay_order_id=order["order_id"], status="CREATED"))
    await db.commit()
    return {"success": True, "payment_order": order, "key_id": razorpay_service.key_id, "amount": amount}


async def verify_intent(db, user_id, purpose, payload):
    if not razorpay_service.is_configured:
        raise HTTPException(503, "Razorpay is unavailable.")
    if not razorpay_service.verify_payment_signature(**payload.model_dump()):
        raise HTTPException(400, "Payment signature verification failed.")
    intent = await db.scalar(select(PaymentIntent).where(
        PaymentIntent.user_id == user_id, PaymentIntent.purpose == purpose,
        PaymentIntent.razorpay_order_id == payload.razorpay_order_id,
    ).with_for_update())
    if intent is None:
        raise HTTPException(404, "Payment order not found.")
    if intent.status != "CREATED":
        if intent.razorpay_payment_id != payload.razorpay_payment_id or intent.status not in ("PAID", "APPLIED"):
            raise HTTPException(409, "Payment order is unavailable.")
        return intent, False
    try:
        payment = await to_thread(razorpay_service.fetch_payment, payload.razorpay_payment_id)
    except Exception:
        raise HTTPException(503, "Payment status unavailable. Please retry verification.")
    if (payment.get("status") != "captured" or payment.get("currency") != "INR"
            or payment.get("order_id") != intent.razorpay_order_id or payment.get("amount_refunded", 0)
            or payment.get("amount") != round(intent.amount * 100)):
        raise HTTPException(409, "A captured payment for the full amount is required.")
    intent.razorpay_payment_id = payload.razorpay_payment_id
    intent.status = "PAID"
    return intent, True


@router.post("/create-order")
async def create_razorpay_order(payload: CreatePaymentOrderRequest, user: dict = Depends(active_session),
                                db: AsyncSession = Depends(get_db)):
    return await create_intent(db, user["id"], "CUSTOMER_ORDER_CHECKOUT", payload.amount,
                               payload.receipt, payload.notes)


@router.post("/verify")
async def verify_razorpay_payment(payload: VerifyPaymentRequest, user: dict = Depends(active_session),
                                  db: AsyncSession = Depends(get_db)):
    await verify_intent(db, user["id"], "CUSTOMER_ORDER_CHECKOUT", payload)
    await db.commit()
    return {"success": True, "verified": True, "payment_id": payload.razorpay_payment_id}


@router.post("/wallet/topup/create-order")
async def create_wallet_topup_order(payload: WalletTopupCreateRequest, user: dict = Depends(active_session),
                                    db: AsyncSession = Depends(get_db)):
    receipt = f"wal_{user['id']}_{int(datetime.now(timezone.utc).timestamp())}"
    return await create_intent(db, user["id"], "WALLET_TOPUP", payload.amount, receipt, {"purpose": "WALLET_TOPUP"})


@router.post("/wallet/topup/verify")
async def verify_wallet_topup(payload: VerifyPaymentRequest, customer: dict = Depends(active_session),
                              db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.id == customer["id"]).with_for_update()
                           .execution_options(populate_existing=True))
    intent, newly_paid = await verify_intent(db, user.id, "WALLET_TOPUP", payload)
    bonus = int(intent.amount * 0.1)
    if newly_paid:
        user.wallet_balance = round(user.wallet_balance + intent.amount, 2)
        user.servo_coins += bonus
        db.add(WalletLedger(user_id=user.id, entry_type="CREDIT", amount=intent.amount,
                            balance_after=user.wallet_balance, note=f"Wallet top-up ({payload.razorpay_payment_id})"))
    await db.commit()
    return {"success": True, "verified": True, "new_balance": user.wallet_balance,
            "new_coins": user.servo_coins, "bonus_coins": bonus, "payment_id": payload.razorpay_payment_id}
