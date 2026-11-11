import os
import secrets
from typing import List, Union
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
            # Split comma-separated string if provided in env
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "https://servolocal.vercel.app"]

    # Database Configuration
    DATABASE_URL: Union[str, None] = None

    # Redis Cache Configuration
    REDIS_URL: Union[str, None] = None

    # Security & Secret Settings - Defaults to random runtime secret if not supplied in env
    JWT_SECRET: Union[str, None] = None
    JWT_ALGORITHM: str = "HS256"

    # Email Service Providers (Resend / Brevo / SMTP)
    RESEND_API_KEY: Union[str, None] = None
    BREVO_API_KEY: Union[str, None] = None
    EMAIL_FROM: str = "ServoLocal <onboarding@resend.dev>"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",  # Safely ignore any extra keys from existing .env
        case_sensitive=True,
    )


settings = Settings()

# Ensure JWT_SECRET is always populated with a cryptographically secure secret
if not settings.JWT_SECRET or not settings.JWT_SECRET.strip():
    settings.JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(64)

