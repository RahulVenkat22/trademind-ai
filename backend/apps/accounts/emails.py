import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("apps.accounts")


def send_new_user_credentials(*, username: str, email: str, password: str) -> None:
    """Email login credentials to a newly created user.

    Failures are logged but never raised — user creation must not fail just
    because the SMTP server is unreachable.
    """
    subject = "Your TradeMind AI account"
    message = (
        f"Hello {username},\n\n"
        "An account has been created for you on TradeMind AI.\n\n"
        f"  Username: {username}\n"
        f"  Email:    {email}\n"
        f"  Password: {password}\n\n"
        "Please sign in and change your password as soon as possible.\n\n"
        "— TradeMind AI"
    )
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        logger.info("Sent credentials email to %s", email)
    except Exception as exc:  # noqa: BLE001 - never block user creation
        logger.error("Failed to send credentials email to %s: %s", email, exc)
