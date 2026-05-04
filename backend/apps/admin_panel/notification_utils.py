"""
Notification Utility — Send notifications + push to WebSocket.

Usage:
    from apps.admin_panel.notification_utils import send_notification

    send_notification(
        user=order.buyer,
        notification_type='order',
        title='Order Shipped',
        message=f'Your order #{order.order_number} has been shipped!',
        action_url=f'/orders/{order.id}',
    )
"""

import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification

logger = logging.getLogger(__name__)


def send_notification(user, notification_type, title, message, action_url=None):
    """
    Create a notification in the database and push it via WebSocket.

    Args:
        user: The user to notify.
        notification_type: One of: order, refund, verification, marketplace, seller, delivery, payout, system.
        title: Short notification title.
        message: Notification body text.
        action_url: Optional frontend URL to link to.
    """
    # 1. Create DB notification
    notification = Notification.create_notification(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
    )

    # 2. Push via WebSocket (best-effort)
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f'notifications_{user.id}'
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification.message',
                    'notification': {
                        'id': str(notification.id),
                        'notification_type': notification_type,
                        'title': title,
                        'message': message,
                        'action_url': action_url,
                        'is_read': False,
                        'created_at': notification.created_at.isoformat(),
                    },
                },
            )
    except Exception as e:
        logger.warning(f'Failed to push WebSocket notification: {e}')

    return notification
