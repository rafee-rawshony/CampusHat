"""
Root conftest.py — shared fixtures and test configuration.

Disables Django Debug Toolbar during tests to prevent template
rendering crashes (NoReverseMatch for djdt URLs).
"""

import django
from django.conf import settings


def pytest_configure(config):
    """Remove debug toolbar from INSTALLED_APPS and MIDDLEWARE during tests."""
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        settings.INSTALLED_APPS = [
            app for app in settings.INSTALLED_APPS
            if app != 'debug_toolbar'
        ]
    settings.MIDDLEWARE = [
        mw for mw in settings.MIDDLEWARE
        if 'debug_toolbar' not in mw
    ]
    # Use in-memory local cache for tests
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
    # Use console email backend
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

    # Force S3 disabled during tests by clearing dummy ENV keys
    settings.AWS_ACCESS_KEY_ID = ''


