import os
import secrets
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """ServoLocal Backend Application Settings."""

    # Service Info
    SERVICE_NAME: str = "servolocal-api"
    APP_ENV: str = "development"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Configuration - Strict by default, customized via environment
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://servolocal.vercel.app",
        "https://servopartner.vercel.app",
        "https://admin-web-one-jet.vercel.app",
        "https://servolocal.in",
        "https://www.servolocal.in",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "https://servolocal.vercel.app"]

    # Database Configuration (Neon PostgreSQL)
    DATABASE_URL: Optional[str] = None

    # Upstash Redis Cache Configuration
    REDIS_URL: Optional[str] = None
    UPSTASH_REDIS_REST_URL: Optional[str] = None
    UPSTASH_REDIS_REST_TOKEN: Optional[str] = None

    # Cloudflare R2 Object Storage
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: str = "servolocal"
    R2_PUBLIC_URL: str = "https://pub-8897640d3c294b099af1aa1be730700b.r2.dev"
    R2_ENDPOINT: Optional[str] = None
    R2_TOKEN: Optional[str] = None

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None

    # Google OAuth 2.0
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Resend & Brevo Email Service
    RESEND_API_KEY: Optional[str] = None
    BREVO_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "ServoLocal <Servolocal@resend.dev>"

    # SMTP Configuration (Fallback Email)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # JWT Security Configuration
    JWT_SECRET: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 30

    # Firebase Admin SDK Configuration
    FIREBASE_ADMIN_TYPE: str = "service_account"
    FIREBASE_ADMIN_PROJECT_ID: Optional[str] = None
    FIREBASE_ADMIN_PRIVATE_KEY_ID: Optional[str] = None
    FIREBASE_ADMIN_PRIVATE_KEY: Optional[str] = None
    FIREBASE_ADMIN_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_ADMIN_CLIENT_ID: Optional[str] = None
    FIREBASE_ADMIN_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_ADMIN_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_ADMIN_CLIENT_CERT_URL: Optional[str] = None

    # Business Defaults
    PLATFORM_FEE: float = 5.0
    MIN_WALLET_DUE_LOCK: float = -200.0
    DEFAULT_DELIVERY_RADIUS_KM: float = 5.0
    DEFAULT_FREE_DELIVERY_ABOVE: float = 150.0

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()

# Ensure JWT_SECRET is always populated with a cryptographically secure secret
if not settings.JWT_SECRET or not settings.JWT_SECRET.strip():
    settings.JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(64)
