import os
import logging
from typing import Optional, Dict, Any, List

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
    sound: str = "default",
    channel_id: str = "servo_high_priority_channel"
) -> bool:
    """
    Sends an FCM high-priority push notification.
    Safely falls back to console logging in development if FCM is not configured.
    """
    if not fcm_token or not fcm_token.strip():
        return False

    # Graceful handling for mock/test tokens during testing & development
    clean_token = fcm_token.strip()
    if "mock" in clean_token.lower() or "test" in clean_token.lower():
        logger.info(
            f"[FCM DEV DISPATCH] Token: {clean_token[:16]}... | Title: {title} | Body: {body} | Sound: {sound} | Channel: {channel_id} | Data: {data}"
        )
        return True

    is_ready = _init_firebase()
    if not is_ready:
        logger.info(
            f"[FCM DEV LOG] Token: {fcm_token[:12]}... | Title: {title} | Body: {body} | Sound: {sound} | Channel: {channel_id} | Data: {data}"
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
                    sound=sound,
                    channel_id=channel_id,
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound=f"{sound}.caf" if not sound.endswith(".caf") and sound != "default" else "default",
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


# ── 1. LOUD ORDER RING BUZZER (Shopkeeper Alert) ─────────────────────────

def send_loud_order_ring(
    fcm_token: str,
    order_number: str,
    amount: float,
    mode: str = "NEW_ORDER",
) -> bool:
    """
    Sends a loud high-priority buzzer ring alert to Seller with sound 'order_alarm.mp3'.
    Continues ringing in vendor app until accepted or acknowledged.
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
    return send_push_notification(
        fcm_token=fcm_token,
        title=title,
        body=body,
        data=data,
        sound="order_alarm.mp3",
        channel_id="servo_order_buzzer_channel"
    )


# ── 2. RIDER DELIVERY RADAR JOB PING ─────────────────────────────────────

def send_rider_job_ping(
    fcm_token: str,
    order_number: str,
    shop_name: str,
    distance_km: float,
    estimated_earning: float,
) -> bool:
    """
    Broadcasts / pings available delivery partners on their Radar.
    Plays high-priority sound and displays estimated earning.
    """
    title = "🛵 New Delivery Job Available!"
    body = f"Pickup from {shop_name} ({distance_km:.1f} km) • Earn ₹{estimated_earning:.2f}"
    data = {
        "type": "RIDER_RADAR_JOB",
        "order_number": order_number,
        "shop_name": shop_name,
        "distance_km": f"{distance_km:.1f}",
        "earning": f"{estimated_earning:.2f}",
        "priority": "high",
        "channel_id": "servo_rider_radar_channel",
    }
    return send_push_notification(
        fcm_token=fcm_token,
        title=title,
        body=body,
        data=data,
        sound="order_alarm.mp3",
        channel_id="servo_rider_radar_channel"
    )


# ── 3. CUSTOMER REAL-TIME STATUS UPDATES WITH DELIVERY PIN ──────────────

def send_customer_order_update(
    fcm_token: str,
    order_number: str,
    status: str,
    shop_name: str = "Partner Store",
    delivery_pin: Optional[str] = None,
) -> bool:
    """
    Real-time push alerts to customer:
    - PLACED: Order received
    - ACCEPTED: Preparing items
    - OUT_FOR_DELIVERY: Rider en route + 4-digit Delivery PIN
    - DELIVERED: Handover successful
    """
    status_upper = status.upper().strip()

    if status_upper == "PLACED":
        title = "🎉 Order Placed Successfully!"
        body = f"Order #{order_number} received. {shop_name} is reviewing your order."
    elif status_upper == "ACCEPTED" or status_upper == "PREPARING":
        title = "🍳 Order Confirmed!"
        body = f"{shop_name} is now preparing your fresh items."
    elif status_upper == "OUT_FOR_DELIVERY":
        pin_text = f"Share PIN {delivery_pin} with rider." if delivery_pin else "Track live on map."
        title = "🛵 Your Order is Out for Delivery!"
        body = f"Rider is approaching with order #{order_number}. {pin_text}"
    elif status_upper == "DELIVERED":
        title = "✅ Order Delivered!"
        body = f"Order #{order_number} delivered. Enjoy your purchase! Rate your experience in 1 tap."
    else:
        title = f"📦 Order #{order_number} Update"
        body = f"Your order status is now: {status}."

    data = {
        "type": "ORDER_STATUS_UPDATE",
        "order_number": order_number,
        "status": status_upper,
        "shop_name": shop_name,
        "delivery_pin": str(delivery_pin or ""),
    }
    return send_push_notification(
        fcm_token=fcm_token,
        title=title,
        body=body,
        data=data,
        sound="default",
        channel_id="servo_high_priority_channel"
    )


# ── 4. LOW STOCK VENDOR ALERT ───────────────────────────────────────────

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
    body = f"Only {remaining_stock} units of '{item_name}' remaining! Restock soon to prevent order pauses."
    data = {
        "type": "LOW_STOCK",
        "shop_name": shop_name,
        "item_name": item_name,
        "remaining_stock": str(remaining_stock),
    }
    return send_push_notification(fcm_token, title, body, data)


# ── 5. BROADCAST APP UPDATE PUSH ────────────────────────────────────────

def send_broadcast_app_update(
    tokens: List[str],
    version: str,
    update_message: str,
    playstore_url: str,
) -> int:
    """
    Dispatches a broadcast notification to users when Super Admin pushes a new app update.
    Returns count of successful dispatches.
    """
    title = f"🚀 New Update Available (v{version})"
    body = update_message or f"A brand new update v{version} is now available on Play Store. Tap to update!"
    data = {
        "type": "APP_UPDATE",
        "version": version,
        "playstore_url": playstore_url,
    }
    success_count = 0
    for tok in tokens:
        if tok and tok.strip():
            sent = send_push_notification(tok.strip(), title, body, data)
            if sent:
                success_count += 1
    return success_count
