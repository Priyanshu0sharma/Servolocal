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

import ssl
import logging
from typing import AsyncGenerator, Optional, Dict, Any
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine,
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger("servolocal.database")


def get_ssl_context() -> Optional[ssl.SSLContext]:
    """
    Constructs a secure SSLContext for PostgreSQL (Neon) connections.
    Enforces strict certificate validation and hostname checking by default.
    """
    mode = (getattr(settings, "DB_SSL_MODE", "require") or "require").lower().strip()

    if mode in ("disable", "none", "false", "0"):
        return None

    # Secure default: full verification against system CA trust store
    ctx = ssl.create_default_context()
    ca_path = getattr(settings, "DB_SSL_CA_PATH", None)
    if ca_path:
        ctx.load_verify_locations(cafile=ca_path)

    if mode == "verify-ca":
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_REQUIRED
    else:
        # 'require' or 'verify-full' for Neon PostgreSQL
        ctx.check_hostname = True
        ctx.verify_mode = ssl.CERT_REQUIRED

    return ctx


def _build_connect_args(url: str) -> Dict[str, Any]:
    """Builds appropriate connection arguments based on database dialect."""
    if not url or "sqlite" in url:
        return {}
    ssl_ctx = get_ssl_context()
    if ssl_ctx is not None:
        return {"ssl": ssl_ctx}
    return {}


# ── Active SSL context for backward compatibility ────────────────
ssl_context = get_ssl_context()

# ── Async Engine (PgBouncer connection pooling on Neon) ──────────
engine: AsyncEngine = create_async_engine(
    settings.async_database_url if settings.async_database_url else "sqlite+aiosqlite:///:memory:",
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=_build_connect_args(settings.async_database_url),
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
    """
    Deprecated: Database schema migrations are strictly managed through Alembic.
    Use 'alembic upgrade head' from the backend directory to apply migrations.
    """
    logger.warning(
        "init_db() is deprecated and no longer creates schema tables directly. "
        "Use 'alembic upgrade head' to apply migrations."
    )


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

