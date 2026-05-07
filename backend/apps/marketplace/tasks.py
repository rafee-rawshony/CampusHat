"""
Marketplace Celery Tasks.

Periodic tasks for auto-expiry and expiry warnings.
"""

import logging

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='marketplace.expire_marketplace_posts',
)
def expire_marketplace_posts(self):
    """
    Auto-expire active marketplace posts that have passed their expires_at.

    Schedule: every 15 minutes via Celery Beat.
    Uses select_for_update() inside atomic() for safety.
    """
    from apps.marketplace.models import MarketplaceProduct

    now = timezone.now()
    with transaction.atomic():
        expired_qs = (
            MarketplaceProduct.objects
            .select_for_update()
            .filter(
                status='active',
                expires_at__lte=now,
                is_hidden_by_user=False,
                deleted_at__isnull=True,
            )
        )
        count = expired_qs.update(status='expired', is_auto_expired=True)

    if count:
        logger.info(f'Auto-expired {count} marketplace post(s).')
    return count


@shared_task(
    bind=True,
    name='marketplace.send_expiry_warning',
)
def send_expiry_warning(self):
    """
    Send expiry warning to owners of posts expiring in 2-3 days.

    Schedule: daily at 9:00 AM Bangladesh time (UTC+6).
    """
    from apps.marketplace.models import MarketplaceProduct

    now = timezone.now()
    warn_start = now + timezone.timedelta(days=2)
    warn_end = now + timezone.timedelta(days=3)

    expiring = MarketplaceProduct.objects.filter(
        status='active',
        expires_at__range=(warn_start, warn_end),
        deleted_at__isnull=True,
    ).select_related('user')

    count = 0
    for product in expiring:
        try:
            from django.core.mail import send_mail
            send_mail(
                subject=f'Your listing "{product.title}" is expiring soon',
                message=(
                    f'Hello {product.user.full_name},\n\n'
                    f'Your marketplace listing "{product.title}" will expire '
                    f'on {product.expires_at.strftime("%B %d, %Y")}.\n\n'
                    f'Log in to CampusHat to repost or extend it.'
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@campushat.com'),
                recipient_list=[product.user.email],
                fail_silently=True,
            )
            count += 1
        except Exception as exc:
            logger.error(f'Expiry warning error for product {product.id}: {exc}')

    logger.info(f'Sent {count} expiry warning(s).')
    return count
