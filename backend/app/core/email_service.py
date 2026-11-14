import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import httpx
from app.core.config import settings

def get_role_template_config(role: str, otp_code: str):
    """
    Returns specific branding, color schemes, badges, titles, and subjects for each role:
    - customer: Hyperlocal shopper (Green #10B981)
    - seller/merchant/shopkeeper: Local store owner (Blue #3B82F6)
    - rider/delivery: Delivery fleet rider (Amber/Orange #F59E0B)
    - admin: Super admin security console (Red #EF4444)
    """
    clean_role = (role or "customer").lower().strip()
    
    if clean_role in ("seller", "merchant", "partner", "shopkeeper"):
        return {
            "brand_title": "🏪 ServoLocal Partner",
            "service_name": "Merchant Store Portal",
            "badge_text": "Store Partner",
            "badge_bg": "#1E3A8A",
            "badge_border": "#3B82F6",
            "badge_color": "#93C5FD",
            "accent_color": "#3B82F6",
            "heading": "Merchant Portal Verification",
            "description": "You are receiving this email because a verification code has been requested to access your ServoLocal Merchant Dashboard, inventory, and live orders. We need to verify that it is you.",
            "subject": f"[ServoLocal Partner] Verification code: {otp_code}",
            "footer_note": "ServoLocal Merchant Network • Grow Your Local Shop Online",
            "warning": None,
        }
    elif clean_role in ("rider", "delivery", "delivery_partner"):
        return {
            "brand_title": "🛵 ServoLocal Fleet",
            "service_name": "Delivery Fleet App",
            "badge_text": "Fleet Partner",
            "badge_bg": "#78350F",
            "badge_border": "#F59E0B",
            "badge_color": "#FDE68A",
            "accent_color": "#F59E0B",
            "heading": "Delivery Fleet Duty Verification",
            "description": "You are receiving this email because a duty verification code has been requested to start your delivery shift and accept neighborhood orders. We need to verify that it is you.",
            "subject": f"[ServoLocal Fleet] Verification code: {otp_code}",
            "footer_note": "ServoLocal Fleet Operations • Fast Deliveries, Daily Payouts",
            "warning": None,
        }
    elif clean_role in ("admin", "superadmin"):
        return {
            "brand_title": "🔒 ServoLocal Security",
            "service_name": "Master Admin Console",
            "badge_text": "Master Security",
            "badge_bg": "#7F1D1D",
            "badge_border": "#EF4444",
            "badge_color": "#FECACA",
            "accent_color": "#EF4444",
            "heading": "Admin Console Security Code",
            "description": "You are receiving this email because privileged administrative access was requested for the ServoLocal Master Console. We need to verify that it is you.",
            "subject": f"[ServoLocal Security] Verification code: {otp_code}",
            "footer_note": "ServoLocal Internal Security & Infrastructure Ops",
            "warning": "⚠️ RESTRICTED ZONE: This access attempt has been logged with timestamp and IP. If this was not you, revoke access immediately.",
        }
    else:  # Default: customer
        return {
            "brand_title": "⚡ ServoLocal",
            "service_name": "ServoLocal Customer Account",
            "badge_text": "10-15 Min Delivery",
            "badge_bg": "#064E3B",
            "badge_border": "#10B981",
            "badge_color": "#A7F3D0",
            "accent_color": "#10B981",
            "heading": "Account Verification",
            "description": "You are receiving this email because a verification code has been requested for your ServoLocal account. We need to verify that it is you.",
            "subject": f"[ServoLocal] Verification code: {otp_code}",
            "footer_note": "Local Shops at your Doorstep • 10-15 Min Delivery • ServoLocal India",
            "warning": None,
        }


def render_email_templates(otp_code: str, to_email: str, role: str = "customer") -> tuple[str, str, str]:
    """
    Renders Brevo-style high-contrast verification email templates tailored to each user role.
    Includes Schema.org EmailMessage microdata and standard trigger phrases that activate
    Gmail's native 'Code Requested [ Copy code ]' smart chip.
    Returns: (text_content, html_content, subject)
    """
    cfg = get_role_template_config(role, otp_code)
    accent = cfg["accent_color"]
    warning_box = ""
    if cfg["warning"]:
        warning_box = f"""
        <div style="background-color: #3B1212; border: 1px solid #EF4444; border-radius: 8px; padding: 12px 16px; margin: 0 0 20px 0; font-size: 12px; color: #FCA5A5; line-height: 1.5;">
          {cfg["warning"]}
        </div>
        """

    text_content = f"""Hi,

{cfg["description"]}

Return to the screen where you started and enter the verification code below. The code is valid for 10 minutes.

{otp_code}

Activity details:
Account email: {to_email}
Service: {cfg["service_name"]}
Location: India

If you did not request this verification code, please ignore this email.

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
  <script type="application/ld+json">
  {{
    "@context": "http://schema.org",
    "@type": "EmailMessage",
    "description": "ServoLocal Verification Code"
  }}
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; margin: 0; padding: 24px 12px; color: #c9d1d9;">
  <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; border-collapse: separate; overflow: hidden; width: 100%; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 24px 28px 20px 28px; text-align: left; border-bottom: 1px solid #21262d;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td>
              <span style="font-size: 24px; font-weight: 900; color: {accent}; letter-spacing: -0.5px;">{cfg["brand_title"]}</span>
            </td>
            <td style="text-align: right;">
              <span style="font-size: 11px; font-weight: 700; color: {cfg["badge_color"]}; background: {cfg["badge_bg"]}; padding: 4px 10px; border-radius: 20px; border: 1px solid {cfg["badge_border"]}; text-transform: uppercase; letter-spacing: 0.5px;">{cfg["badge_text"]}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 28px 28px 24px 28px;">
        <p style="font-size: 15px; color: #f0f6fc; margin: 0 0 14px 0; line-height: 1.5;">
          Hi,
        </p>
        <p style="font-size: 14px; color: #c9d1d9; margin: 0 0 16px 0; line-height: 1.6;">
          {cfg["description"]}
        </p>
        <p style="font-size: 14px; color: #c9d1d9; margin: 0 0 24px 0; line-height: 1.6;">
          Return to the screen where you started and enter the verification code below. The code is valid for 10 minutes.
        </p>
        
        {warning_box}

        <!-- Standalone Verification Code Box (Brevo-style high-contrast copy card) -->
        <div style="background-color: #0d1117; border: 1.5px solid {accent}; border-radius: 10px; padding: 22px 16px; text-align: center; margin: 0 0 26px 0;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: {accent}; font-weight: 700; margin-bottom: 10px;">
            Verification Code
          </div>
          <div style="font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; user-select: all; -webkit-user-select: all;">
            {otp_code}
          </div>
          <div style="font-size: 11px; color: #8b949e; margin-top: 10px;">
            Tap or double-click code to copy
          </div>
        </div>

        <!-- Activity Details Box -->
        <div style="background-color: #21262d; border-radius: 8px; padding: 14px 18px; margin: 0 0 24px 0; font-size: 12px; color: #8b949e; line-height: 1.7;">
          <strong style="color: #f0f6fc; display: block; margin-bottom: 6px; font-size: 12px;">Activity details:</strong>
          Account email: <span style="color: #f0f6fc;">{to_email}</span><br>
          Service: <span style="color: #f0f6fc;">{cfg["service_name"]}</span><br>
          Location: <span style="color: #f0f6fc;">India</span><br>
          Device: <span style="color: #f0f6fc;">Web Browser / Mobile App</span>
        </div>

        <p style="font-size: 12px; color: #8b949e; margin: 0 0 20px 0; line-height: 1.5;">
          If you did not request this verification code, please ignore this email.
        </p>
        
        <p style="font-size: 14px; color: #f0f6fc; margin: 0; line-height: 1.5;">
          Thanks,<br>
          <strong style="color: {accent};">The ServoLocal Team</strong>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 28px; background-color: #0d1117; border-top: 1px solid #21262d; font-size: 11px; color: #8b949e; text-align: center; line-height: 1.5;">
        You're receiving this email because a verification code was requested for your ServoLocal account.<br>
        © 2026 ServoLocal Marketplace. {cfg["footer_note"]}
      </td>
    </tr>
  </table>
</body>
</html>"""
    return text_content, html_content, cfg["subject"]


def send_otp_email(to_email: str, otp_code: str, role: str = "customer") -> tuple[bool, str]:
    """
    Sends a real 6-digit verification code to the recipient's email inbox.
    Uses Brevo REST API (HTTPS Port 443 - zero cloud port blocking) when BREVO_API_KEY is set,
    with direct SMTP delivery as backup.
    """
    text_content, html_content, subject = render_email_templates(otp_code, to_email, role)

    # --- 1. Brevo REST API (HTTPS Port 443 — Unblocked on all cloud providers) ---
    brevo_api_key = os.getenv("BREVO_API_KEY") or getattr(settings, "BREVO_API_KEY", None)
    if brevo_api_key and brevo_api_key.strip():
        sender_email = (
            os.getenv("BREVO_SENDER_EMAIL")
            or os.getenv("SMTP_USER")
            or "priyanshusharma1131@gmail.com"
        )
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": brevo_api_key.strip(),
                        "Content-Type": "application/json",
                    },
                    json={
                        "sender": {"name": "ServoLocal", "email": sender_email},
                        "to": [{"email": to_email}],
                        "subject": subject,
                        "htmlContent": html_content,
                        "textContent": text_content,
                    },
                )
                if resp.status_code in (200, 201):
                    return (True, f"Verification code successfully sent to {to_email}")
                else:
                    err_msg = resp.text
                    try:
                        err_json = resp.json()
                        err_msg = err_json.get("message", resp.text)
                    except Exception:
                        pass
                    return (False, f"Brevo API error ({resp.status_code}): {err_msg}")
        except Exception as e:
            return (False, f"Failed to send email via Brevo: {str(e)}")

    # --- 2. Direct SMTP Delivery ---

    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_EMAIL") or getattr(settings, "SMTP_USER", None)
    smtp_pass = os.getenv("SMTP_PASSWORD") or getattr(settings, "SMTP_PASSWORD", None)
    smtp_host = os.getenv("SMTP_HOST") or getattr(settings, "SMTP_HOST", "smtp.gmail.com")
    try:
        smtp_port = int(os.getenv("SMTP_PORT") or getattr(settings, "SMTP_PORT", 587))
    except (ValueError, TypeError):
        smtp_port = 587

    if not smtp_user or not smtp_pass:
        return (
            False,
            "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in your environment variables."
        )

    clean_pass = smtp_pass.replace(" ", "").replace('"', "").replace("'", "").strip()

    # User candidate list: Primary configured user + verified fallback
    user_candidates = [smtp_user]
    if "priyanshusharma1131@gmail.com" not in user_candidates:
        user_candidates.append("priyanshusharma1131@gmail.com")

    last_error = None

    for active_user in user_candidates:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"ServoLocal <{active_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # 1. Try Port 587 with STARTTLS
        try:
            server = smtplib.SMTP(smtp_host, 587, timeout=12)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(active_user, clean_pass)
            server.send_message(msg)
            server.quit()
            return (True, f"Verification code successfully sent via SMTP to {to_email}")
        except smtplib.SMTPAuthenticationError as auth_err:
            last_error = f"SMTP Auth Error: Google rejected credentials for {active_user} ({auth_err.smtp_code})"
            continue  # Try next candidate
        except Exception as exc:
            last_error = exc

        # 2. Try Port 465 SSL
        try:
            server_ssl = smtplib.SMTP_SSL(smtp_host, 465, timeout=12)
            server_ssl.ehlo()
            server_ssl.login(active_user, clean_pass)
            server_ssl.send_message(msg)
            server_ssl.quit()
            return (True, f"Verification code successfully sent via SMTP (SSL 465) to {to_email}")
        except smtplib.SMTPAuthenticationError as auth_err:
            last_error = f"SMTP Auth Error: Google rejected credentials for {active_user} ({auth_err.smtp_code})"
            continue
        except Exception as exc2:
            last_error = exc2

    return (
        False,
        f"SMTP Connection Failed: {str(last_error)}. If running on Render, the cloud provider blocks outbound ports 587 and 465."
    )
