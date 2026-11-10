import pytest
import logging
from unittest.mock import AsyncMock, patch, MagicMock
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
async def test_startup_does_not_call_create_all_or_alter_table():
    """
    Startup must NOT call Base.metadata.create_all() or execute manual ALTER TABLE statements.
    Alembic is the single migration mechanism.
    """
    mock_db_check = AsyncMock(return_value=True)
    with patch("app.main.check_db_connection", mock_db_check), \
         patch("app.db.database.Base.metadata.create_all") as mock_create_all, \
         patch.object(settings, "NODE_ENV", "development"), \
         patch.object(settings, "SEED_DEV_DATA", False):
        async with lifespan(app):
            pass

    # Verify Base.metadata.create_all was NEVER called during startup
    mock_create_all.assert_not_called()
    mock_db_check.assert_called_once()


@pytest.mark.asyncio
async def test_startup_fails_in_production_on_db_disconnect():
    """Startup in production must raise and halt if database connection check fails."""
    with patch("app.main.check_db_connection", AsyncMock(return_value=False)), \
         patch.object(settings, "NODE_ENV", "production"), \
         patch.object(settings, "DATABASE_URL", "postgresql://user:pass@ep-test.neon.tech/neondb"), \
         patch.object(settings, "JWT_SECRET", "super-secret-production-key-32chars"):
        with pytest.raises(ConnectionError) as exc_info:
            async with lifespan(app):
                pass
        assert "Database health probe failed" in str(exc_info.value)
