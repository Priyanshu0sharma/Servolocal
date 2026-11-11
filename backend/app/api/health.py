from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import text
from app.core.config import settings
from app.db.session import AsyncSessionLocal

router = APIRouter()


@router.get("/health", tags=["Health"])
async def get_health_status():
    """Real service health endpoint returning operational status."""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "environment": settings.APP_ENV,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ready", tags=["Health"])
async def get_readiness_status():
    """Database readiness endpoint executing real SQL query."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "database": "disconnected",
            "error": str(e),
        }


