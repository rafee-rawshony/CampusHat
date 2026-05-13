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
    verification_link = f'{frontend_url}/auth/verify-email?token={token_obj.token}'

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


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name='authentication.send_otp_email',
)
def send_otp_email(self, email, otp_code, user_name):
    """
    Send a one-time login code to the user's email.

    The plaintext code only lives in the task payload briefly — it is never
    stored in the database in plaintext. The DB only has the SHA-256 hash.

    Args:
        email: Recipient email address.
        otp_code: Plaintext 6-digit OTP (transient; for delivery only).
        user_name: Full name to greet the user with.
    """
    from core.utils import send_notification_email
    from apps.authentication.models import OTPCode

    context = {
        'user_name': user_name,
        'otp_code': otp_code,
        'expiry_minutes': OTPCode.EXPIRY_MINUTES,
    }

    try:
        success = send_notification_email(
            to=email,
            subject='Your CampusHat login code',
            template='emails/otp_email.html',
            context=context,
        )
        if success:
            logger.info(f'OTP email sent to {email}.')
        else:
            logger.warning(f'Failed to send OTP email to {email}.')
    except Exception as exc:
        logger.error(f'send_otp_email error: {exc}')
        raise self.retry(exc=exc)


# =============================================================================
# PASSWORD RESET
# =============================================================================

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name='authentication.send_password_reset_email',
)
def send_password_reset_email(self, email, otp_code, user_name):
    """
    Send a password reset OTP to the user's email.

    Args:
        email: Recipient email address.
        otp_code: Plaintext 6-digit OTP (transient; for delivery only).
        user_name: Full name to greet the user with.
    """
    from core.utils import send_notification_email
    from apps.authentication.models import OTPCode

    context = {
        'user_name': user_name,
        'otp_code': otp_code,
        'expiry_minutes': OTPCode.EXPIRY_MINUTES,
    }

    try:
        success = send_notification_email(
            to=email,
            subject='Reset your CampusHat password',
            template='emails/password_reset_email.html',
            context=context,
        )
        if success:
            logger.info(f'Password reset email sent to {email}.')
        else:
            logger.warning(f'Failed to send password reset email to {email}.')
    except Exception as exc:
        logger.error(f'send_password_reset_email error: {exc}')
        raise self.retry(exc=exc)


# =============================================================================
# EMAIL CHANGE FLOW
# =============================================================================

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='authentication.send_email_change_confirmation',
)
def send_email_change_confirmation(self, change_request_id):
    """
    Send the confirmation link to the NEW email address. Clicking the
    link applies the change.

    Args:
        change_request_id: UUID string of the EmailChangeRequest.
    """
    from apps.authentication.models import EmailChangeRequest
    from core.utils import send_notification_email

    try:
        req = EmailChangeRequest.objects.select_related('user').get(id=change_request_id)
    except EmailChangeRequest.DoesNotExist:
        logger.error('send_email_change_confirmation: %s not found.', change_request_id)
        return

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    confirm_link = f'{frontend_url}/auth/confirm-email-change?token={req.token}'

    context = {
        'user_name': req.user.full_name,
        'old_email': req.old_email,
        'new_email': req.new_email,
        'confirm_link': confirm_link,
        'expiry_hours': 24,
    }

    try:
        success = send_notification_email(
            to=req.new_email,
            subject='Confirm your new CampusHat email',
            template='emails/email_change_confirmation.html',
            context=context,
        )
        if success:
            logger.info('Email-change confirmation sent to %s.', req.new_email)
        else:
            logger.warning('Failed to send email-change confirmation to %s.', req.new_email)
    except Exception as exc:
        logger.error('send_email_change_confirmation error: %s', exc)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='authentication.send_email_changed_notice_to_old_address',
)
def send_email_changed_notice_to_old_address(self, old_email, new_email, user_name):
    """
    After a successful email change, notify the OLD address so the
    rightful owner can react if the change wasn't initiated by them.
    """
    from core.utils import send_notification_email

    context = {
        'user_name': user_name,
        'old_email': old_email,
        'new_email': new_email,
    }
    try:
        send_notification_email(
            to=old_email,
            subject='Your CampusHat email address was changed',
            template='emails/email_changed_notice.html',
            context=context,
        )
        logger.info('Email-changed notice sent to %s (old address).', old_email)
    except Exception as exc:
        logger.error('send_email_changed_notice error: %s', exc)
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

    # Build security flags for the notification body so admins triage faster.
    flags = []
    if getattr(verification, 'is_duplicate_document', False):
        flags.append('Duplicate document detected (same hash used by another user).')
    attempt = getattr(verification, 'attempt_number', 1) or 1
    if attempt > 1:
        flags.append(f'Re-submission: attempt #{attempt} for this verification type.')

    try:
        from django.core.mail import send_mail
        subject = f'New Verification Request: {verification.verification_type}'
        if flags:
            subject = '[FLAGGED] ' + subject
        message = (
            f'User {verification.user.full_name} ({verification.user.email}) '
            f'has submitted a {verification.verification_type} verification.\n\n'
            f'Student ID: {verification.student_id_number or "N/A"}\n'
        )
        if flags:
            message += '\nSecurity flags:\n  - ' + '\n  - '.join(flags) + '\n'
        message += '\nPlease review it in the admin panel.'

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@campushat.com'),
            recipient_list=admin_emails,
            fail_silently=True,
        )

        # 2. Platform Notification for Admins
        try:
            from apps.admin_panel.notification_utils import notify_admins
            title = 'New Student Verification'
            if flags:
                title = '[FLAGGED] ' + title
            inapp_message = f'User {verification.user.full_name} has submitted a {verification.verification_type} request.'
            if flags:
                inapp_message += ' ' + ' '.join(flags)
            notify_admins(
                notification_type='verification',
                title=title,
                message=inapp_message,
                action_url='/admin/approvals'
            )
        except Exception as e:
            logger.warning(f"Failed to send platform notification for verification: {e}")

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

        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import send_notification
            send_notification(
                user=user,
                notification_type='verification',
                title='Verification Update',
                message=f'Your {verification.verification_type} verification has been {verification.status}.',
                action_url='/account/verify'
            )
        except Exception as e:
            logger.warning(f"Failed to send verification result platform notification: {e}")

        logger.info(f'Verification result sent to {user.email}.')
    except Exception as exc:
        logger.error(f'send_verification_result error: {exc}')
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=300, name='authentication.cleanup_expired_sessions')
def cleanup_expired_sessions(self):
    """Delete expired UserSession rows. Runs daily at 3AM BD time."""
    try:
        from apps.authentication.models import UserSession
        from django.utils import timezone
        now = timezone.now()
        # Delete expired sessions
        expired = UserSession.objects.filter(expires_at__lt=now).delete()[0]
        # Delete old revoked sessions (keep 30 days for audit)
        old_revoked = UserSession.objects.filter(
            revoked=True,
            created_at__lt=now - timezone.timedelta(days=30)
        ).delete()[0]
        logger.info(f'Cleanup: {expired} expired + {old_revoked} old revoked sessions deleted')
        return {'expired': expired, 'old_revoked': old_revoked}
    except Exception as exc:
        raise self.retry(exc=exc)
