import ssl
import pytest
from app.core.config import settings
from app.db.database import get_ssl_context, _build_connect_args


def test_ssl_context_require_mode(monkeypatch):
    """Under 'require' mode, SSL certificate verification and hostname checking must be enforced."""
    monkeypatch.setattr(settings, "DB_SSL_MODE", "require")
    monkeypatch.setattr(settings, "DB_SSL_CA_PATH", None)

    ctx = get_ssl_context()
    assert ctx is not None
    assert ctx.check_hostname is True
    assert ctx.verify_mode == ssl.CERT_REQUIRED


def test_ssl_context_verify_full_mode(monkeypatch):
    """Under 'verify-full' mode, SSL certificate verification and hostname checking must be enforced."""
    monkeypatch.setattr(settings, "DB_SSL_MODE", "verify-full")
    monkeypatch.setattr(settings, "DB_SSL_CA_PATH", None)

    ctx = get_ssl_context()
    assert ctx is not None
    assert ctx.check_hostname is True
    assert ctx.verify_mode == ssl.CERT_REQUIRED


def test_ssl_context_verify_ca_mode(monkeypatch):
    """Under 'verify-ca' mode, certificate is verified against CA but hostname check is bypassed."""
    monkeypatch.setattr(settings, "DB_SSL_MODE", "verify-ca")
    monkeypatch.setattr(settings, "DB_SSL_CA_PATH", None)

    ctx = get_ssl_context()
    assert ctx is not None
    assert ctx.check_hostname is False
    assert ctx.verify_mode == ssl.CERT_REQUIRED


def test_ssl_context_disable_mode(monkeypatch):
    """Under 'disable' mode, SSL context is None."""
    monkeypatch.setattr(settings, "DB_SSL_MODE", "disable")

    ctx = get_ssl_context()
    assert ctx is None


def test_build_connect_args_sqlite():
    """SQLite database connections must never be passed asyncpg SSL arguments."""
    sqlite_url = "sqlite+aiosqlite:///:memory:"
    args = _build_connect_args(sqlite_url)
    assert args == {}


def test_build_connect_args_postgresql(monkeypatch):
    """PostgreSQL database connections receive the configured SSLContext."""
    monkeypatch.setattr(settings, "DB_SSL_MODE", "require")
    pg_url = "postgresql+asyncpg://user:pass@ep-cool.neon.tech/neondb"
    args = _build_connect_args(pg_url)
    assert "ssl" in args
    assert isinstance(args["ssl"], ssl.SSLContext)
    assert args["ssl"].check_hostname is True
    assert args["ssl"].verify_mode == ssl.CERT_REQUIRED

