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

from celery.schedules import crontab

app.conf.beat_schedule = {
    # Phase 04: Marketplace
    'expire-marketplace-posts': {
        'task': 'marketplace.expire_marketplace_posts',
        'schedule': crontab(minute='*/15'),
    },
    'send-expiry-warnings': {
        'task': 'marketplace.send_expiry_warnings',
        'schedule': crontab(hour=3, minute=0),  # 9AM UTC+6
    },
    # Phase 08: Coupons
    'expire-coupons': {
        'task': 'coupons.expire_coupons',
        'schedule': crontab(minute=0),  # every hour
    },
    'end-flash-sales': {
        'task': 'coupons.end_flash_sales',
        'schedule': crontab(minute='*/5'),  # every 5 min
    },
    # Phase 10: Analytics
    'update-seller-dashboard-stats': {
        'task': 'analytics.update_seller_dashboard_stats',
        'schedule': crontab(minute=0, hour='*/6'),  # every 6 hours
    },
    'cleanup-old-analytics': {
        'task': 'analytics.cleanup_old_analytics',
        'schedule': crontab(
            minute=0, hour=20, day_of_week='sunday',  # Sunday 2AM UTC+6
        ),
    },
    'cleanup-expired-sessions': {
        'task': 'authentication.cleanup_expired_sessions',
        'schedule': crontab(hour=21, minute=0),  # 3:00 AM Bangladesh (UTC+6)
    },
}



@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f'Request: {self.request!r}')
