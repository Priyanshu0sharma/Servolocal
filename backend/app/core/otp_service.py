import secrets
import smtplib
import hmac
import hashlib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("servolocal.otp")


def generate_otp_code() -> str:
    """Generates a secure 6-digit cryptographic numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000}"


def hash_otp(email: str, otp: str) -> str:
    """
    Computes a cryptographic HMAC-SHA256 hash of the OTP salted with
    the normalized email and server JWT_SECRET.
    Never store plaintext OTPs in the database.
    """
    secret = (settings.JWT_SECRET or "servolocal-default-salt").encode()
    message = f"{email.strip().lower()}:{otp.strip()}".encode()
    return hmac.new(secret, message, hashlib.sha256).hexdigest()


def verify_otp_hash(email: str, candidate_otp: str, stored_hash: str) -> bool:
    """
    Validates a candidate OTP against the stored hash in constant time
    to prevent timing attacks.
    """
    if not candidate_otp or not stored_hash:
        return False
    candidate_hash = hash_otp(email, candidate_otp)
    return hmac.compare_digest(stored_hash, candidate_hash)


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


async def send_otp_email(email: str, role: str, otp_code: str) -> None:
    """
    Sends the 6-digit OTP code to the recipient via configured Gmail SMTP.
    Raises HTTPException(503) if SMTP credentials are missing or sending fails.
    Never exposes plaintext OTP in production logs.
    """
    smtp_user = settings.SMTP_USER
    smtp_password = settings.clean_smtp_password

    if not smtp_user or not smtp_password:
        logger.error("SMTP credentials (SMTP_USER/SMTP_PASSWORD) are not configured.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is temporarily unavailable. Please check system configuration."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your ServoLocal Verification Code: {otp_code}"
    msg["From"] = f"ServoLocal <{smtp_user}>"
    msg["To"] = email

    part_text = MIMEText(
        f"Your ServoLocal verification code is: {otp_code}. Valid for 5 minutes.",
        "plain"
    )
    part_html = MIMEText(_build_html_email(otp_code, role), "html")
    msg.attach(part_text)
    msg.attach(part_html)

    try:
        # Connect to Gmail SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [email], msg.as_string())
        logger.info("Verification OTP email dispatched successfully to recipient.")
    except smtplib.SMTPAuthenticationError as e:
        logger.error("SMTP Authentication Error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service authentication failed. Please check SMTP credentials."
        )
    except Exception as e:
        logger.error("SMTP Dispatch Error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to dispatch verification email. Please try again later."
        )


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
