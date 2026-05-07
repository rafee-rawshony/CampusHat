"""
CampusHat Production Settings.

Extends base settings with production-hardened overrides.
- DEBUG disabled
- SSL/HSTS security
- AWS S3 file storage
- Sentry error tracking
- Redis cache backend
"""

try:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    HAS_SENTRY = True
except ImportError:
    HAS_SENTRY = False

from .base import *  # noqa: F401, F403

# =============================================================================
# DEBUG
# =============================================================================

DEBUG = False

ALLOWED_HOSTS = list(dict.fromkeys([
    *ALLOWED_HOSTS,  # noqa: F405
    '178.128.122.157',
    'campushat.com',
    'www.campushat.com',
]))

# =============================================================================
# SECURITY
# =============================================================================

# Set to False during initial deployment (before SSL is set up).
# After Certbot issues the cert and Nginx handles HTTPS, set back to True.
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# =============================================================================
# FILE STORAGE — AWS S3 or DigitalOcean Spaces (S3-compatible)
# =============================================================================
# Works with both AWS S3 and DigitalOcean Spaces.
# For DigitalOcean Spaces, set AWS_S3_ENDPOINT_URL in your .env:
#   AWS_S3_ENDPOINT_URL=https://sgp1.digitaloceanspaces.com   (use your region)
#   AWS_S3_CUSTOM_DOMAIN=your-space-name.sgp1.digitaloceanspaces.com

AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='campushat-media')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='ap-southeast-1')
AWS_S3_CUSTOM_DOMAIN = config('AWS_S3_CUSTOM_DOMAIN', default='')


def _is_real_aws_value(value: str) -> bool:
    value = str(value or '').strip()
    if not value:
        return False
    lowered = value.lower()
    if lowered.startswith('your-'):
        return False
    if lowered in {'changeme', 'change-me', 'placeholder', 'example', 'example-value'}:
        return False
    return True

# If AWS/S3 is not configured, fall back to local filesystem storage so the
# prod Docker stack can boot cleanly on a dev machine or VPS without object storage.
USE_S3_STORAGE = all([
    _is_real_aws_value(AWS_ACCESS_KEY_ID),
    _is_real_aws_value(AWS_SECRET_ACCESS_KEY),
    _is_real_aws_value(AWS_STORAGE_BUCKET_NAME),
])

if USE_S3_STORAGE:
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        },
        'staticfiles': {
            'BACKEND': 'storages.backends.s3boto3.S3StaticStorage',
        },
    }
    # Empty endpoint causes boto3 to raise "Invalid endpoint" during collectstatic.
    # Keep it as None unless a real S3-compatible endpoint is configured.
    AWS_S3_ENDPOINT_URL = config('AWS_S3_ENDPOINT_URL', default='').strip() or None
else:
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
    AWS_S3_ENDPOINT_URL = None

# =============================================================================
# CACHES — Redis
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://redis:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# =============================================================================
# SENTRY ERROR TRACKING
# =============================================================================

SENTRY_DSN = config('SENTRY_DSN', default='')

if HAS_SENTRY and SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment='production',
    )

# =============================================================================
# LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
