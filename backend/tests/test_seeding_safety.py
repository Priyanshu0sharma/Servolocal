import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.core.config import settings
from app.main import lifespan, app


@pytest.fixture
def mock_db_engine():
    """Provides a mocked engine and connection for lifespan tests."""
    mock_conn = AsyncMock()
    mock_conn.run_sync = AsyncMock()
    mock_conn.execute = AsyncMock()

    mock_begin = MagicMock()
    mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_begin.__aexit__ = AsyncMock(return_value=None)

    mock_engine = MagicMock()
    mock_engine.begin.return_value = mock_begin
    return mock_engine


@pytest.mark.asyncio
async def test_seeding_safety_in_production(monkeypatch, mock_db_engine):
    """In production mode, demo shops and development admin accounts must NEVER be seeded."""
    monkeypatch.setattr(settings, "NODE_ENV", "production")
    monkeypatch.setattr(settings, "DATABASE_URL", "postgresql://user:pass@ep-test.neon.tech/neondb")
    monkeypatch.setattr(settings, "JWT_SECRET", "super-secret-production-key-32chars")
    monkeypatch.setattr(settings, "AUTO_SEED_CATALOG", False)

    mock_seed_admin = AsyncMock()
    mock_seed_shops = AsyncMock()
    mock_seed_catalog = AsyncMock(return_value=100)

    with patch("app.main.engine", mock_db_engine), \
         patch("app.main.seed_initial_admin", mock_seed_admin), \
         patch("app.db.seed_catalog.seed_initial_shops_and_inventory", mock_seed_shops), \
         patch("app.main.seed_master_catalog", mock_seed_catalog):
        async with lifespan(app):
            pass

    # Ensure dev seeds were NEVER invoked in production
    mock_seed_admin.assert_not_called()
    mock_seed_shops.assert_not_called()
    mock_seed_catalog.assert_not_called()


@pytest.mark.asyncio
async def test_seeding_in_dev_default_disabled(monkeypatch, mock_db_engine):
    """In development mode with SEED_DEV_DATA=False (default), demo shops must NOT be seeded automatically."""
    monkeypatch.setattr(settings, "NODE_ENV", "development")
    monkeypatch.setattr(settings, "SEED_DEV_DATA", False)

    mock_seed_admin = AsyncMock()
    mock_seed_shops = AsyncMock()
    mock_seed_catalog = AsyncMock(return_value=100)

    with patch("app.main.engine", mock_db_engine), \
         patch("app.main.seed_initial_admin", mock_seed_admin), \
         patch("app.db.seed_catalog.seed_initial_shops_and_inventory", mock_seed_shops), \
         patch("app.main.seed_master_catalog", mock_seed_catalog):
        async with lifespan(app):
            pass

    mock_seed_admin.assert_not_called()
    mock_seed_shops.assert_not_called()


@pytest.mark.asyncio
async def test_seeding_in_dev_explicit_enabled(monkeypatch, mock_db_engine):
    """In development mode when SEED_DEV_DATA=True, dev seeding is executed."""
    monkeypatch.setattr(settings, "NODE_ENV", "development")
    monkeypatch.setattr(settings, "SEED_DEV_DATA", True)

    mock_seed_admin = AsyncMock()
    mock_seed_shops = AsyncMock()
    mock_seed_catalog = AsyncMock(return_value=100)

    mock_session = AsyncMock()
    mock_session_maker = MagicMock()
    mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_maker.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch("app.main.engine", mock_db_engine), \
         patch("app.main.AsyncSessionLocal", mock_session_maker), \
         patch("app.main.seed_initial_admin", mock_seed_admin), \
         patch("app.db.seed_catalog.seed_initial_shops_and_inventory", mock_seed_shops), \
         patch("app.main.seed_master_catalog", mock_seed_catalog):
        async with lifespan(app):
            pass

    mock_seed_catalog.assert_called_once()
    mock_seed_admin.assert_called_once()
    mock_seed_shops.assert_called_once()
