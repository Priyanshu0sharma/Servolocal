import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import httpx
from app.core.config import settings

def get_role_template_config(role: str, otp_code: str):
    """
    Returns specific branding, color schemes, badges, titles, and subjects for each role:
    - customer: Hyperlocal shopper (Green #078B35)
    - seller/merchant/shopkeeper: Local store owner (Blue #1D4ED8)
    - rider/delivery: Delivery fleet rider (Amber/Orange #D97706)
    - admin: Super admin security console (Red #DC2626)
    """
    clean_role = (role or "customer").lower().strip()
    
    if clean_role in ("seller", "merchant", "partner", "shopkeeper"):
        return {
            "brand_title": "🏪 ServoLocal Partner",
            "badge_text": "Merchant Portal",
            "badge_bg": "#EFF6FF",
            "badge_border": "#BFDBFE",
            "badge_color": "#1D4ED8",
            "accent_color": "#1D4ED8",
            "heading": "Merchant Partner Login",
            "description": "Here is your one-time verification code to access your store dashboard, inventory, and live orders:",
            "subject": f"[{otp_code}] ServoLocal Merchant Portal Login",
            "footer_note": "ServoLocal Merchant Network • Grow Your Local Shop Online",
            "warning": None,
        }
    elif clean_role in ("rider", "delivery", "delivery_partner"):
        return {
            "brand_title": "🛵 ServoLocal Rider",
            "badge_text": "Fleet Partner",
            "badge_bg": "#FEF3C7",
            "badge_border": "#FDE68A",
            "badge_color": "#B45309",
            "accent_color": "#D97706",
            "heading": "Delivery Partner Login",
            "description": "Here is your duty verification code to start your shift and accept local customer deliveries:",
            "subject": f"[{otp_code}] ServoLocal Delivery Partner Access",
            "footer_note": "ServoLocal Fleet Operations • Fast Deliveries, Daily Payouts",
            "warning": None,
        }
    elif clean_role in ("admin", "superadmin"):
        return {
            "brand_title": "🔒 ServoLocal Security",
            "badge_text": "Master Admin Console",
            "badge_bg": "#FEE2E2",
            "badge_border": "#FECACA",
            "badge_color": "#B91C1C",
            "accent_color": "#DC2626",
            "heading": "Admin Console Security Code",
            "description": "Privileged administrative access requested for the ServoLocal Master Console. Use this one-time code to authenticate:",
            "subject": f"🚨 [{otp_code}] ServoLocal Admin Console Security Code",
            "footer_note": "ServoLocal Internal Security & Infrastructure Ops",
            "warning": "⚠️ RESTRICTED ZONE: This access attempt has been logged with timestamp and IP. If this was not you, revoke access immediately.",
        }
    else:  # Default: customer
        return {
            "brand_title": "⚡ ServoLocal",
            "badge_text": "10-15 Min Delivery",
            "badge_bg": "#EAF7EE",
            "badge_border": "#C2E9CB",
            "badge_color": "#078B35",
            "accent_color": "#078B35",
            "heading": "Please verify your identity",
            "description": "Here is your ServoLocal customer login code to discover and order from neighbourhood stores:",
            "subject": f"[{otp_code}] Your ServoLocal verification code",
            "footer_note": "Happy Shopping! • Local Shops at your Doorstep • ServoLocal India",
            "warning": None,
        }


def render_email_templates(otp_code: str, to_email: str, role: str = "customer") -> tuple[str, str, str]:
    """
    Renders GitHub-style clean verification email templates tailored to each user role.
    Returns: (text_content, html_content, subject)
    """
    cfg = get_role_template_config(role, otp_code)
    accent = cfg["accent_color"]
    warning_box = ""
    if cfg["warning"]:
        warning_box = f"""
        <div style="background-color: #FEF2F2; border: 1px solid #F87171; border-radius: 6px; padding: 12px; margin: 0 0 20px 0; font-size: 12px; color: #991B1B; line-height: 1.4;">
          {cfg["warning"]}
        </div>
        """

    text_content = f"""
{cfg["heading"]}

{cfg["description"]}

{otp_code}

This code is valid for 5 minutes and can only be used once.

Please don't share this code with anyone: we'll never ask for it on the phone or via email.
{cfg["warning"] or ""}

Thanks,
The ServoLocal Team
{cfg["footer_note"]}
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{cfg["subject"]}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f6f8fa; margin: 0; padding: 32px 16px; color: #24292f;">
  <table role="presentation" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #d0d7de; border-collapse: separate; overflow: hidden; width: 100%;">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 24px 32px 16px 32px; text-align: left; border-bottom: 1px solid #f0f2f4;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td>
              <span style="font-size: 20px; font-weight: 800; color: {accent}; letter-spacing: -0.5px;">{cfg["brand_title"]}</span>
            </td>
            <td style="text-align: right;">
              <span style="font-size: 11px; font-weight: 600; color: {cfg["badge_color"]}; background: {cfg["badge_bg"]}; padding: 4px 10px; border-radius: 20px; border: 1px solid {cfg["badge_border"]};">{cfg["badge_text"]}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="font-size: 20px; font-weight: 600; color: #24292f; margin: 0 0 16px 0; line-height: 1.3;">
          {cfg["heading"]}
        </h1>
        <p style="font-size: 14px; color: #57606a; margin: 0 0 24px 0; line-height: 1.5;">
          {cfg["description"]}
        </p>
        
        {warning_box}

        <!-- Large OTP Box inspired by GitHub Sudo Code -->
        <div style="background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6e7781; font-weight: 600; margin-bottom: 8px;">
            Verification Code
          </div>
          <div style="font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: {accent};">
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
        © 2026 ServoLocal Marketplace. {cfg["footer_note"]}
      </td>
    </tr>
  </table>
</body>
</html>
"""
    return text_content, html_content, cfg["subject"]


def send_otp_email(to_email: str, otp_code: str, role: str = "customer") -> tuple[bool, str]:
    """
    Sends a real 6-digit verification code to the recipient's email inbox with role-based formatting.
    """
    resend_api_key = os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", None)
    brevo_api_key = os.getenv("BREVO_API_KEY") or getattr(settings, "BREVO_API_KEY", None)
    email_from = os.getenv("EMAIL_FROM") or getattr(settings, "EMAIL_FROM", "ServoLocal <onboarding@resend.dev>")
    
    text_content, html_content, subject = render_email_templates(otp_code, to_email, role)

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

    # --- 3. SMTP Fallback ---
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
            "No email service configured. Please provide RESEND_API_KEY in environment variables."
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
