"""Admin panel Celery tasks."""

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='admin_panel.broadcast_notification')
def broadcast_notification(title, message, target_role='', action_url=''):
    """
    Broadcast a notification to all users matching target_role.
    Bulk creates in batches of 500.
    """
    from apps.admin_panel.models import Notification
    from apps.authentication.models import User

    users = User.objects.filter(is_active=True)
    if target_role:
        users = users.filter(role=target_role)

    user_ids = list(users.values_list('id', flat=True))
    total = len(user_ids)

    batch_size = 500
    created = 0
    for i in range(0, total, batch_size):
        batch = user_ids[i:i + batch_size]
        notifications = [
            Notification(
                user_id=uid,
                notification_type='system',
                title=title,
                message=message,
                action_url=action_url or None,
            )
            for uid in batch
        ]
        Notification.objects.bulk_create(notifications)
        created += len(notifications)

    logger.info(f'Broadcast notification sent to {created} users: {title}')
