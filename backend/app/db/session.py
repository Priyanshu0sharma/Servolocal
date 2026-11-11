import os
import urllib.parse
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from app.core.config import settings

raw_db_url = settings.DATABASE_URL or os.getenv("DATABASE_URL", "")

if raw_db_url:
    parsed = urllib.parse.urlparse(raw_db_url)
    clean_url = urllib.parse.urlunparse(
        ("postgresql+asyncpg", parsed.netloc, parsed.path, "", "", "")
    )
    connect_args = {"ssl": True}
else:
    # Safe fallback if DATABASE_URL is not set
    clean_url = "sqlite+aiosqlite:///:memory:"
    connect_args = {}

engine = create_async_engine(
    clean_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session and guarantees cleanup."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

