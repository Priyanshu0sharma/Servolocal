import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import httpx
from app.core.config import settings

def render_email_templates(otp_code: str, to_email: str) -> tuple[str, str]:
    """
    Renders GitHub-style clean verification email templates (Plain text & HTML).
    """
    spaced_otp = "  ".join(list(otp_code))
    
    text_content = f"""
Please verify your identity

Here is your ServoLocal authentication code:

{otp_code}

This code is valid for 5 minutes and can only be used once.

Please don't share this code with anyone: we'll never ask for it on the phone or via email.

Thanks,
The ServoLocal Team
Hyperlocal Stores • Nearby • Fast
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ServoLocal Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f6f8fa; margin: 0; padding: 32px 16px; color: #24292f;">
  <table role="presentation" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #d0d7de; border-collapse: separate; overflow: hidden; width: 100%;">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 24px 32px 16px 32px; text-align: left; border-bottom: 1px solid #f0f2f4;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td>
              <span style="font-size: 20px; font-weight: 800; color: #078B35; letter-spacing: -0.5px;">⚡ ServoLocal</span>
            </td>
            <td style="text-align: right;">
              <span style="font-size: 11px; font-weight: 600; color: #078B35; background: #eaf7ee; padding: 4px 10px; border-radius: 20px; border: 1px solid #c2e9cb;">10-15 Min Delivery</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="font-size: 20px; font-weight: 600; color: #24292f; margin: 0 0 16px 0; line-height: 1.3;">
          Please verify your identity
        </h1>
        <p style="font-size: 14px; color: #57606a; margin: 0 0 24px 0; line-height: 1.5;">
          Here is your ServoLocal authentication code:
        </p>
        
        <!-- Large OTP Box inspired by GitHub Sudo Code -->
        <div style="background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6e7781; font-weight: 600; margin-bottom: 8px;">
            Verification Code
          </div>
          <div style="font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #078B35;">
            {otp_code}
          </div>
        </div>

        <p style="font-size: 13px; color: #57606a; margin: 0 0 12px 0; line-height: 1.5;">
          This code is valid for <strong>5 minutes</strong> and can only be used once.
        </p>
        <p style="font-size: 13px; color: #57606a; margin: 0 0 28px 0; line-height: 1.5;">
          Please don't share this code with anyone: we'll never ask for it on the phone or via email.
        </p>
        
        <p style="font-size: 14px; color: #24292f; margin: 0; line-height: 1.5;">
          Thanks,<br>
          <strong>The ServoLocal Team</strong>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 32px; background-color: #f6f8fa; border-top: 1px solid #d0d7de; font-size: 11px; color: #6e7781; text-align: center; line-height: 1.5;">
        You're receiving this email because a verification code was requested for your ServoLocal account.<br>
        © 2026 ServoLocal Marketplace. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
"""
    return text_content, html_content


def send_otp_email(to_email: str, otp_code: str) -> tuple[bool, str]:
    """
    Sends a real 6-digit verification code to the customer's email inbox.
    Supports:
    1. Resend REST API (HTTPS port 443 - Recommended for Render & Cloud, never blocked)
    2. Brevo REST API (HTTPS port 443)
    3. Direct SMTP (smtp.gmail.com:587 - fallback)
    """
    resend_api_key = os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", None)
    brevo_api_key = os.getenv("BREVO_API_KEY") or getattr(settings, "BREVO_API_KEY", None)
    email_from = os.getenv("EMAIL_FROM") or getattr(settings, "EMAIL_FROM", "ServoLocal <onboarding@resend.dev>")
    
    text_content, html_content = render_email_templates(otp_code, to_email)
    subject = f"[{otp_code}] Your ServoLocal verification code"

    # --- 1. Resend REST API (HTTPS Port 443, Zero Port-Blocking on Render) ---
    if resend_api_key and resend_api_key.strip():
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key.strip()}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": email_from,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content,
                    },
                )
                if resp.status_code in (200, 201):
                    return (True, f"Verification code successfully sent via Resend API to {to_email}")
                else:
                    err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_data.get("message") or resp.text
                    return (False, f"Resend API error ({resp.status_code}): {err_msg}")
        except Exception as e:
            return (False, f"Failed to send email via Resend API: {str(e)}")

    # --- 2. Brevo REST API (HTTPS Port 443) ---
    if brevo_api_key and brevo_api_key.strip():
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": brevo_api_key.strip(),
                        "Content-Type": "application/json",
                    },
                    json={
                        "sender": {"name": "ServoLocal", "email": "auth@servolocal.in"},
                        "to": [{"email": to_email}],
                        "subject": subject,
                        "htmlContent": html_content,
                        "textContent": text_content,
                    },
                )
                if resp.status_code in (200, 201):
                    return (True, f"Verification code successfully sent via Brevo API to {to_email}")
                else:
                    return (False, f"Brevo API error ({resp.status_code}): {resp.text}")
        except Exception as e:
            return (False, f"Failed to send email via Brevo API: {str(e)}")

    # --- 3. SMTP Fallback (e.g. Local development or unblocked SMTP) ---
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_EMAIL")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_host = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    try:
        smtp_port = int(os.getenv("SMTP_PORT") or 587)
    except ValueError:
        smtp_port = 587

    if not smtp_user or not smtp_pass:
        return (
            False,
            "No email service configured. Please provide RESEND_API_KEY (Recommended) or SMTP_PASSWORD in environment variables."
        )

    clean_pass = smtp_pass.replace(" ", "").strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"ServoLocal <{smtp_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
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
            f"SMTP Authentication Error: Google rejected credentials ({auth_err.smtp_code}). Please verify your App Password."
        )
    except Exception as exc:
        return (False, f"Failed to connect to email provider: {exc}")
