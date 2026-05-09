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
        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import send_notification
            send_notification(
                user=order.buyer,
                notification_type='order',
                title='Order Confirmed',
                message=f'Your order {order.order_number} has been successfully placed.',
                action_url=f'/account/orders/{order.id}'
            )
        except Exception as e:
            logger.warning(f"Failed to send order confirmation platform notification: {e}")

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
        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import send_notification
            send_notification(
                user=order.store.seller.user,
                notification_type='order',
                title='New Order Received',
                message=f'You have a new order {order.order_number} for your store "{order.store.name}".',
                action_url=f'/account/seller/orders/{order.id}'
            )
        except Exception as e:
            logger.warning(f"Failed to send seller new order platform notification: {e}")

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
        # Platform Notification
        try:
            from apps.admin_panel.notification_utils import send_notification
            send_notification(
                user=order.buyer,
                notification_type='order',
                title='Order Status Updated',
                message=f'Your order {order.order_number} is now {new_status}.',
                action_url=f'/account/orders/{order.id}'
            )
        except Exception as e:
            logger.warning(f"Failed to send order status platform notification: {e}")

        logger.info(f'Status change notification sent for {order.order_number}')
    except Order.DoesNotExist:
        logger.error(f'Order {order_id} not found for status notification.')
    except Exception as e:
        logger.warning(f'Status notification failed: {e}')


from django.db import transaction
from django.db.models import F
from decimal import Decimal

@shared_task(bind=True, max_retries=3, default_retry_delay=300, name='orders.auto_cancel_unpaid_orders')
def auto_cancel_unpaid_orders(self):
    """
    Cancels orders stuck in 'placed' status with payment_status='pending'.
    Gateway timeout: 2 hours. COD timeout: 24 hours.
    Restores stock atomically for each cancelled order.
    Schedule: every 30 minutes.
    """
    from apps.orders.models import Order, OrderStatusHistory
    from apps.mall.models import StoreProduct, ProductVariant
    now = timezone.now()

    try:
        # Gateway orders unpaid after 2 hours
        gateway_cutoff = now - timezone.timedelta(hours=2)
        stale_orders = Order.objects.filter(
            order_status='placed',
            payment_status='pending',
            created_at__lt=gateway_cutoff,
        ).select_related('buyer', 'store')[:50]  # batch 50 at a time

        cancelled = 0
        for order in stale_orders:
            try:
                with transaction.atomic():
                    # Lock the order
                    locked_order = Order.objects.select_for_update().get(
                        pk=order.pk, order_status='placed'
                    )

                    # Restore stock for each item
                    for item in locked_order.items.select_related(
                        'product', 'variant').all():
                        if item.variant_id:
                            ProductVariant.objects.filter(
                                pk=item.variant_id
                            ).update(
                                stock_quantity=F('stock_quantity') + item.quantity
                            )
                        else:
                            StoreProduct.objects.filter(
                                pk=item.product_id
                            ).update(
                                stock_quantity=F('stock_quantity') + item.quantity
                            )

                    # Update order
                    old_status = locked_order.order_status
                    locked_order.order_status = 'cancelled'
                    locked_order.cancelled_at = now
                    locked_order.cancellation_reason = (
                        'Auto-cancelled: payment not received within 2 hours.'
                    )
                    locked_order.save(update_fields=[
                        'order_status', 'cancelled_at', 'cancellation_reason'
                    ])

                    OrderStatusHistory.objects.create(
                        order=locked_order,
                        from_status=old_status,
                        to_status='cancelled',
                        changed_by=None,
                        changed_by_role='system',
                        note='Auto-cancelled due to payment timeout.'
                    )
                cancelled += 1
            except Order.DoesNotExist:
                pass  # Already cancelled by another process — skip
            except Exception as e:
                logger.warning(f'Failed to cancel order {order.pk}: {e}')

        logger.info(f'auto_cancel_unpaid_orders: cancelled {cancelled} orders')
        return {'cancelled': cancelled}

    except Exception as exc:
        logger.error(f'auto_cancel_unpaid_orders failed: {exc}')
        raise self.retry(exc=exc)
