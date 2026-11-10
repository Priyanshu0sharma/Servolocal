import pytest
from app.core.config import Settings


def test_sanitize_database_url_masks_password():
    """Verify passwords in connection strings are masked for logging/error reporting."""
    raw_url = "postgresql+asyncpg://neondb_owner:npg_secr3tP@ssw0rd!@ep-cool-fog-12345.us-east-2.aws.neon.tech/neondb?sslmode=require"
    sanitized = Settings.sanitize_database_url(raw_url)
    assert "npg_secr3tP@ssw0rd!" not in sanitized
    assert "postgresql+asyncpg://neondb_owner:***@ep-cool-fog-12345.us-east-2.aws.neon.tech/neondb?sslmode=require" == sanitized


def test_sanitize_database_url_empty_or_none():
    """Verify empty or None URLs return a safe placeholder."""
    assert Settings.sanitize_database_url("") == "[EMPTY_DATABASE_URL]"
    assert Settings.sanitize_database_url(None) == "[EMPTY_DATABASE_URL]"


def test_sanitize_database_url_no_password():
    """Verify URLs without user credentials remain well-formed."""
    url = "sqlite+aiosqlite:///:memory:"
    assert Settings.sanitize_database_url(url) == url


def test_is_production_property():
    """Verify production environment detection."""
    assert Settings(NODE_ENV="production").is_production is True
    assert Settings(NODE_ENV="prod").is_production is True
    assert Settings(NODE_ENV="Production").is_production is True
    assert Settings(NODE_ENV="PROD").is_production is True
    assert Settings(NODE_ENV="development").is_production is False
    assert Settings(NODE_ENV="staging").is_production is False
    assert Settings(NODE_ENV="test").is_production is False


def test_validate_production_config_success():
    """Valid production config with Postgres URL and strong JWT secret succeeds."""
    cfg = Settings(
        NODE_ENV="production",
        DATABASE_URL="postgresql://user:pass@ep-test.neon.tech/neondb?sslmode=require",
        JWT_SECRET="super-strong-production-secret-key-32chars"
    )
    # Should not raise
    cfg.validate_production_config()


def test_validate_production_config_missing_db():
    """Production mode raises ValueError if DATABASE_URL is missing or empty."""
    cfg = Settings(
        NODE_ENV="production",
        DATABASE_URL="",
        JWT_SECRET="super-strong-production-secret-key-32chars"
    )
    with pytest.raises(ValueError) as exc:
        cfg.validate_production_config()
    assert "DATABASE_URL" in str(exc.value)


def test_validate_production_config_invalid_db_scheme():
    """Production mode raises ValueError if DATABASE_URL is not PostgreSQL."""
    cfg = Settings(
        NODE_ENV="production",
        DATABASE_URL="mysql://user:pass@host/db",
        JWT_SECRET="super-strong-production-secret-key-32chars"
    )
    with pytest.raises(ValueError) as exc:
        cfg.validate_production_config()
    assert "must be a valid PostgreSQL connection string" in str(exc.value)


def test_validate_production_config_missing_or_short_jwt():
    """Production mode enforces minimum 16-character JWT secret length."""
    cfg = Settings(
        NODE_ENV="production",
        DATABASE_URL="postgresql://user:pass@ep-test.neon.tech/neondb",
        JWT_SECRET="short-secret"
    )
    with pytest.raises(ValueError) as exc:
        cfg.validate_production_config()
    assert "JWT_SECRET" in str(exc.value)


def test_validate_production_config_skipped_in_dev():
    """Development environment does not fail on missing production credentials."""
    cfg = Settings(
        NODE_ENV="development",
        DATABASE_URL="",
        JWT_SECRET=""
    )
    # Should pass without error in dev mode
    cfg.validate_production_config()


def test_cors_origins_list_merging():
    """Verify cors_origins_list merges defaults with custom comma-separated origins."""
    cfg = Settings(
        CORS_ALLOWED_ORIGINS="https://servolocal-preview-123.vercel.app, https://mobile.servolocal.in"
    )
    origins = cfg.cors_origins_list
    assert "http://localhost:3000" in origins
    assert "https://servolocal.in" in origins
    assert "https://partner.servolocal.in" in origins
    assert "https://customer-web-alpha-eight.vercel.app" in origins
    assert "https://servolocal-preview-123.vercel.app" in origins
    assert "https://mobile.servolocal.in" in origins
