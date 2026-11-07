import re
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    ServoLocal Master Config — loads every key from backend/.env
    Single source of truth for the entire platform.
    """

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ─── Project ─────────────────────────────────────────────────
    PROJECT_NAME: str = "ServoLocal API"
    VERSION: str = "1.0.0"

    # ─── Neon PostgreSQL ─────────────────────────────────────────
    DATABASE_URL: str = ""

    # ─── Upstash Redis ───────────────────────────────────────────
    REDIS_URL: str = ""
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""

    # ─── Cloudflare R2 ──────────────────────────────────────────
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "servolocal-assets"
    R2_PUBLIC_URL: str = ""
    R2_ENDPOINT: str = ""
    R2_TOKEN: str = ""

    # ─── Firebase Client (NEXT_PUBLIC_* are ignored by backend) ──
    FIREBASE_ADMIN_TYPE: str = "service_account"
    FIREBASE_ADMIN_PROJECT_ID: str = ""
    FIREBASE_ADMIN_PRIVATE_KEY_ID: str = ""
    FIREBASE_ADMIN_PRIVATE_KEY: str = ""
    FIREBASE_ADMIN_CLIENT_EMAIL: str = ""
    FIREBASE_ADMIN_CLIENT_ID: str = ""
    FIREBASE_ADMIN_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_ADMIN_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_ADMIN_CLIENT_CERT_URL: str = ""

    # ─── Razorpay ────────────────────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # ─── Google OAuth ────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # ─── SMTP ────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # ─── JWT ─────────────────────────────────────────────────────
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 30

    # ─── Business Defaults ──────────────────────────────────────
    PLATFORM_FEE: float = 5.0
    MIN_WALLET_DUE_LOCK: float = -200.0
    DEFAULT_DELIVERY_RADIUS_KM: float = 5.0
    DEFAULT_FREE_DELIVERY_ABOVE: float = 150.0

    # ─── App Config ─────────────────────────────────────────────
    NODE_ENV: str = "development"

    # ─── CORS Origins ───────────────────────────────────────────
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://servolocal.in",
        "https://www.servolocal.in",
        "https://partner.servolocal.in",
    ]

    # ── Derived Properties ───────────────────────────────────────

    @property
    def async_database_url(self) -> str:
        """
        Converts Neon's postgres:// or postgresql:// URL to
        postgresql+asyncpg:// and strips query params like
        ?sslmode=require&channel_binding=require so asyncpg
        connects cleanly via SSL kwarg instead.
        """
        url = self.DATABASE_URL

        # Strip query parameters (asyncpg handles SSL via connect_args)
        url = re.sub(r"\?.*$", "", url)

        # Normalize scheme to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        return url

    @property
    def clean_smtp_password(self) -> str:
        """Strips accidental leading/trailing spaces from SMTP app password."""
        return self.SMTP_PASSWORD.strip()

    @property
    def firebase_admin_credentials_dict(self) -> dict:
        """
        Reconstructs the Firebase Admin SDK JSON dict from .env variables.
        No separate JSON file needed — everything lives in .env.
        """
        return {
            "type": self.FIREBASE_ADMIN_TYPE,
            "project_id": self.FIREBASE_ADMIN_PROJECT_ID,
            "private_key_id": self.FIREBASE_ADMIN_PRIVATE_KEY_ID,
            "private_key": self.FIREBASE_ADMIN_PRIVATE_KEY.replace("\\n", "\n"),
            "client_email": self.FIREBASE_ADMIN_CLIENT_EMAIL,
            "client_id": self.FIREBASE_ADMIN_CLIENT_ID,
            "auth_uri": self.FIREBASE_ADMIN_AUTH_URI,
            "token_uri": self.FIREBASE_ADMIN_TOKEN_URI,
            "auth_provider_x509_cert_url": self.FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL,
            "client_x509_cert_url": self.FIREBASE_ADMIN_CLIENT_CERT_URL,
            "universe_domain": "googleapis.com",
        }

    def check_key_loaded(self, key_name: str) -> bool:
        """Returns True if the given setting has a non-empty value."""
        val = getattr(self, key_name, "")
        return bool(val and str(val).strip())


settings = Settings()

