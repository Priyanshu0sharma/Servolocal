from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.db.models import PaymentIntent, Order
from app.core.razorpay_client import razorpay_service

router = APIRouter(prefix="/payments", tags=["Payments & Razorpay"])


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


