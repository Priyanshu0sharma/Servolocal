import pytest
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, OTPVerification
from app.core.config import settings
from app.core.otp_service import (
    generate_otp_code,
    hash_otp,
    verify_otp_hash,
)
from app.core.security import create_access_token


# ── Test Database Fixtures (In-Memory Async SQLite) ─────────────────────

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_engine():
    """Creates an isolated async SQLite engine for auth test suite."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine):
    """Provides a transactional session connected to the in-memory SQLite db."""
    session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_maker() as session:
        yield session


@pytest.fixture
async def async_client(test_engine):
    """Provides an AsyncClient with FastAPI dependency override for get_db."""
    session_maker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.clear()


# ── 1. Cryptographic Hashing & Salting Tests ────────────────────────────

def test_otp_hashing_security():
    """Verify OTP hashing produces a 64-character HMAC-SHA256 hash salted by email."""
    email_a = "user1@example.com"
    email_b = "user2@example.com"
    otp = "123456"

    hash_a = hash_otp(email_a, otp)
    hash_b = hash_otp(email_b, otp)

    # Must be 64-character hex string (SHA256)
    assert len(hash_a) == 64
    assert len(hash_b) == 64
    # Different emails with same OTP must yield different hashes (email salt)
    assert hash_a != hash_b
    # Plaintext OTP must NOT appear in the stored hash
    assert otp not in hash_a

    # Verification function checks
    assert verify_otp_hash(email_a, "123456", hash_a) is True
    assert verify_otp_hash(email_a, "654321", hash_a) is False
    assert verify_otp_hash(email_b, "123456", hash_a) is False


def test_generate_otp_code():
    """Verify generated OTP is always a 6-digit numeric string."""
    for _ in range(50):
        code = generate_otp_code()
        assert len(code) == 6
        assert code.isdigit()
        assert 100000 <= int(code) <= 999999


# ── 2. POST /api/auth/send-otp Tests ────────────────────────────────────

@pytest.mark.asyncio
async def test_send_otp_customer_success(async_client, test_session):
    """Sending OTP for customer role succeeds, dispatches email, hashes OTP in DB, and never returns plaintext."""
    captured_code = None

    async def mock_send_email(email, role, code):
        nonlocal captured_code
        captured_code = code

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_send_email):
        res = await async_client.post(
            "/api/auth/send-otp",
            json={"email": "shopper@servolocal.in", "role": "customer"}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["email"] == "shopper@servolocal.in"
    assert data["role"] == "customer"
    # STRICT: Plaintext OTP or test_otp must NEVER be present in API response
    assert "otp" not in data
    assert "test_otp" not in data

    # Verify database record
    stmt = select(OTPVerification).where(OTPVerification.email == "shopper@servolocal.in")
    result = await test_session.execute(stmt)
    record = result.scalars().first()

    assert record is not None
    assert record.role == "customer"
    assert record.is_used is False
    assert record.attempts == 0
    assert len(record.otp_code) == 64
    assert record.otp_code != captured_code
    # Stored hash must match the captured code
    assert verify_otp_hash("shopper@servolocal.in", captured_code, record.otp_code) is True


@pytest.mark.asyncio
async def test_send_otp_seller_and_partner_roles(async_client):
    """Seller and Partner roles are allowed for public registration/login."""
    with patch("app.api.routes_auth.send_otp_email", AsyncMock()):
        res_seller = await async_client.post(
            "/api/auth/send-otp",
            json={"email": "dukaan@servolocal.in", "role": "seller"}
        )
        assert res_seller.status_code == 200

        res_partner = await async_client.post(
            "/api/auth/send-otp",
            json={"email": "rider@servolocal.in", "role": "partner"}
        )
        assert res_partner.status_code == 200


@pytest.mark.asyncio
async def test_send_otp_admin_rejected_for_unregistered_email(async_client, test_session):
    """Public registration cannot assign Admin role. Unregistered emails requesting admin role receive 403."""
    with patch("app.api.routes_auth.send_otp_email", AsyncMock()) as mock_smtp:
        res = await async_client.post(
            "/api/auth/send-otp",
            json={"email": "attacker@evil.com", "role": "admin"}
        )

    assert res.status_code == 403
    assert "Admin registration is restricted" in res.json()["detail"]
    mock_smtp.assert_not_called()

    # Verify no OTP was written to database
    stmt = select(OTPVerification).where(OTPVerification.email == "attacker@evil.com")
    record = (await test_session.execute(stmt)).scalars().first()
    assert record is None


@pytest.mark.asyncio
async def test_send_otp_admin_allowed_for_existing_admin(async_client, test_session):
    """Pre-configured admin in the database is allowed to request OTP."""
    admin_user = User(
        email="superadmin@servolocal.in",
        name="Super Admin",
        role="admin",
        is_active=True
    )
    test_session.add(admin_user)
    await test_session.commit()

    with patch("app.api.routes_auth.send_otp_email", AsyncMock()) as mock_smtp:
        res = await async_client.post(
            "/api/auth/send-otp",
            json={"email": "superadmin@servolocal.in", "role": "admin"}
        )

    assert res.status_code == 200
    mock_smtp.assert_called_once()


@pytest.mark.asyncio
async def test_send_otp_invalid_role_rejected(async_client):
    """Arbitrary roles (e.g. root, manager) are rejected with 400 Bad Request."""
    res = await async_client.post(
        "/api/auth/send-otp",
        json={"email": "test@servolocal.in", "role": "superuser"}
    )
    assert res.status_code == 400
    assert "Role must be one of" in res.json()["detail"]


@pytest.mark.asyncio
async def test_send_otp_resend_cooldown(async_client):
    """Sending OTP again within 60 seconds returns 429 Too Many Requests with Retry-After header."""
    with patch("app.api.routes_auth.send_otp_email", AsyncMock()):
        res1 = await async_client.post(
            "/api/auth/send-otp",
            json={"email": "cooldown@test.com", "role": "customer"}
        )
        assert res1.status_code == 200

        # Immediate second request
        res2 = await async_client.post(
            "/api/auth/send-otp",
            json={"email": "cooldown@test.com", "role": "customer"}
        )
        assert res2.status_code == 429
        assert "Retry-After" in res2.headers
        assert "Please wait" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_send_otp_hourly_rate_limit(async_client, test_session):
    """Emails exceeding 5 OTP requests in the past hour are rate-limited with HTTP 429."""
    email = "ratelimit@test.com"
    now = datetime.now(timezone.utc)

    # Insert 5 records timestamped 20, 25, 30, 35, 40 minutes ago (past cooldown, within hour)
    for i in range(5):
        rec = OTPVerification(
            email=email,
            otp_code=hash_otp(email, f"10000{i}"),
            role="customer",
            created_at=now - timedelta(minutes=40 - (i * 4)),
            expires_at=now + timedelta(minutes=5),
            is_used=True,
            attempts=0
        )
        test_session.add(rec)
    await test_session.commit()

    with patch("app.api.routes_auth.send_otp_email", AsyncMock()):
        res = await async_client.post(
            "/api/auth/send-otp",
            json={"email": email, "role": "customer"}
        )
    assert res.status_code == 429
    assert "Too many OTP requests for this email address" in res.json()["detail"]


@pytest.mark.asyncio
async def test_send_otp_smtp_failure_raises_503_and_saves_no_record(async_client, test_session):
    """When SMTP dispatch fails, return 503 and never save an unverified OTP record to database."""
    email = "smtpfail@test.com"

    async def mock_failed_send(*args, **kwargs):
        raise HTTPException(
            status_code=503,
            detail="Unable to dispatch verification email via SMTP. Please check server SMTP configuration."
        )

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_failed_send):
        res = await async_client.post(
            "/api/auth/send-otp",
            json={"email": email, "role": "customer"}
        )

    assert res.status_code == 503
    assert "Unable to dispatch verification email" in res.json()["detail"]

    # Verify database has NO record saved (atomic safety)
    stmt = select(OTPVerification).where(OTPVerification.email == email)
    record = (await test_session.execute(stmt)).scalars().first()
    assert record is None


# ── 3. POST /api/auth/verify-otp Tests ──────────────────────────────────

@pytest.mark.asyncio
async def test_verify_otp_new_customer_registration(async_client, test_session):
    """Verifying correct OTP auto-registers new customer, returns JWT token, and marks OTP used."""
    email = "newcustomer@servolocal.in"
    captured_code = None

    async def mock_send(e, r, code):
        nonlocal captured_code
        captured_code = code

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_send):
        send_res = await async_client.post(
            "/api/auth/send-otp",
            json={"email": email, "role": "customer"}
        )
        assert send_res.status_code == 200

    # Verify with correct code
    verify_res = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": captured_code, "role": "customer", "name": "Rahul Sharma"}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email
    assert data["user"]["name"] == "Rahul Sharma"
    assert data["user"]["role"] == "customer"
    assert data["user"]["is_active"] is True

    # Check user in DB
    user = (await test_session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    assert user is not None
    assert user.name == "Rahul Sharma"
    assert user.role == "customer"

    # Check OTP record is marked is_used
    otp_rec = (await test_session.execute(select(OTPVerification).where(OTPVerification.email == email))).scalars().first()
    assert otp_rec.is_used is True


@pytest.mark.asyncio
async def test_verify_otp_existing_user_preserves_data(async_client, test_session):
    """Verifying OTP for an existing user logs them in while preserving existing wallet, role, and name."""
    email = "existing@servolocal.in"
    existing_user = User(
        email=email,
        name="Sunita Devi",
        role="seller",
        wallet_balance=1500.0,
        servo_coins=120,
        is_active=True
    )
    test_session.add(existing_user)
    await test_session.commit()

    captured_code = None

    async def mock_send(e, r, code):
        nonlocal captured_code
        captured_code = code

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_send):
        await async_client.post("/api/auth/send-otp", json={"email": email, "role": "seller"})

    verify_res = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": captured_code, "role": "seller"}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["user"]["email"] == email
    assert data["user"]["name"] == "Sunita Devi"
    assert data["user"]["role"] == "seller"
    assert data["user"]["servo_coins"] == 120


@pytest.mark.asyncio
async def test_verify_otp_expired_code(async_client, test_session):
    """An expired OTP code is rejected with 400 Bad Request."""
    email = "expired@test.com"
    now = datetime.now(timezone.utc)
    expired_record = OTPVerification(
        email=email,
        otp_code=hash_otp(email, "654321"),
        role="customer",
        created_at=now - timedelta(minutes=10),
        expires_at=now - timedelta(minutes=5),  # expired 5 min ago
        is_used=False,
        attempts=0
    )
    test_session.add(expired_record)
    await test_session.commit()

    res = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": "654321", "role": "customer"}
    )
    assert res.status_code == 400
    assert "Invalid or expired OTP code" in res.json()["detail"]


@pytest.mark.asyncio
async def test_verify_otp_incorrect_code_increments_attempts(async_client, test_session):
    """Submitting an incorrect OTP code increments attempts counter and returns remaining attempts."""
    email = "wrongcode@test.com"
    captured_code = None

    async def mock_send(e, r, code):
        nonlocal captured_code
        captured_code = code

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_send):
        await async_client.post("/api/auth/send-otp", json={"email": email, "role": "customer"})

    # Send wrong code
    res = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": "000000", "role": "customer"}
    )
    assert res.status_code == 400
    assert "Incorrect OTP code. 4 attempts remaining." in res.json()["detail"]

    # Check database attempt count
    otp_rec = (await test_session.execute(select(OTPVerification).where(OTPVerification.email == email))).scalars().first()
    assert otp_rec.attempts == 1


@pytest.mark.asyncio
async def test_verify_otp_max_attempts_locks_otp(async_client, test_session):
    """Submitting 5 wrong attempts invalidates the OTP and prevents subsequent verification even with valid code."""
    email = "bruteforce@test.com"
    captured_code = None

    async def mock_send(e, r, code):
        nonlocal captured_code
        captured_code = code

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_send):
        await async_client.post("/api/auth/send-otp", json={"email": email, "role": "customer"})

    # Submit 4 wrong attempts
    for _ in range(4):
        res = await async_client.post(
            "/api/auth/verify-otp",
            json={"email": email, "otp_code": "111111", "role": "customer"}
        )
        assert res.status_code == 400

    # 5th wrong attempt triggers maximum exceeded lock
    res5 = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": "111111", "role": "customer"}
    )
    assert res5.status_code == 400
    assert "Maximum verification attempts exceeded" in res5.json()["detail"]

    # Verify the record is invalidated
    otp_rec = (await test_session.execute(select(OTPVerification).where(OTPVerification.email == email))).scalars().first()
    assert otp_rec.is_used is True

    # Subsequent verification with the REAL code must now be rejected
    res_correct = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": captured_code, "role": "customer"}
    )
    assert res_correct.status_code == 400
    assert "Invalid or expired OTP code" in res_correct.json()["detail"]


@pytest.mark.asyncio
async def test_verify_otp_already_used_rejected(async_client):
    """An OTP that has already been verified cannot be reused."""
    email = "reuse@test.com"
    captured_code = None

    async def mock_send(e, r, code):
        nonlocal captured_code
        captured_code = code

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_send):
        await async_client.post("/api/auth/send-otp", json={"email": email, "role": "customer"})

    # 1st verification succeeds
    res1 = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": captured_code, "role": "customer"}
    )
    assert res1.status_code == 200

    # 2nd verification fails
    res2 = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": captured_code, "role": "customer"}
    )
    assert res2.status_code == 400
    assert "Invalid or expired OTP code" in res2.json()["detail"]


# ── 4. JWT Authentication & Protected Endpoints ─────────────────────────

@pytest.mark.asyncio
async def test_protected_me_endpoint_lifecycle(async_client, test_session):
    """Test full cycle: OTP verification -> valid JWT -> GET /api/auth/me succeeds."""
    email = "lifecycle@servolocal.in"
    captured_code = None

    async def mock_send(e, r, code):
        nonlocal captured_code
        captured_code = code

    with patch("app.api.routes_auth.send_otp_email", side_effect=mock_send):
        await async_client.post("/api/auth/send-otp", json={"email": email, "role": "customer"})

    verify_res = await async_client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp_code": captured_code, "role": "customer", "name": "Priyanshu"}
    )
    token = verify_res.json()["access_token"]

    # 1. Call /api/auth/me with valid Bearer token
    me_res = await async_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == email
    assert me_data["user"]["name"] == "Priyanshu"

    # 2. Call /api/auth/me with invalid token
    bad_res = await async_client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.fake.token"}
    )
    assert bad_res.status_code == 401

    # 3. Call /api/auth/me with no token
    no_token_res = await async_client.get("/api/auth/me")
    assert no_token_res.status_code == 401

