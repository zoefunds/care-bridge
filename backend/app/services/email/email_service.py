import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from app.core.config import settings
from app.core.logging import logger


def _get_client():
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = settings.BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )


async def send_verification_email(to_email: str, full_name: str, token: str):
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
        '<h2 style="color:#0ea5e9;">Welcome to Care Bridge</h2>'
        f'<p>Hi {full_name},</p>'
        '<p>Please verify your email address to activate your account.</p>'
        f'<a href="{verify_url}" style="background:#0ea5e9;color:white;padding:12px 24px;'
        'text-decoration:none;border-radius:6px;display:inline-block;">Verify Email</a>'
        '<p style="color:#666;font-size:12px;margin-top:24px;">'
        'This link expires in 24 hours. If you did not create a Care Bridge account, '
        'please ignore this email.</p></div>'
    )
    try:
        client = _get_client()
        email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": full_name}],
            sender={"email": settings.BREVO_SENDER_EMAIL, "name": settings.BREVO_SENDER_NAME},
            subject="Verify your Care Bridge account",
            html_content=html,
        )
        client.send_transac_email(email)
        logger.info("verification_email_sent", email=to_email)
    except ApiException as e:
        logger.error("email_send_failed", error=str(e), email=to_email)


async def send_password_reset_email(to_email: str, full_name: str, token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
        '<h2 style="color:#0ea5e9;">Password Reset</h2>'
        f'<p>Hi {full_name},</p>'
        '<p>Click the link below to reset your password. This link expires in 1 hour.</p>'
        f'<a href="{reset_url}" style="background:#0ea5e9;color:white;padding:12px 24px;'
        'text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a>'
        '<p style="color:#666;font-size:12px;margin-top:24px;">'
        'If you did not request a password reset, please ignore this email.</p></div>'
    )
    try:
        client = _get_client()
        email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": full_name}],
            sender={"email": settings.BREVO_SENDER_EMAIL, "name": settings.BREVO_SENDER_NAME},
            subject="Reset your Care Bridge password",
            html_content=html,
        )
        client.send_transac_email(email)
        logger.info("reset_email_sent", email=to_email)
    except ApiException as e:
        logger.error("reset_email_failed", error=str(e), email=to_email)
