from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict
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


@router.post("/create-order")
async def create_razorpay_order(payload: CreatePaymentOrderRequest):
    """
    Creates a new Razorpay payment order for customer checkout.
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

    return {
        "success": True,
        "payment_order": order,
    }


@router.post("/verify")
async def verify_razorpay_payment(payload: VerifyPaymentRequest):
    """
    Cryptographically verifies the Razorpay payment signature.
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

    return {
        "success": True,
        "verified": True,
        "message": "Payment verified successfully!",
        "payment_id": payload.razorpay_payment_id,
    }

