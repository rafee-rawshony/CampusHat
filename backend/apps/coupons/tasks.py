"""Coupon Celery tasks — expire coupons and end flash sales."""

import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='coupons.expire_coupons')
def expire_coupons():
    """Hourly — deactivate expired coupons."""
    from apps.coupons.models import Coupon

    count = Coupon.objects.filter(
        is_active=True, expires_at__lt=timezone.now(),
    ).update(is_active=False)
    if count:
        logger.info(f'Expired {count} coupons.')


@shared_task(name='coupons.end_flash_sales')
def end_flash_sales():
    """Every 5 min — deactivate ended flash sales."""
    from apps.coupons.models import FlashSale
    from django.db import transaction

    with transaction.atomic():
        sales = FlashSale.objects.select_for_update().filter(
            is_active=True, ends_at__lt=timezone.now(),
        )
        count = sales.update(is_active=False)
    if count:
        logger.info(f'Ended {count} flash sales.')
