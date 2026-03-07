"""
Authentication Celery Tasks.

Asynchronous tasks for sending verification emails and other
auth-related background processing.
"""

import logging

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='authentication.send_verification_email',
)
def send_verification_email(self, user_id):
    """
    Send an email verification link to the user.

    Fetches the user and their latest unused verification token,
    then renders and sends an HTML email with the verification link.

    Args:
        user_id: UUID string of the user to send verification to.
    """
    from apps.authentication.models import EmailVerificationToken, User
    from core.utils import send_notification_email

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f'send_verification_email: User {user_id} not found.')
        return

    # Get the latest valid token
    token_obj = (
        EmailVerificationToken.objects
        .filter(user=user, is_used=False)
        .order_by('-created_at')
        .first()
    )

    if not token_obj:
        logger.warning(f'send_verification_email: No valid token for user {user_id}.')
        return

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    verification_link = f'{frontend_url}/verify-email?token={token_obj.token}'

    context = {
        'user_name': user.full_name,
        'verification_link': verification_link,
        'expiry_hours': 24,
    }

    try:
        success = send_notification_email(
            to=user.email,
            subject='Verify your CampusHat account',
            template='emails/verification_email.html',
            context=context,
        )
        if success:
            logger.info(f'Verification email sent to {user.email}.')
        else:
            logger.warning(f'Failed to send verification email to {user.email}.')
    except Exception as exc:
        logger.error(f'send_verification_email error: {exc}')
        raise self.retry(exc=exc)
