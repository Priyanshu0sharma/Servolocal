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

    # ─── Database SSL & Pooling ─────────────────────────────────
    DB_SSL_MODE: str = "require"  # require, verify-full, verify-ca, disable
    DB_SSL_CA_PATH: Optional[str] = None

    # ─── Production Seeding Controls ────────────────────────────
    SEED_DEV_DATA: bool = False      # Never seed dev test accounts or demo shops in prod
    AUTO_SEED_CATALOG: bool = False  # Controlled master catalog seeding

    # ─── CORS Origins Allowlist ─────────────────────────────────
    CORS_ALLOWED_ORIGINS: Optional[str] = None
    CORS_ORIGIN_REGEX: Optional[str] = (
        r"^https://(customer(-web)?|partner(-web)?)(-[a-zA-Z0-9-]+)?\.vercel\.app$"
    )
    BACKEND_CORS_ORIGINS: List[str] = [
        # Local development
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        # Custom production domains
        "https://servolocal.in",
        "https://www.servolocal.in",
        "https://partner.servolocal.in",
        # Stable Vercel production domains
        "https://customer-web-alpha-eight.vercel.app",
        "https://customer-web.vercel.app",
        "https://partner-web-inky.vercel.app",
        "https://partner-web.vercel.app",
        # Active customer preview deployment
        "https://customer-fo2kzwr8v-priyanshu0sharmas-projects.vercel.app",
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

    @property
    def is_production(self) -> bool:
        """Returns True if the application is configured to run in production mode."""
        return self.NODE_ENV.strip().lower() in ("production", "prod")

    @property
    def cors_origins_list(self) -> List[str]:
        """
        Builds the explicit trusted-origins list:
        Combines BACKEND_CORS_ORIGINS with any custom CORS_ALLOWED_ORIGINS specified in .env.
        Safeguards against combining wildcard '*' with credentials.
        """
        origins = list(self.BACKEND_CORS_ORIGINS)
        if self.CORS_ALLOWED_ORIGINS:
            for o in self.CORS_ALLOWED_ORIGINS.split(","):
                clean = o.strip()
                if clean and clean != "*" and clean not in origins:
                    origins.append(clean)
        return origins

    @staticmethod
    def sanitize_database_url(url: str) -> str:
        """
        Masks password in database URLs for credential-safe logging and error messages.
        E.g. postgresql+asyncpg://user:secret@host:5432/db -> postgresql+asyncpg://user:***@host:5432/db
        """
        if not url:
            return "[EMPTY_DATABASE_URL]"
        return re.sub(r"://([^/:]+):(.*)@", r"://\1:***@", url)

    def validate_production_config(self) -> None:
        """
        Validates required environment variables when running in production.
        Provides clear, human-readable errors without leaking secret values or passwords.
        """
        if not self.is_production:
            return

        missing = []
        if not self.DATABASE_URL or not self.DATABASE_URL.strip():
            missing.append("DATABASE_URL")
        elif not ("postgres://" in self.DATABASE_URL or "postgresql://" in self.DATABASE_URL):
            raise ValueError(
                "Production configuration error: 'DATABASE_URL' must be a valid PostgreSQL connection string."
            )

        if not self.JWT_SECRET or len(self.JWT_SECRET.strip()) < 16:
            missing.append("JWT_SECRET (must be >= 16 characters for production security)")

        if missing:
            missing_str = ", ".join(missing)
            raise ValueError(
                f"Production configuration error: The following required environment variables are missing or insecure: {missing_str}. "
                "Please configure them in your production environment / secrets manager."
            )

    def check_key_loaded(self, key_name: str) -> bool:
        """Returns True if the given setting has a non-empty value."""
        val = getattr(self, key_name, "")
        return bool(val and str(val).strip())


settings = Settings()

