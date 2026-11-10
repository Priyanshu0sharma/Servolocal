from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.db.models import User, OTPVerification
from app.core.security import create_access_token, get_current_user
from app.core.otp_service import (
    generate_otp_code,
    hash_otp,
    verify_otp_hash,
    send_otp_email,
    verify_google_oauth_token,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Configuration constants for OTP security
OTP_EXPIRY_MINUTES = 5
RESEND_COOLDOWN_SECONDS = 60
MAX_HOURLY_REQUESTS = 5
MAX_VERIFICATION_ATTEMPTS = 5


# ── Request / Response Schemas ──────────────────────────────────────────

class SendOTPRequest(BaseModel):
    email: EmailStr
    role: str = "customer"  # customer, seller, partner, admin


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    role: str = "customer"
    name: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    id_token: str
    role: str = "customer"


def _format_user_response(user: User) -> Dict[str, Any]:
    """Helper to return consistent sanitized user dict."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "servo_coins": user.servo_coins,
        "wallet_balance": user.wallet_balance,
        "dues_limit": user.dues_limit,
        "upi_id": user.upi_id,
        "terms_accepted": getattr(user, "terms_accepted", True),
        "location_permission_granted": getattr(user, "location_permission_granted", False),
        "is_active": user.is_active,
    }


# ── 1. POST /api/auth/send-otp ──────────────────────────────────────────

@router.post("/send-otp", status_code=status.HTTP_200_OK)
async def send_otp_endpoint(
    req: SendOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    1. Validates allowed roles (blocks public admin registration).
    2. Enforces a 60-second resend cooldown per email.
    3. Enforces a maximum of 5 OTP requests per hour per email.
    4. Generates a 6-digit numeric OTP.
    5. Dispatches real email via Gmail SMTP.
    6. Stores OTP as a salted HMAC-SHA256 hash (never plaintext).
    7. Never returns OTP in response or production logs.
    """
    clean_email = req.email.strip().lower()
    clean_role = req.role.strip().lower()

    # Rule: Public registration must never allow users to assign themselves the Admin role
    if clean_role == "admin":
        user_stmt = select(User).where(User.email == clean_email)
        existing_user = (await db.execute(user_stmt)).scalar_one_or_none()
        if not existing_user or existing_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin registration is restricted. Only pre-configured administrators may sign in."
            )
    elif clean_role not in ["customer", "seller", "partner"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: 'customer', 'seller', 'partner'"
        )

    now = datetime.now(timezone.utc)

    # 1. Check Resend Cooldown (60 seconds)
    recent_stmt = (
        select(OTPVerification)
        .where(OTPVerification.email == clean_email)
        .order_by(OTPVerification.created_at.desc())
    )
    recent_otp = (await db.execute(recent_stmt)).scalars().first()
    if recent_otp and recent_otp.created_at:
        # Handle naive vs aware datetime from SQLite/Postgres
        created_at = recent_otp.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        elapsed = (now - created_at).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            retry_after = max(1, int(RESEND_COOLDOWN_SECONDS - elapsed))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {retry_after} seconds before requesting a new OTP code.",
                headers={"Retry-After": str(retry_after)}
            )

    # 2. Check Hourly Rate Limit (5 requests per hour)
    one_hour_ago = now - timedelta(hours=1)
    hourly_stmt = (
        select(func.count(OTPVerification.id))
        .where(
            OTPVerification.email == clean_email,
            OTPVerification.created_at >= one_hour_ago
        )
    )
    hourly_count = (await db.execute(hourly_stmt)).scalar() or 0
    if hourly_count >= MAX_HOURLY_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests for this email address. Please try again in 1 hour."
        )

    # 3. Generate cryptographic 6-digit OTP
    otp_code = generate_otp_code()
    otp_hash = hash_otp(clean_email, otp_code)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # 4. Dispatch Email via SMTP first — never bypass if SMTP fails!
    await send_otp_email(clean_email, clean_role, otp_code)

    # 5. Persist hashed OTP record in database with zero attempts
    otp_record = OTPVerification(
        email=clean_email,
        otp_code=otp_hash,
        role=clean_role,
        expires_at=expires_at,
        is_used=False,
        attempts=0
    )
    db.add(otp_record)
    await db.commit()

    return {
        "success": True,
        "message": f"A 6-digit verification code has been sent to {clean_email}.",
        "email": clean_email,
        "role": clean_role
    }


# ── 2. POST /api/auth/verify-otp ────────────────────────────────────────

@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_otp_endpoint(
    req: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies 6-digit OTP hash against database:
    1. Checks expiration.
    2. Enforces maximum 5 failed attempts per OTP.
    3. Validates hash in constant time.
    4. Auto-creates new user if first-time (blocking self-assigned Admin role).
    5. Returns signed JWT access token and user profile.
    """
    clean_email = req.email.strip().lower()
    clean_otp = req.otp_code.strip()
    clean_role = req.role.strip().lower()

    if not clean_otp.isdigit() or len(clean_otp) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP must be exactly 6 digits."
        )

    now = datetime.now(timezone.utc)

    # Database lookup for active unexpired, unused OTP record
    stmt = (
        select(OTPVerification)
        .where(
            OTPVerification.email == clean_email,
            OTPVerification.is_used == False,
            OTPVerification.expires_at >= now
        )
        .order_by(OTPVerification.created_at.desc())
    )
    result = await db.execute(stmt)
    otp_record = result.scalars().first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please request a new code."
        )

    # Check attempt limit
    if otp_record.attempts >= MAX_VERIFICATION_ATTEMPTS:
        otp_record.is_used = True
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum verification attempts exceeded. This OTP has been invalidated. Please request a new code."
        )

    # Validate HMAC-SHA256 hash in constant time
    if not verify_otp_hash(clean_email, clean_otp, otp_record.otp_code):
        otp_record.attempts += 1
        await db.commit()
        remaining = MAX_VERIFICATION_ATTEMPTS - otp_record.attempts
        if remaining <= 0:
            otp_record.is_used = True
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect OTP code. Maximum verification attempts exceeded. Please request a new code."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect OTP code. {remaining} attempt{'s' if remaining > 1 else ''} remaining."
        )

    # Mark OTP as used once verified
    otp_record.is_used = True
    await db.commit()

    # Fetch existing User or Create New User
    user_stmt = select(User).where(User.email == clean_email)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user:
        # Prevent new public registration from creating an admin user
        if clean_role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account creation is restricted."
            )
        display_name = req.name.strip() if req.name else clean_email.split("@")[0].capitalize()
        user = User(
            email=clean_email,
            name=display_name,
            role=clean_role if clean_role in ["customer", "seller", "partner"] else "customer",
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Generate JWT Token (30 Days default)
    token = create_access_token({
        "sub": user.email,
        "id": user.id,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _format_user_response(user)
    }


# ── 3. POST /api/auth/google ────────────────────────────────────────────

@router.post("/google", status_code=status.HTTP_200_OK)
async def google_auth_endpoint(
    req: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies Google ID token, logs in or auto-registers user,
    and returns JWT access token + profile.
    """
    if not req.id_token or len(req.id_token) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google credentials. Please use 6-digit Email OTP to sign in."
        )

    try:
        google_payload = await verify_google_oauth_token(req.id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token verification failed. Please sign in using your Email OTP."
        )
    clean_email = google_payload["email"]
    clean_role = req.role.strip().lower()

    # Prevent public registration from assigning admin role
    if clean_role == "admin":
        user_check = (await db.execute(select(User).where(User.email == clean_email))).scalar_one_or_none()
        if not user_check or user_check.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account creation via Google OAuth is restricted."
            )

    # Fetch or Create User
    user_stmt = select(User).where(User.email == clean_email)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user:
        user = User(
            email=clean_email,
            google_sub_id=google_payload.get("sub"),
            name=google_payload.get("name", "Google User"),
            role=clean_role if clean_role in ["customer", "seller", "partner"] else "customer",
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Link google_sub_id if not already set
        if not user.google_sub_id and google_payload.get("sub"):
            user.google_sub_id = google_payload.get("sub")
            await db.commit()

    # Generate JWT Token
    token = create_access_token({
        "sub": user.email,
        "id": user.id,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _format_user_response(user)
    }


# ── 4. GET /api/auth/me (Current Authenticated User) ────────────────────

@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me_endpoint(
    current_user: User = Depends(get_current_user)
):
    """Returns the profile of currently authenticated user."""
    return {
        "user": _format_user_response(current_user)
    }


# ── 5. POST /api/auth/update-permission ─────────────────────────────────

class UpdatePermissionsRequest(BaseModel):
    location_permission_granted: Optional[bool] = None
    terms_accepted: Optional[bool] = None


@router.post("/update-permission", status_code=status.HTTP_200_OK)
async def update_user_permissions(
    req: UpdatePermissionsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates user location permission status and terms acceptance."""
    if req.location_permission_granted is not None:
        current_user.location_permission_granted = req.location_permission_granted
    if req.terms_accepted is not None:
        current_user.terms_accepted = req.terms_accepted

    await db.commit()
    await db.refresh(current_user)

    return {
        "success": True,
        "message": "User permissions and compliance status updated",
        "user": _format_user_response(current_user)
    }
