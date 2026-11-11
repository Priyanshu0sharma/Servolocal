import os
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
        "http://127.0.0.1:3000",
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
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database Configuration (Prepared for PostgreSQL in next step)
    DATABASE_URL: Union[str, None] = None

    # Redis Cache Configuration (Prepared for next step)
    REDIS_URL: Union[str, None] = None

    # Security & Secret Settings - NO FALLBACK: Must be provided via environment
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError(
                "JWT_SECRET environment variable is missing or empty. "
                "A secure secret must be provided via the environment."
            )
        return v.strip()

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",  # Safely ignore any extra keys from existing .env
        case_sensitive=True,
    )


settings = Settings()
