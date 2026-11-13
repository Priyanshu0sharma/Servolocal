import logging
from typing import Optional, Dict
import firebase_admin
from firebase_admin import credentials, messaging
from app.core.config import settings

logger = logging.getLogger(__name__)


class FirebaseAdminService:
    """
    Firebase Admin SDK service for Server-Side Push Notifications (FCM).
    """

    def __init__(self):
        self.is_configured = False
        self._initialize()

    def _initialize(self):
        if not settings.FIREBASE_ADMIN_PRIVATE_KEY or not settings.FIREBASE_ADMIN_CLIENT_EMAIL:
            logger.info("Firebase Admin credentials not fully supplied. FCM notifications will be skipped.")
            return

        try:
            if not firebase_admin._apps:
                raw_key = settings.FIREBASE_ADMIN_PRIVATE_KEY.replace("\\n", "\n")
                cert_dict = {
                    "type": settings.FIREBASE_ADMIN_TYPE or "service_account",
                    "project_id": settings.FIREBASE_ADMIN_PROJECT_ID or "servolocal-97365",
                    "private_key_id": settings.FIREBASE_ADMIN_PRIVATE_KEY_ID or "",
                    "private_key": raw_key,
                    "client_email": settings.FIREBASE_ADMIN_CLIENT_EMAIL,
                    "client_id": settings.FIREBASE_ADMIN_CLIENT_ID or "",
                    "auth_uri": settings.FIREBASE_ADMIN_AUTH_URI or "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": settings.FIREBASE_ADMIN_TOKEN_URI or "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": settings.FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL or "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": settings.FIREBASE_ADMIN_CLIENT_CERT_URL or "",
                }
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
            self.is_configured = True
            logger.info("Firebase Admin SDK successfully initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")

    def send_push_notification(
        self,
        fcm_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
    ) -> bool:
        """
        Sends an order update or status notification to a customer or delivery partner's device.
        """
        if not self.is_configured or not fcm_token:
            return False

        try:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=fcm_token,
            )
            response = messaging.send(message)
            logger.info(f"FCM Notification successfully delivered: {response}")
            return True
        except Exception as e:
            logger.warning(f"FCM push notification delivery failed: {e}")
            return False


firebase_service = FirebaseAdminService()

