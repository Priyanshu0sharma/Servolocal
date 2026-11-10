import pytest
import logging
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.exc import SQLAlchemyError
from starlette.testclient import TestClient

from app.core.config import settings
from app.main import app, lifespan


@pytest.fixture
def client():
    """Provides a TestClient for testing HTTP endpoints."""
    return TestClient(app)


def test_root_endpoint(client):
    """Verify root endpoint returns healthy status and endpoint map."""
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app"] == "ServoLocal High-Speed API"
    assert data["status"] == "running"
    assert "version" in data
    assert "endpoints" in data
    assert data["endpoints"]["auth"] == "/api/auth"
    assert data["endpoints"]["discovery"] == "/api/discovery"


def test_version_endpoint(client):
    """Verify version endpoint returns mobile update and app version metadata."""
    res = client.get("/api/version")
    assert res.status_code == 200
    data = res.json()
    assert "current_app_version" in data
    assert "latest_version" in data
    assert "min_required_version" in data
    assert "force_update" in data
    assert "update_url" in data


def test_health_check_endpoint(client):
    """Verify health check returns diagnostic status and key verification."""
    with patch("app.main.check_db_connection", AsyncMock(return_value=True)):
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert "status" in data
        assert "database" in data
        assert data["database"] == "connected"
        assert "env_keys" in data
        assert "all_keys_loaded" in data


@pytest.mark.asyncio
async def test_startup_logs_schema_warning_not_silent(caplog):
    """
    Startup must log schema compatibility warnings (SQLAlchemyError) rather than
    silently swallowing errors with 'except Exception: pass'.
    """
    mock_conn = AsyncMock()
    mock_conn.run_sync = AsyncMock()
    mock_conn.execute.side_effect = SQLAlchemyError("column already exists in table")

    mock_begin = MagicMock()
    mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_begin.__aexit__ = AsyncMock(return_value=None)

    mock_engine = MagicMock()
    mock_engine.begin.return_value = mock_begin

    with patch("app.main.engine", mock_engine), \
         patch.object(settings, "NODE_ENV", "development"), \
         patch.object(settings, "SEED_DEV_DATA", False):
        with caplog.at_level(logging.WARNING, logger="servolocal.startup"):
            async with lifespan(app):
                pass

    # Verify structured warning was recorded in logger
    assert any("Compatibility migration notice" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_startup_fails_in_production_on_db_error():
    """Startup in production must raise and halt if database initialization fails."""
    mock_begin = MagicMock()
    mock_begin.__aenter__ = AsyncMock(side_effect=ConnectionError("Cannot connect to Neon DB"))

    mock_engine = MagicMock()
    mock_engine.begin.return_value = mock_begin

    with patch("app.main.engine", mock_engine), \
         patch.object(settings, "NODE_ENV", "production"), \
         patch.object(settings, "DATABASE_URL", "postgresql://user:pass@ep-test.neon.tech/neondb"), \
         patch.object(settings, "JWT_SECRET", "super-secret-production-key-32chars"):
        with pytest.raises(ConnectionError):
            async with lifespan(app):
                pass
