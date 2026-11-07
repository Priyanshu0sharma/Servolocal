import os
import logging
from typing import Optional, Dict, Any

import firebase_admin
from firebase_admin import credentials, messaging
from app.core.config import settings

logger = logging.getLogger("fcm_notify")

_firebase_initialized = False


def _init_firebase() -> bool:
    """Initializes Firebase Admin SDK using credentials file or .env dictionary."""
    global _firebase_initialized
    if _firebase_initialized or len(firebase_admin._apps) > 0:
        _firebase_initialized = True
        return True

    # 1. Try file path if specified
    cred_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", "")
    if cred_path and os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("[FCM] Initialized via credentials file.")
            return True
        except Exception as e:
            logger.warning(f"[FCM FILE INIT WARNING] {e}")

    # 2. Try dictionary loaded from .env
    cred_dict = settings.firebase_admin_credentials_dict
    if cred_dict.get("private_key") and cred_dict.get("project_id"):
        try:
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("[FCM] Initialized via environment dictionary.")
            return True
        except Exception as e:
            logger.warning(f"[FCM DICT INIT WARNING] {e}")

    return False


def send_push_notification(
    fcm_token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Sends an FCM high-priority push notification.
    Safely falls back to console logging in development if FCM is not configured.
    """
    if not fcm_token or not fcm_token.strip():
        return False

    is_ready = _init_firebase()
    if not is_ready:
        logger.info(
            f"[FCM DEV LOG] Token: {fcm_token[:12]}... | Title: {title} | Body: {body} | Data: {data}"
        )
        return True

    try:
        # Stringify all data payload values for FCM compatibility
        string_data = {str(k): str(v) for k, v in (data or {}).items()}

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=string_data,
            token=fcm_token.strip(),
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    sound="default",
                    channel_id="servo_high_priority_channel",
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound="default",
                        content_available=True,
                    )
                )
            ),
        )

        response = messaging.send(message)
        logger.info(f"[FCM SUCCESS] Message dispatched: {response}")
        return True
    except Exception as e:
        logger.warning(f"[FCM SEND WARNING] {e}")
        return False


def send_low_stock_alert(
    fcm_token: str,
    shop_name: str,
    item_name: str,
    remaining_stock: int,
) -> bool:
    """
    Sends an urgent low-stock warning notification to the shopkeeper
    when inventory reaches or drops below threshold.
    """
    title = f"⚠️ Low Stock Alert — {shop_name}"
    body = f"Only {remaining_stock} units of '{item_name}' remaining! Restock soon."
    data = {
        "type": "LOW_STOCK",
        "shop_name": shop_name,
        "item_name": item_name,
        "remaining_stock": str(remaining_stock),
    }
    return send_push_notification(fcm_token, title, body, data)


def send_loud_order_ring(
    fcm_token: str,
    order_number: str,
    amount: float,
    mode: str = "NEW_ORDER",
) -> bool:
    """
    Sends a loud high-priority buzzer ring alert to Seller or Delivery Partner.
    Plays order_alarm.mp3 on device.
    """
    if mode == "NEW_ORDER":
        title = "🔔 New Incoming Order Received!"
        body = f"Order #{order_number} for ₹{amount:.2f}. Tap to accept now!"
    else:
        title = "🚀 Order Ready For Pickup!"
        body = f"Order #{order_number} is packed and ready for delivery."

    data = {
        "type": mode,
        "order_number": order_number,
        "amount": f"{amount:.2f}",
        "sound": "order_alarm.mp3",
        "priority": "high",
        "channel_id": "servo_order_buzzer_channel",
    }
    return send_push_notification(fcm_token, title, body, data)
