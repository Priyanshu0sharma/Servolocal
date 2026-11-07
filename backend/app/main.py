from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import check_db_connection

# ── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — Allow Customer Web, Partner Web & Local Dev ───────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Root Endpoint ────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "app": "ServoLocal API",
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
    }


# ── Health Check — DB + All API Keys Verification ────────────────
@app.get("/api/health")
async def health_check():
    """
    Production health probe:
    1. Tests live Neon PostgreSQL connection
    2. Confirms every .env API key is loaded (non-empty)
    """
    db_ok = await check_db_connection()

    key_checks = {
        "neon_db": settings.check_key_loaded("DATABASE_URL"),
        "redis": settings.check_key_loaded("REDIS_URL"),
        "r2_storage": settings.check_key_loaded("R2_ACCESS_KEY_ID"),
        "r2_public_url": settings.check_key_loaded("R2_PUBLIC_URL"),
        "razorpay": settings.check_key_loaded("RAZORPAY_KEY_ID"),
        "smtp": settings.check_key_loaded("SMTP_PASSWORD"),
        "google_oauth": settings.check_key_loaded("GOOGLE_CLIENT_ID"),
        "firebase_admin": settings.check_key_loaded("FIREBASE_ADMIN_PROJECT_ID"),
        "firebase_private_key": settings.check_key_loaded("FIREBASE_ADMIN_PRIVATE_KEY"),
        "jwt_secret": settings.check_key_loaded("JWT_SECRET"),
    }

    all_keys_ok = all(key_checks.values())

    return {
        "status": "healthy" if (db_ok and all_keys_ok) else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "env_keys": key_checks,
        "all_keys_loaded": all_keys_ok,
        "version": settings.VERSION,
    }

