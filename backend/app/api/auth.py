import hashlib
import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.email_service import send_otp_email
from app.db.models import User, UserOTP
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SendOtpRequest(BaseModel):
    email: EmailStr
    role: str = "customer"


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp_code: str
    role: str = "customer"


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None


def hash_otp(otp_code: str) -> str:
    """Computes a SHA-256 hash of the OTP code for secure database storage."""
    salt = settings.JWT_SECRET or "servolocal_otp_salt"
    return hashlib.sha256(f"{salt}_{otp_code.strip()}".encode()).hexdigest()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": int(time.time()) + 86400 * 7})  # 7 days session
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")


@router.post("/send-otp")
async def send_otp(payload: SendOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Sends a real cryptographically random 6-digit OTP to the customer's email inbox.
    Enforces a 60-second cooldown between requests and 5-minute expiration.
    Truthfully reports delivery failures without simulating or faking success.
    """
    email_clean = payload.email.lower().strip()
    clean_role = payload.role.lower().strip() if payload.role else "customer"
    now = datetime.now(timezone.utc)

    # Security check for Admin access: Only authorized pre-configured admin emails allowed
    if clean_role == "admin":
        admin_check = await db.execute(
            select(User).where(User.email.ilike(email_clean), User.role == "admin")
        )
        if not admin_check.scalar_one_or_none() and email_clean != "priyanshusharma1131@gmail.com":
            raise HTTPException(
                status_code=403,
                detail="Access Denied: This email address does not have administrator privileges.",
            )

    # 1. Check for existing active OTP to enforce 60-second resend cooldown
    stmt = (
        select(UserOTP)
        .where(
            UserOTP.email == email_clean,
            UserOTP.is_used == False,
            UserOTP.expires_at > now,
        )
        .order_by(UserOTP.created_at.desc())
        .limit(1)
    )
    res = await db.execute(stmt)
    latest_otp = res.scalar_one_or_none()

    if latest_otp and latest_otp.resend_available_at > now:
        wait_seconds = int((latest_otp.resend_available_at - now).total_seconds())
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {wait_seconds} seconds before requesting another verification code.",
        )

    # 2. Generate a fresh, unpredictable 6-digit numerical code (100000 to 999999)
    raw_otp_code = f"{secrets.randbelow(900000) + 100000}"
    otp_hash_val = hash_otp(raw_otp_code)

    # 3. Create persistent DB record with 5-minute expiry & 60-second cooldown
    new_otp_record = UserOTP(
        email=email_clean,
        otp_hash=otp_hash_val,
        attempts=0,
        is_used=False,
        resend_available_at=now + timedelta(seconds=60),
        expires_at=now + timedelta(minutes=5),
        created_at=now,
    )
    db.add(new_otp_record)
    await db.commit()
    await db.refresh(new_otp_record)

    # 4. Deliver through real configured email provider with role-tailored template
    success, message = send_otp_email(email_clean, raw_otp_code, role=clean_role)

    if not success:
        # Invalidate OTP record if email could not be delivered
        await db.delete(new_otp_record)
        await db.commit()
        raise HTTPException(
            status_code=503,
            detail=f"Unable to send verification email. {message}",
        )

    return {
        "success": True,
        "message": f"Verification code sent to {email_clean}. Please check your inbox.",
        "email": email_clean,
        "expires_in_seconds": 300,
        "resend_in_seconds": 60,
    }


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Verifies 6-digit customer OTP against hashed database record.
    Enforces maximum 5 attempts, rejects expired or already-used codes,
    and establishes an authenticated customer session with a signed JWT.
    """
    email_clean = payload.email.lower().strip()
    provided_code = payload.otp_code.strip()
    now = datetime.now(timezone.utc)

    if not provided_code or len(provided_code) != 6 or not provided_code.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid 6-digit numerical verification code.",
        )

    # 1. Fetch the latest active OTP for this email
    stmt = (
        select(UserOTP)
        .where(
            UserOTP.email == email_clean,
            UserOTP.is_used == False,
        )
        .order_by(UserOTP.created_at.desc())
        .limit(1)
    )
    res = await db.execute(stmt)
    otp_record = res.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="No active verification code found for this email. Please request a new code.",
        )

    # 2. Check Expiration
    if otp_record.expires_at < now:
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new code.",
        )

    # 3. Check Attempt Limits (Max 5 attempts allowed)
    if otp_record.attempts >= 5:
        otp_record.is_used = True
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    # 4. Validate OTP Hash
    expected_hash = hash_otp(provided_code)
    if otp_record.otp_hash != expected_hash:
        otp_record.attempts += 1
        await db.commit()
        remaining = 5 - otp_record.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
        )

    # 5. Mark OTP as used to prevent replay attacks
    otp_record.is_used = True
    await db.commit()

    # 6. Fetch or Create User in PostgreSQL
    user_stmt = select(User).where(User.email.ilike(email_clean))
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()

    clean_role = payload.role.lower().strip() if payload.role else "customer"

    if not user:
        if clean_role == "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin user does not exist. Admin accounts must be pre-configured.",
            )
        raw_name = email_clean.split("@")[0]
        formatted_name = raw_name.replace(".", " ").replace("_", " ").title()
        assigned_role = clean_role if clean_role in ("customer", "seller", "partner", "rider", "delivery") else "customer"
        user = User(
            email=email_clean,
            name=formatted_name,
            role=assigned_role,
            servo_coins=100 if assigned_role == "customer" else 0,
            wallet_balance=0.0,
            is_active=True,
            terms_accepted=True,
            location_permission_granted=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 7. Generate Authenticated Customer JWT Session Token
    access_token = create_access_token({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    })

    return {
        "success": True,
        "message": "Customer login successful!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "servo_coins": user.servo_coins,
            "wallet_balance": user.wallet_balance,
            "upi_id": user.upi_id,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "is_verified": True,
        },
    }


@router.get("/me")
async def get_current_user_profile(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the authenticated customer profile for the active session.
    Rejects requests without a valid Bearer token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in.",
        )

    token = authorization.split(" ")[1]
    token_data = decode_token(token)

    stmt = select(User).where(User.id == token_data.get("id"))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive or not found.")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "servo_coins": user.servo_coins,
        "wallet_balance": user.wallet_balance,
        "upi_id": user.upi_id,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "is_verified": True,
    }


@router.put("/profile")
async def update_user_profile(
    payload: UpdateProfileRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates the authenticated customer's Name and personal profile details.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in.",
        )

    token = authorization.split(" ")[1]
    token_data = decode_token(token)

    stmt = select(User).where(User.id == token_data.get("id"))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User account not found.")

    if payload.name and payload.name.strip():
        user.name = payload.name.strip()

    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "message": "Profile updated successfully!",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "servo_coins": user.servo_coins,
            "wallet_balance": user.wallet_balance,
            "upi_id": user.upi_id,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "is_verified": True,
        },
    }
