"""
Order Celery Tasks.

Async tasks for invoice generation, order notifications, and status change emails.
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='orders.generate_invoice')
def generate_invoice_task(order_id):
    """Create Invoice record for a completed order."""
    from apps.orders.models import Invoice, Order
    from core.utils import generate_invoice_number

    try:
        order = Order.objects.get(id=order_id)

        if hasattr(order, 'invoice'):
            logger.info(f'Invoice already exists for order {order.order_number}')
            return

        Invoice.objects.create(
            order=order,
            invoice_number=generate_invoice_number(),
            subtotal=order.subtotal,
            tax_amount=0,
            total_amount=order.total_amount,
            issued_at=timezone.now(),
        )
        logger.info(f'Invoice created for order {order.order_number}')

        # TODO: Generate PDF and upload to S3, then update pdf_url
    except Order.DoesNotExist:
        logger.error(f'Order {order_id} not found for invoice generation.')
    except Exception as e:
        logger.error(f'Invoice generation failed for order {order_id}: {e}')


@shared_task(name='orders.send_order_confirmation')
def send_order_confirmation(order_id):
    """Send order confirmation email to the buyer."""
    from apps.orders.models import Order
    from core.utils import send_notification_email

    try:
        order = Order.objects.select_related('buyer', 'store').get(id=order_id)
        send_notification_email(
            to=order.buyer.email,
            subject=f'Order Confirmed — {order.order_number}',
            template='emails/order_confirmation.html',
            context={
                'order': order,
                'user': order.buyer,
            },
        )
        logger.info(f'Order confirmation sent for {order.order_number}')
    except Order.DoesNotExist:
        logger.error(f'Order {order_id} not found for confirmation email.')
    except Exception as e:
        logger.warning(f'Order confirmation email failed: {e}')


@shared_task(name='orders.notify_seller_new_order')
def notify_seller_new_order(order_id):
    """Notify seller about a new incoming order."""
    from apps.orders.models import Order
    from core.utils import send_notification_email

    try:
        order = Order.objects.select_related(
            'store', 'store__seller', 'store__seller__user',
        ).get(id=order_id)

        seller_email = order.store.seller.user.email
        send_notification_email(
            to=seller_email,
            subject=f'New Order Received — {order.order_number}',
            template='emails/seller_new_order.html',
            context={
                'order': order,
                'store': order.store,
            },
        )
        logger.info(f'Seller notified for order {order.order_number}')
    except Order.DoesNotExist:
        logger.error(f'Order {order_id} not found for seller notification.')
    except Exception as e:
        logger.warning(f'Seller notification failed: {e}')


@shared_task(name='orders.notify_order_status_change')
def notify_order_status_change(order_id, new_status):
    """Notify buyer of order status changes."""
    from apps.orders.models import Order
    from core.utils import send_notification_email

    try:
        order = Order.objects.select_related('buyer').get(id=order_id)
        send_notification_email(
            to=order.buyer.email,
            subject=f'Order Update — {order.order_number} is now {new_status}',
            template='emails/order_status_update.html',
            context={
                'order': order,
                'new_status': new_status,
            },
        )
        logger.info(f'Status change notification sent for {order.order_number}')
    except Order.DoesNotExist:
        logger.error(f'Order {order_id} not found for status notification.')
    except Exception as e:
        logger.warning(f'Status notification failed: {e}')
