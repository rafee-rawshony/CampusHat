"""
Celery Configuration for CampusHat.

This module defines the Celery application instance and its configuration.
Celery is used for asynchronous task processing (email sending, image
processing, order status updates, etc.) and periodic tasks via Beat.
"""

import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('campushat')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps.
app.autodiscover_tasks()

# =============================================================================
# CELERY BEAT SCHEDULE
# Periodic tasks will be registered here in later phases.
# =============================================================================

app.conf.beat_schedule = {
    # Example (will be added in Phase 05+):
    # 'check-order-timeouts': {
    #     'task': 'apps.orders.tasks.check_order_timeouts',
    #     'schedule': crontab(minute='*/15'),
    # },
    # 'send-daily-digest': {
    #     'task': 'apps.notifications.tasks.send_daily_digest',
    #     'schedule': crontab(hour=8, minute=0),
    # },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f'Request: {self.request!r}')
