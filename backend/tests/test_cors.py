import pytest
from starlette.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    # Use standard TestClient without triggering live lifespan network calls
    return TestClient(app)


def test_cors_trusted_origin_servolocal(client):
    """Preflight OPTIONS from https://servolocal.in must be granted CORS headers."""
    headers = {
        "Origin": "https://servolocal.in",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://servolocal.in"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_trusted_origin_partner(client):
    """Preflight OPTIONS from https://partner.servolocal.in must be granted CORS headers."""
    headers = {
        "Origin": "https://partner.servolocal.in",
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://partner.servolocal.in"


def test_cors_trusted_origin_vercel_customer(client):
    """Preflight OPTIONS from production Vercel frontend must be granted CORS headers."""
    headers = {
        "Origin": "https://customer-web-alpha-eight.vercel.app",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://customer-web-alpha-eight.vercel.app"


def test_cors_trusted_origin_localhost(client):
    """Preflight OPTIONS from local development server (localhost:3000) must be granted CORS headers."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_untrusted_origin_rejected(client):
    """Untrusted / unauthorized origin must NOT receive access-control-allow-origin header."""
    headers = {
        "Origin": "https://malicious-phishing-site.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    # CORSMiddleware does not return allow-origin header for disallowed origins
    assert "access-control-allow-origin" not in response.headers
