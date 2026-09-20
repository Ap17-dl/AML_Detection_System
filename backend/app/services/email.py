import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_admin_request_email(
    applicant_email: str,
    applicant_name: str,
    current_role: str,
    reason: str,
    user_id: str,
) -> dict[str, Any]:
    """Sends an email notification to the platform host via the Resend API (or simulates in test/dev).

    When a staff member requests elevation to Administrator privileges, the host receives an email
    with the applicant details, reason, and a link to approve the role change in Platform Administration.
    """
    settings = get_settings()
    now_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")

    subject = f"Admin Access Request: {applicant_name} ({applicant_email})"
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc; }}
          .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
          .header {{ background-color: #0f172a; color: #ffffff; padding: 20px 24px; }}
          .header h1 {{ margin: 0; font-size: 18px; font-weight: 600; }}
          .content {{ padding: 24px; }}
          .badge {{ display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: #e0f2fe; color: #0369a1; text-transform: uppercase; }}
          .field-group {{ margin-bottom: 16px; }}
          .field-label {{ font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }}
          .field-value {{ font-size: 15px; color: #0f172a; }}
          .reason-box {{ background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 4px; font-size: 14px; font-style: italic; color: #334155; }}
          .btn-container {{ margin-top: 28px; text-align: center; }}
          .btn {{ display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; }}
          .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #94a3b8; text-align: center; }}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AML Detection Platform</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Administrator Access Request</h2>
            <p style="color: #475569;">A registered user has requested elevation to Administrator privileges:</p>

            <div class="field-group">
              <div class="field-label">Applicant Name</div>
              <div class="field-value"><strong>{applicant_name}</strong></div>
            </div>

            <div class="field-group">
              <div class="field-label">Email Address</div>
              <div class="field-value">{applicant_email}</div>
            </div>

            <div class="field-group">
              <div class="field-label">Current Role</div>
              <div class="field-value"><span class="badge">{current_role}</span></div>
            </div>

            <div class="field-group">
              <div class="field-label">Requested At</div>
              <div class="field-value">{now_str}</div>
            </div>

            <div class="field-group">
              <div class="field-label">Justification / Reason</div>
              <div class="reason-box">"{reason.strip() if reason.strip() else 'No additional reason provided.'}"</div>
            </div>

            <div class="btn-container">
              <a href="http://localhost:3000/admin" class="btn">Open Platform Administration</a>
            </div>
          </div>
          <div class="footer">
            User ID: {user_id} &bull; AML Compliance & Detection Platform
          </div>
        </div>
      </body>
    </html>
    """

    if not settings.resend_api_key:
        logger.info(
            "[Resend Simulation] RESEND_API_KEY is not set. Simulated sending admin request email to %s for %s.",
            settings.host_email,
            applicant_email,
        )
        return {
            "sent": True,
            "simulated": True,
            "to": settings.host_email,
            "subject": subject,
            "message": "Email delivery simulated (RESEND_API_KEY not configured).",
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.resend_from_email,
                    "to": [settings.host_email],
                    "subject": subject,
                    "html": html_content,
                },
            )
            if response.status_code in (200, 201):
                data = response.json()
                logger.info(
                    "Resend email sent successfully (ID: %s) to %s",
                    data.get("id"),
                    settings.host_email,
                )
                return {
                    "sent": True,
                    "simulated": False,
                    "id": data.get("id"),
                    "to": settings.host_email,
                }
            else:
                logger.error("Resend API error (%d): %s", response.status_code, response.text)
                return {
                    "sent": False,
                    "simulated": False,
                    "error": response.text,
                    "status_code": response.status_code,
                }
        except Exception as exc:
            logger.exception("Failed to send email via Resend: %s", exc)
            return {"sent": False, "simulated": False, "error": str(exc)}
