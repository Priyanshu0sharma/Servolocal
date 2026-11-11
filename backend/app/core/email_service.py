import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

def send_otp_email(to_email: str, otp_code: str) -> tuple[bool, str]:
    """
    Sends a real 6-digit verification code to the customer's email inbox.
    Returns (True, 'Success message') on actual delivery, or (False, 'Failure reason') if delivery fails.
    Never fakes success or returns mock status.
    """
    smtp_host = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    try:
        smtp_port = int(os.getenv("SMTP_PORT") or 587)
    except ValueError:
        smtp_port = 587

    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_EMAIL")
    smtp_pass = os.getenv("SMTP_PASSWORD")

    if not smtp_user or not smtp_pass:
        return (
            False,
            "Email service credentials missing: SMTP_USER and SMTP_PASSWORD must be configured in environment variables."
        )

    # Clean password if spaces exist
    clean_pass = smtp_pass.replace(" ", "").strip()

    # Compose Email Message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your ServoLocal Verification Code: {otp_code}"
    msg["From"] = f"ServoLocal <{smtp_user}>"
    msg["To"] = to_email

    text_content = f"""
Hello,

Your 6-digit verification code for ServoLocal is: {otp_code}

This code is valid for 5 minutes. Please do not share this OTP with anyone.

If you did not request this code, please ignore this email.

Warm regards,
Team ServoLocal
Hyperlocal Stores • Nearby • Fast
"""

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
    .logo {{ color: #078B35; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; text-align: center; }}
    .title {{ font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px; text-align: center; }}
    .desc {{ font-size: 14px; color: #4b5563; line-height: 1.5; text-align: center; margin-bottom: 24px; }}
    .otp-box {{ background-color: #EAF7EE; border: 2px dashed #078B35; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0; }}
    .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #078B35; font-family: monospace; }}
    .expiry {{ font-size: 12px; color: #6b7280; margin-top: 8px; }}
    .footer {{ font-size: 12px; color: #9ca3af; text-align: center; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">ServoLocal</div>
    <div class="title">Verification Code</div>
    <div class="desc">Please use the following 6-digit OTP to complete your login or sign-up.</div>
    <div class="otp-box">
      <div class="otp-code">{otp_code}</div>
      <div class="expiry">Valid for 5 minutes • Do not share with anyone</div>
    </div>
    <div class="footer">
      If you did not make this request, you can safely ignore this email.<br>
      © 2026 ServoLocal — Hyperlocal Commerce
    </div>
  </div>
</body>
</html>
"""

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, clean_pass)
        server.send_message(msg)
        server.quit()
        return (True, f"6-digit verification code successfully sent to {to_email}")
    except smtplib.SMTPAuthenticationError as auth_err:
        return (
            False,
            f"SMTP Authentication Error: Username or password rejected by {smtp_host} ({auth_err.smtp_code} {auth_err.smtp_error.decode('utf-8', errors='ignore') if isinstance(auth_err.smtp_error, bytes) else auth_err.smtp_error})"
        )
    except Exception as e:
        return (
            False,
            f"Failed to connect to email provider: {type(e).__name__} ({str(e)})"
        )
