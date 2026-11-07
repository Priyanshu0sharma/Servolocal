from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User, OTPVerification
from app.core.security import create_access_token, get_current_user
from app.core.otp_service import generate_and_send_otp, verify_google_oauth_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ── Request / Response Schemas ──────────────────────────────────────────

class SendOTPRequest(BaseModel):
    email: EmailStr
    role: str = "customer"  # customer, seller, partner, admin


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
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
    Generates a 6-digit OTP, records it with 5-minute expiry,
    and sends a branded HTML verification email.
    """
    clean_email = req.email.strip().lower()
    clean_role = req.role.strip().lower()

    if clean_role not in ["customer", "seller", "partner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: 'customer', 'seller', 'partner', 'admin'"
        )

    await generate_and_send_otp(clean_email, clean_role, db)

    return {
        "success": True,
        "message": f"6-digit verification code sent to {clean_email}",
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
    Verifies 6-digit OTP. Creates new User if first time,
    and returns JWT access token + user profile.
    """
    clean_email = req.email.strip().lower()
    clean_otp = req.otp_code.strip()
    clean_role = req.role.strip().lower()

    now = datetime.now(timezone.utc)

    # Master dev bypass (123456) or database lookup
    is_valid = False
    otp_record: Optional[OTPVerification] = None

    if clean_otp == "123456":
        is_valid = True
    else:
        stmt = (
            select(OTPVerification)
            .where(
                OTPVerification.email == clean_email,
                OTPVerification.otp_code == clean_otp,
                OTPVerification.is_used == False,
                OTPVerification.expires_at >= now
            )
            .order_by(OTPVerification.created_at.desc())
        )
        result = await db.execute(stmt)
        otp_record = result.scalars().first()
        if otp_record:
            is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP verification code"
        )

    # Invalidate OTP if record was found
    if otp_record:
        otp_record.is_used = True
        await db.commit()

    # Fetch existing User or Create New User
    user_stmt = select(User).where(User.email == clean_email)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user:
        display_name = req.name.strip() if req.name else clean_email.split("@")[0].capitalize()
        user = User(
            email=clean_email,
            name=display_name,
            role=clean_role,
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
    google_payload = await verify_google_oauth_token(req.id_token)
    clean_email = google_payload["email"]
    clean_role = req.role.strip().lower()

    # Fetch or Create User
    user_stmt = select(User).where(User.email == clean_email)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user:
        user = User(
            email=clean_email,
            google_sub_id=google_payload.get("sub"),
            name=google_payload.get("name", "Google User"),
            role=clean_role,
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

