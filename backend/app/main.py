import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine, Base, AsyncSessionLocal, check_db_connection, get_db
from app.db.seed_catalog import seed_master_catalog, seed_initial_admin

# ── Import API Routers ───────────────────────────────────────────
from app.api.routes_auth import router as auth_router
from app.api.routes_discovery import router as discovery_router
from app.api.routes_seller import router as seller_router
from app.api.routes_partner import router as partner_router
from app.api.routes_orders import router as orders_router
from app.api.routes_admin import router as admin_router, fetch_app_config_data
from app.api.routes_legal import router as legal_router

logger = logging.getLogger("servolocal.startup")


# ── Lifespan Event: Validation, Migrations & Safe Seeding ────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Validate production environment variables without leaking credentials
    try:
        settings.validate_production_config()
        logger.info("[CONFIG] Environment configuration validated successfully.")
    except Exception as e:
        logger.error("[CONFIG ERROR] %s", e)
        if settings.is_production:
            raise

    # 2. Database connectivity health check (Alembic is the single migration mechanism)
    try:
        db_ok = await check_db_connection()
        if db_ok:
            logger.info("[DATABASE] Database connectivity verified successfully.")
        else:
            logger.warning("[DATABASE] Database health probe returned false.")
            if settings.is_production:
                raise ConnectionError("Database health probe failed during startup.")
    except Exception as e:
        logger.error("[DATABASE INIT ERROR] %s", e)
        if settings.is_production:
            raise

    # 3. Production Database Safety: Separate Dev Seeding from Production
    if settings.is_production:
        logger.info("[STARTUP] PRODUCTION environment detected: Automated dev account & shop seeding is DISABLED.")
        # Only seed master catalog in production if explicitly configured
        if getattr(settings, "AUTO_SEED_CATALOG", False):
            try:
                async with AsyncSessionLocal() as session:
                    count = await seed_master_catalog(session)
                    logger.info("[CATALOG] Master catalog updated (%d items available).", count)
            except Exception as e:
                logger.error("[CATALOG SEED ERROR] %s", e)
    else:
        # Development / Staging environment: seed demo data only when explicitly enabled
        if getattr(settings, "SEED_DEV_DATA", False):
            try:
                async with AsyncSessionLocal() as session:
                    count = await seed_master_catalog(session)
                    logger.info("[DATABASE] Master catalog ready (%d items).", count)
                    await seed_initial_admin(session)
                    from app.db.seed_catalog import seed_initial_shops_and_inventory
                    await seed_initial_shops_and_inventory(session)
                    logger.info("[DATABASE] Development demo shops and initial accounts seeded.")
            except Exception as e:
                logger.error("[DEV SEED ERROR] %s", e)
        else:
            logger.info("[STARTUP] Development mode active: Automated demo shop seeding is skipped (set SEED_DEV_DATA=true to enable).")

    yield


# ── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS — Explicit Trusted-Origin Allowlist ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Mount Complete Platform API Routers ──────────────────────────
app.include_router(auth_router)
app.include_router(discovery_router)
app.include_router(seller_router)
app.include_router(partner_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(legal_router)


# ── Root Endpoint ────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "app": "ServoLocal High-Speed API",
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "discovery": "/api/discovery",
            "seller": "/api/seller",
            "partner": "/api/partner",
            "orders": "/api/orders",
            "admin": "/api/admin",
            "legal": "/api/legal",
        }
    }


# ── Health Check — DB + All API Keys Verification ────────────────
@app.get("/health")
@app.get("/api/health")
async def health_check(response: Response):
    """
    Production health probe:
    1. Tests live Neon PostgreSQL connection
    2. Confirms every .env API key is loaded (non-empty)
    Returns 200 OK when healthy/degraded, 503 if database disconnected.
    """
    db_ok = await check_db_connection()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

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
        "status": "healthy" if (db_ok and all_keys_ok) else ("degraded" if db_ok else "unhealthy"),
        "database": "connected" if db_ok else "disconnected",
        "env_keys": key_checks,
        "all_keys_loaded": all_keys_ok,
        "version": settings.VERSION,
    }


# ── App Version Checker — Remote Update Modal ────────────────────
@app.get("/api/version")
async def get_app_version():
    """
    Remote version checker for mobile (Flutter/Capacitor) and web apps.
    Powers 'Update ServoLocal Now' popup modal dynamically.
    """
    return {
        "current_app_version": settings.VERSION,
        "latest_version": "1.0.0",
        "min_required_version": "1.0.0",
        "force_update": False,
        "update_url": "https://servolocal.in",
        "announcement": {
            "title": "Welcome to ServoLocal",
            "message": "Hyperlocal instant delivery + Pan-India direct vendor marketplace.",
            "show_banner": False,
        }
    }


# ── Live Public App Config & Promo Banners ───────────────────────
@app.get("/api/app-config")
async def get_app_config(db: AsyncSession = Depends(get_db)):
    """
    Public live app configuration and promo banners endpoint for customer & partner apps.
    """
    return await fetch_app_config_data(db)
