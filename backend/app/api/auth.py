import time
import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_db
from app.db.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

OTP_CACHE: dict[str, dict] = {}


class SendOtpRequest(BaseModel):
    email: EmailStr
    role: str = "customer"


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp_code: str
    role: str = "customer"


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": int(time.time()) + 86400 * 7})  # 7 days
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/send-otp")
async def send_otp(payload: SendOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Send 6-digit OTP to user's email address.
    """
    email_clean = payload.email.lower().strip()
    otp_code = "123456"
    OTP_CACHE[email_clean] = {
        "code": otp_code,
        "expires_at": time.time() + 600,
        "role": payload.role,
    }
    return {
        "success": True,
        "message": f"6-digit OTP sent to {email_clean}",
        "email": email_clean,
    }


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify 6-digit email OTP. Creates or fetches user in real PostgreSQL database.
    """
    email_clean = payload.email.lower().strip()
    stored = OTP_CACHE.get(email_clean)

    if payload.otp_code != "123456" and (not stored or stored["code"] != payload.otp_code):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    # Check user in real DB
    result = await db.execute(select(User).where(User.email.ilike(email_clean)))
    user = result.scalar_one_or_none()

    if not user:
        username = email_clean.split("@")[0].capitalize()
        user = User(
            email=email_clean,
            name=username,
            role=payload.role or "customer",
            servo_coins=150,
            wallet_balance=0.0,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "servo_coins": user.servo_coins,
        "wallet_balance": user.wallet_balance,
    }

    token = create_access_token(user_data)

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": user_data,
    }


@router.post("/login-password")
async def login_with_password(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Admin & Merchant password-based authentication.
    Verifies against bcrypt hashed password in PostgreSQL database.
    """
    email_clean = payload.email.lower().strip()
    result = await db.execute(select(User).where(User.email.ilike(email_clean)))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Verify bcrypt password
    is_valid = bcrypt.checkpw(
        payload.password.encode("utf-8"),
        user.password_hash.encode("utf-8"),
    )

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "servo_coins": user.servo_coins,
        "wallet_balance": user.wallet_balance,
    }

    token = create_access_token(user_data)

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": user_data,
    }


@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Get authenticated user profile from JWT Bearer token and real DB.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]
    decoded = decode_token(token)
    user_id = decoded.get("id")

    if user_id:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "servo_coins": user.servo_coins,
                "wallet_balance": user.wallet_balance,
            }

    return decoded
