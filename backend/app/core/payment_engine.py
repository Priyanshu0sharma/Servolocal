import hmac
import hashlib
import urllib.parse
import uuid
import logging
from typing import Dict, Any

import razorpay
from app.core.config import settings

logger = logging.getLogger("payment_engine")


def _get_razorpay_client() -> razorpay.Client:
    """Initializes and returns Razorpay API client."""
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


def create_razorpay_order(amount_inr: float, receipt_id: str) -> Dict[str, Any]:
    """
    Creates a Razorpay order in INR (amount converted to paise: amount * 100).
    Safely falls back to a structured mock order if keys are in test mode or unconfigured.
    """
    amount_paise = int(round(amount_inr * 100))

    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        try:
            client = _get_razorpay_client()
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "notes": {
                    "platform": "ServoLocal",
                    "receipt_id": receipt_id,
                },
            }
            return client.order.create(data=order_data)
        except Exception as e:
            logger.warning(f"[RAZORPAY CREATE WARNING] {e}. Falling back to standard format.")

    # Safe fallback order structure for local testing
    return {
        "id": f"order_mock_{uuid.uuid4().hex[:14]}",
        "entity": "order",
        "amount": amount_paise,
        "amount_paid": 0,
        "amount_due": amount_paise,
        "currency": "INR",
        "receipt": receipt_id,
        "status": "created",
        "notes": {"platform": "ServoLocal"},
    }


def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Cryptographically verifies Razorpay payment signature using HMAC SHA256.
    """
    if not (razorpay_order_id and razorpay_payment_id and razorpay_signature):
        return False

    secret = (settings.RAZORPAY_KEY_SECRET or "").encode("utf-8")
    payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")

    generated_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated_signature, razorpay_signature)


def generate_direct_shop_upi_link(
    upi_id: str,
    shop_name: str,
    amount_inr: float,
    order_number: str,
) -> str:
    """
    Generates a standard UPI deep-link (upi://pay?pa=...) for 0% gateway charge
    direct payments straight into the shopkeeper's or delivery partner's VPA.
    Compatible with GPay, PhonePe, Paytm, and BHIM UPI.
    """
    clean_upi = upi_id.strip()
    encoded_name = urllib.parse.quote(shop_name.strip())
    encoded_note = urllib.parse.quote(f"ServoLocal Order {order_number}")
    formatted_amount = f"{amount_inr:.2f}"

    return (
        f"upi://pay?pa={clean_upi}"
        f"&pn={encoded_name}"
        f"&am={formatted_amount}"
        f"&cu=INR"
        f"&tn={encoded_note}"
    )


def calculate_order_financials(
    items_total: float,
    delivery_fee: float,
    commission_pct: float = 10.0,
    platform_fee: float = 5.0,
    has_partner_referral: bool = False,
) -> Dict[str, float]:
    """
    Calculates exact Stage 1 multi-party order economics:
    - grand_total: items + delivery + platform fee (₹5)
    - platform_commission_amount: shop items subtotal * commission %
    - partner_referral_royalty: ₹2.00 lifetime royalty if shop was onboarded by partner
    - seller_net_amount: items total minus platform commission
    - partner_earning_amount: delivery fee + referral royalty
    """
    grand_total = round(items_total + delivery_fee + platform_fee, 2)
    commission_amount = round(items_total * (commission_pct / 100.0), 2)
    partner_referral_royalty = 2.0 if has_partner_referral else 0.0

    seller_net_amount = round(items_total - commission_amount, 2)
    partner_earning = round(delivery_fee + partner_referral_royalty, 2)

    return {
        "items_total": round(items_total, 2),
        "delivery_fee": round(delivery_fee, 2),
        "platform_fee": round(platform_fee, 2),
        "grand_total": grand_total,
        "platform_commission_amount": commission_amount,
        "partner_referral_royalty": partner_referral_royalty,
        "seller_net_amount": seller_net_amount,
        "partner_earning_amount": partner_earning,
    }
