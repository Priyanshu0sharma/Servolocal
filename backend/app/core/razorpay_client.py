import logging
import razorpay
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class RazorpayService:
    """
    Razorpay Payment Gateway Integration for ServoLocal Orders.
    """

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.is_configured = bool(self.key_id and self.key_secret)

        self._client = None
        if self.is_configured:
            try:
                self._client = razorpay.Client(auth=(self.key_id, self.key_secret))
            except Exception as e:
                logger.error(f"Failed to initialize Razorpay Client: {e}")

    def create_order(
        self,
        amount_in_rupees: float,
        receipt: str,
        notes: Optional[Dict[str, str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a Razorpay order in paise (1 INR = 100 paise).
        """
        if not self._client:
            logger.warning("Razorpay client is not configured.")
            return None

        amount_paise = int(round(amount_in_rupees * 100))
        order_payload = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": notes or {},
        }

        try:
            order = self._client.order.create(data=order_payload)
            return {
                "order_id": order.get("id"),
                "amount": amount_in_rupees,
                "amount_paise": amount_paise,
                "currency": "INR",
                "key_id": self.key_id,
                "receipt": receipt,
            }
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            return None

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> bool:
        """
        Cryptographically verifies the HMAC SHA-256 signature returned from Razorpay checkout.
        """
        if not self._client:
            return False

        try:
            self._client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })
            return True
        except Exception as e:
            logger.warning(f"Razorpay signature verification failed: {e}")
            return False


razorpay_service = RazorpayService()

