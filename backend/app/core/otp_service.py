import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import OTPVerification


def _build_html_email(otp: str, role: str) -> str:
    """Generates an aesthetic branded HTML email for ServoLocal verification."""
    role_title = {
        "customer": "Customer Verification",
        "seller": "Shopkeeper Hub Login",
        "partner": "Delivery Fleet Access",
        "admin": "Super Admin Control",
    }.get(role.lower(), "Account Verification")

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 26px; font-weight: 900; color: #0f172a; text-align: center; margin-bottom: 8px; letter-spacing: -0.5px; }}
        .logo span {{ color: #10b981; }}
        .badge {{ display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 20px; }}
        .header {{ text-align: center; }}
        .title {{ font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; }}
        .subtitle {{ font-size: 14px; color: #64748b; margin: 0 0 24px 0; line-height: 1.5; }}
        .otp-box {{ background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }}
        .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #065f46; margin: 0; font-family: monospace; }}
        .note {{ font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.4; }}
        .footer {{ text-align: center; margin-top: 24px; font-size: 11px; color: #cbd5e1; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">Servo<span>Local</span></div>
          <div class="badge">{role_title}</div>
          <h2 class="title">Your One-Time Password</h2>
          <p class="subtitle">Use the verification code below to securely sign in to your ServoLocal account. Valid for 5 minutes.</p>
        </div>
        <div class="otp-box">
          <div class="otp-code">{otp}</div>
        </div>
        <p class="note">If you did not request this code, you can safely ignore this email. Never share this OTP with anyone.</p>
        <div class="footer">© 2026 ServoLocal Platform. High-Speed Local Commerce.</div>
      </div>
    </body>
    </html>
    """


async def generate_and_send_otp(email: str, role: str, db: AsyncSession) -> tuple[bool, str]:
    """
    1. Generates 6-digit cryptographic numeric OTP.
    2. Saves record to OTPVerification table (5-minute expiry).
    3. Sends email via Gmail SMTP (or logs to console on local network/fallback).
    Returns (email_dispatched: bool, otp_code: str).
    """
    clean_email = email.strip().lower()
    clean_role = role.strip().lower()

    # Generate real 6-digit cryptographic OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    # Save to database
    otp_record = OTPVerification(
        email=clean_email,
        otp_code=otp_code,
        role=clean_role,
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp_record)
    await db.commit()

    # Send via SMTP with safe fallback
    smtp_user = settings.SMTP_USER
    smtp_password = settings.clean_smtp_password
    email_dispatched = False

    if smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Your ServoLocal OTP: {otp_code}"
            msg["From"] = f"ServoLocal <{smtp_user}>"
            msg["To"] = clean_email

            part_text = MIMEText(f"Your ServoLocal verification code is: {otp_code}. Valid for 5 minutes.", "plain")
            part_html = MIMEText(_build_html_email(otp_code, clean_role), "html")
            msg.attach(part_text)
            msg.attach(part_html)

            # Send via Gmail SMTP
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=8) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [clean_email], msg.as_string())

            print(f"[OTP SERVICE] Email successfully dispatched to {clean_email}")
            email_dispatched = True
            return True, otp_code
        except Exception as e:
            print(f"[OTP SERVICE SMTP WARNING] {e}. Falling back to console log.")

    # Local / cloud network fallback console logging
    print("=" * 60)
    print(f"[LOCAL OTP LOG] Email: {clean_email} | Role: {clean_role} | Code: {otp_code}")
    print("=" * 60)
    return False, otp_code


async def verify_google_oauth_token(id_token: str) -> Dict[str, Any]:
    """
    Validates Google id_token against Google OAuth2 tokeninfo endpoint.
    Verifies audience matches settings.GOOGLE_CLIENT_ID.
    Returns user payload: {email, name, sub}.
    """
    if not id_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token is required",
        )

    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google verification failed: invalid token",
                )
            token_data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google token verification network error: {str(e)}",
        )

    # Audience validation (Audience must match GOOGLE_CLIENT_ID if configured)
    aud = token_data.get("aud")
    if settings.GOOGLE_CLIENT_ID and aud != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token audience mismatch",
        )

    email = token_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token payload missing email",
        )

    return {
        "email": email.strip().lower(),
        "name": token_data.get("name") or token_data.get("given_name") or "Google User",
        "sub": token_data.get("sub", ""),
        "picture": token_data.get("picture", ""),
    }
