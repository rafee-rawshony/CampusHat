"""Refund Celery tasks."""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='refunds.notify_refund_processed')
def notify_refund_processed(refund_id):
    from apps.refunds.models import Refund
    from core.utils import send_notification_email
    try:
        refund = Refund.objects.select_related('order', 'requested_by').get(id=refund_id)
        send_notification_email(
            to=refund.requested_by.email,
            subject=f'Refund Processed — {refund.order.order_number}',
            template='emails/refund_processed.html',
            context={'refund': refund, 'order': refund.order},
        )
    except Exception as e:
        logger.warning(f'Refund notification failed: {e}')
