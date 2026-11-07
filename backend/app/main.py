from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

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


# ── Lifespan Event: Auto Table Creation & Master Catalog Seeding ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[DATABASE] Tables initialized successfully.")
    except Exception as e:
        print(f"[DATABASE INIT ERROR] {e}")

    # 2. Seed Master Brand Catalog & Super Admin User
    try:
        async with AsyncSessionLocal() as session:
            count = await seed_master_catalog(session)
            print(f"[DATABASE] Master catalog ready ({count} items available).")
            await seed_initial_admin(session)
    except Exception as e:
        print(f"[DATABASE SEED ERROR] {e}")

    yield


# ── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS — Allow Customer Web, Partner Web & Local Dev ───────────
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
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
