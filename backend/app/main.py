from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base, AsyncSessionLocal, check_db_connection
from app.db.seed_catalog import seed_master_catalog
from app.api.routes_auth import router as auth_router


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

    # 2. Seed Master Brand Catalog if table is empty
    try:
        async with AsyncSessionLocal() as session:
            count = await seed_master_catalog(session)
            print(f"[DATABASE] Master catalog ready ({count} items available).")
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
    allow_origins=settings.BACKEND_CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ──────────────────────────────────────────────
app.include_router(auth_router)


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
