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


# =============================================================================
# PHASE 03: VERIFICATION TASKS
# =============================================================================

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='authentication.notify_admin_new_verification',
)
def notify_admin_new_verification(self, verification_id):
    """
    Notify admin(s) that a new verification request has been submitted.

    Args:
        verification_id: UUID string of the UserVerification record.
    """
    from apps.authentication.models import User, UserVerification

    try:
        verification = UserVerification.objects.select_related('user').get(
            id=verification_id
        )
    except UserVerification.DoesNotExist:
        logger.error(
            f'notify_admin_new_verification: Verification {verification_id} not found.'
        )
        return

    # Get admin emails
    admin_emails = list(
        User.objects.filter(role='admin', is_active=True)
        .values_list('email', flat=True)
    )

    if not admin_emails:
        logger.warning('No admin users found to notify.')
        return

    try:
        from django.core.mail import send_mail
        subject = f'New Verification Request: {verification.verification_type}'
        message = (
            f'User {verification.user.full_name} ({verification.user.email}) '
            f'has submitted a {verification.verification_type} verification.\n\n'
            f'Student ID: {verification.student_id_number or "N/A"}\n'
            f'Please review it in the admin panel.'
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@campushat.com'),
            recipient_list=admin_emails,
            fail_silently=True,
        )
        logger.info(
            f'Admin notification sent for verification {verification_id}.'
        )
    except Exception as exc:
        logger.error(f'notify_admin_new_verification error: {exc}')
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='authentication.send_verification_result',
)
def send_verification_result(self, verification_id):
    """
    Notify the user of their verification result (approved/rejected).

    Args:
        verification_id: UUID string of the UserVerification record.
    """
    from apps.authentication.models import UserVerification

    try:
        verification = UserVerification.objects.select_related('user').get(
            id=verification_id
        )
    except UserVerification.DoesNotExist:
        logger.error(
            f'send_verification_result: Verification {verification_id} not found.'
        )
        return

    user = verification.user

    if verification.status == 'approved':
        subject = 'Your CampusHat verification has been approved!'
        message = (
            f'Congratulations {user.full_name}!\n\n'
            f'Your {verification.verification_type} verification has been '
            f'approved with tier: {verification.verification_tier}.\n\n'
            f'You now have access to verified-student features on CampusHat.'
        )
    elif verification.status == 'rejected':
        subject = 'Your CampusHat verification was not approved'
        message = (
            f'Hello {user.full_name},\n\n'
            f'Your {verification.verification_type} verification was rejected.\n\n'
            f'Reason: {verification.rejection_reason or "No reason provided."}\n\n'
            f'You can resubmit your documents for review.'
        )
    else:
        return

    try:
        from django.core.mail import send_mail
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@campushat.com'),
            recipient_list=[user.email],
            fail_silently=True,
        )
        logger.info(f'Verification result sent to {user.email}.')
    except Exception as exc:
        logger.error(f'send_verification_result error: {exc}')
        raise self.retry(exc=exc)

