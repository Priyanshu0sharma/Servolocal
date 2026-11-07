import ssl
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine,
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# ── SSL context for Neon PostgreSQL ──────────────────────────────
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# ── Async Engine (PgBouncer connection pooling on Neon) ──────────
engine: AsyncEngine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args={"ssl": ssl_context},
)

# ── Session Factory ──────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# ── Declarative Base for Models ──────────────────────────────────
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Creates all tables on startup (development convenience)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def check_db_connection() -> bool:
    """Quick health probe — runs SELECT 1 against Neon."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
            return result.scalar() == 1
    except Exception:
        return False

