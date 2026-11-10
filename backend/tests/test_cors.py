import pytest
from starlette.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    # Use standard TestClient without triggering live lifespan network calls
    return TestClient(app)


# ── 1. Exact Failing Customer Origin ───────────────────────────────────

def test_cors_exact_customer_preview_origin_allowed(client):
    """The reported failing customer preview origin must be granted CORS access with credentials."""
    origin = "https://customer-fo2kzwr8v-priyanshu0sharmas-projects.vercel.app"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization, content-type",
    }
    response = client.options("/api/auth/send-otp", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert "authorization" in response.headers.get("access-control-allow-headers", "").lower()
    assert "content-type" in response.headers.get("access-control-allow-headers", "").lower()


# ── 2. Stable Customer & Partner Production Domains ────────────────────

@pytest.mark.parametrize("origin", [
    "https://customer-web-alpha-eight.vercel.app",
    "https://customer-web.vercel.app",
    "https://servolocal.in",
    "https://www.servolocal.in",
])
def test_cors_stable_customer_production_origins(client, origin):
    """Stable production customer domains must receive valid CORS headers."""
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.parametrize("origin", [
    "https://partner-web-inky.vercel.app",
    "https://partner-web.vercel.app",
    "https://partner.servolocal.in",
])
def test_cors_stable_partner_production_origins(client, origin):
    """Stable production partner domains must receive valid CORS headers."""
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"


# ── 3. Permitted Preview Origins (Narrowly Scoped Regex) ───────────────

@pytest.mark.parametrize("origin", [
    "https://customer-web-git-main-priyanshu0sharmas-projects.vercel.app",
    "https://customer-preview-123.vercel.app",
    "https://customer-web-feat-auth.vercel.app",
    "https://partner-web-git-dev-priyanshu0sharmas-projects.vercel.app",
    "https://partner-web-preview-abc.vercel.app",
    "https://partner-preview-789.vercel.app",
])
def test_cors_permitted_preview_origins(client, origin):
    """Vercel preview deployments for customer-web and partner-web must match the anchored regex."""
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"


# ── 4. Rejected Unrelated Origins ──────────────────────────────────────

@pytest.mark.parametrize("untrusted_origin", [
    "https://evil-customer.vercel.app",
    "https://notcustomer.vercel.app",
    "https://otherapp.vercel.app",
    "https://portfolio-priyanshu0.vercel.app",
    "https://malicious-site.com",
    "https://customer-web.attacker.com",
    "https://customer-web.vercel.app.attacker.com",
    "http://customer-web-alpha-eight.vercel.app",  # Insecure HTTP must be rejected
    "http://customer-fo2kzwr8v-priyanshu0sharmas-projects.vercel.app",
])
def test_cors_untrusted_origins_rejected(client, untrusted_origin):
    """Unrelated, spoofed, or unencrypted origins must NOT receive allow-origin header."""
    headers = {
        "Origin": untrusted_origin,
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert "access-control-allow-origin" not in response.headers
    # Origin must never be granted
    assert response.headers.get("access-control-allow-origin") != untrusted_origin


# ── 5. Localhost Origins for Local Development ──────────────────────────

@pytest.mark.parametrize("local_origin", [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
])
def test_cors_local_development_origins(client, local_origin):
    """Local development ports for customer and partner frontends must be allowed."""
    headers = {
        "Origin": local_origin,
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == local_origin


# ── 6. Header and Method Preservation & Credentials Safety ─────────────

def test_cors_preserves_methods_and_headers(client):
    """Preflight must return all required methods and requested headers."""
    origin = "https://customer-web-alpha-eight.vercel.app"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "authorization, content-type, x-custom-header",
    }
    response = client.options("/api/orders", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"

    allow_methods = response.headers.get("access-control-allow-methods", "")
    for method in ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]:
        assert method in allow_methods

    allow_headers = response.headers.get("access-control-allow-headers", "").lower()
    assert "authorization" in allow_headers
    assert "content-type" in allow_headers


def test_cors_never_wildcard_with_credentials(client):
    """Access-Control-Allow-Origin must NEVER be wildcard '*' when credentials are true."""
    origin = "https://customer-fo2kzwr8v-priyanshu0sharmas-projects.vercel.app"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    # Must NOT be '*'
    assert response.headers.get("access-control-allow-origin") != "*"
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"
