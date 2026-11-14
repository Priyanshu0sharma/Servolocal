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


@router.get("/health/smtp-check", tags=["Health"])
async def check_smtp():
    """Diagnostic check to verify SMTP port availability and credentials in the active cloud environment."""
    import socket, os
    smtp_host = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = bool(os.getenv("SMTP_PASSWORD"))
    resend_key = bool(os.getenv("RESEND_API_KEY"))

    conn_result = {}
    for p in [587, 465]:
        # Test default
        try:
            s = socket.create_connection((smtp_host, p), timeout=3)
            s.close()
            conn_result[f"{p}_default"] = "OPEN"
        except Exception as e:
            conn_result[f"{p}_default"] = f"BLOCKED: {e}"

        # Test IPv4 forced
        try:
            # Resolve IPv4
            addrinfo = socket.getaddrinfo(smtp_host, p, socket.AF_INET, socket.SOCK_STREAM)
            if addrinfo:
                ip, port = addrinfo[0][4][:2]
                s2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s2.settimeout(3)
                s2.connect((ip, port))
                s2.close()
                conn_result[f"{p}_ipv4_{ip}"] = "OPEN"
        except Exception as e:
            conn_result[f"{p}_ipv4"] = f"BLOCKED: {e}"

    return {
        "smtp_host": smtp_host,
        "smtp_user": smtp_user[:3] + "***" if smtp_user else None,
        "smtp_pass_configured": smtp_pass,
        "resend_key_configured": resend_key,
        "ports": conn_result,
    }


