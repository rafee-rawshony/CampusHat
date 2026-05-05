"""
CampusHat Development Settings.

Extends base settings with local development overrides.
- DEBUG enabled
- Local file storage (no S3)
- django-debug-toolbar
- Console email backend
"""

from .base import *  # noqa: F401, F403

# =============================================================================
# DEBUG
# =============================================================================

DEBUG = True

ALLOWED_HOSTS = ['*']

# =============================================================================
# INSTALLED APPS — Development extras
# =============================================================================

# debug_toolbar is optional — only loaded if the package is installed.
# This allows the same development settings to be used in the production Docker image
# (which only installs production.txt requirements) for local "prod-mode" testing.
try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS += ['debug_toolbar']
    _HAS_DEBUG_TOOLBAR = True
except ImportError:
    _HAS_DEBUG_TOOLBAR = False

# =============================================================================
# MIDDLEWARE — Debug toolbar
# =============================================================================

# Insert DebugToolbar AFTER GZipMiddleware — only if the package is installed.
if _HAS_DEBUG_TOOLBAR:
    try:
        _gzip_idx = MIDDLEWARE.index('django.middleware.gzip.GZipMiddleware')
        MIDDLEWARE.insert(_gzip_idx + 1, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    except ValueError:
        MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

# =============================================================================
# DEBUG TOOLBAR
# =============================================================================

INTERNAL_IPS = ['127.0.0.1', 'localhost']
DEBUG_TOOLBAR_CONFIG = {
    'INTERCEPT_REDIRECTS': False,
    'DISABLE_PANELS': ['debug_toolbar.panels.redirects.RedirectsPanel'],
}

# =============================================================================
# DATABASE — Use SQLite fallback for quick local dev (override with .env)
# =============================================================================

# PostgreSQL is default from base.py; override here only if needed.

# =============================================================================
# EMAIL — Always use real SMTP, even in development.
#
# Default target: the Mailpit container shipped with docker-compose. Emails get
# captured there and shown in a web inbox at http://localhost:8025/ — the full
# verification flow then matches production exactly (no console-backend hack).
#
# To use a real provider locally (Gmail, SendGrid, Resend, Mailgun, SES, ...)
# set EMAIL_HOST/PORT/USER/PASSWORD in backend/.env — those values override the
# Mailpit defaults below.
# =============================================================================

from decouple import config as _env_config  # local import to avoid global side effects

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Treat empty/whitespace env values as "not set" so dev defaults kick in. This
# matters because docker-compose env_file passes blank values as "" rather
# than unsetting them, which breaks `cast=int` etc.
def _env_or_default(key, default, cast=str):
    raw = _env_config(key, default=None)
    if raw is None or str(raw).strip() == '':
        return default
    if cast is bool:
        return str(raw).strip().lower() in ('1', 'true', 'yes', 'on')
    return cast(raw)

EMAIL_HOST = _env_or_default('EMAIL_HOST', 'mailpit')
EMAIL_PORT = _env_or_default('EMAIL_PORT', 1025, cast=int)
EMAIL_USE_TLS = _env_or_default('EMAIL_USE_TLS', False, cast=bool)
EMAIL_USE_SSL = _env_or_default('EMAIL_USE_SSL', False, cast=bool)
EMAIL_HOST_USER = _env_or_default('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = _env_or_default('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = _env_or_default(
    'DEFAULT_FROM_EMAIL', 'CampusHat <noreply@campushat.local>',
)

# AUTO_VERIFY_EMAIL_ON_REGISTER — explicit opt-in escape hatch for automated
# tests / CI seeding. NEVER set this to True in production. Default off so the
# verification flow runs through real email exactly as in production.
AUTO_VERIFY_EMAIL_ON_REGISTER = _env_or_default(
    'AUTO_VERIFY_EMAIL_ON_REGISTER', False, cast=bool,
)

# =============================================================================
# FILE STORAGE — Local filesystem (no S3 in development)
# =============================================================================

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}

# =============================================================================
# CACHES — Local memory cache for development
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# =============================================================================
# REST FRAMEWORK — Allow browsable API in development
# =============================================================================

REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
    'core.renderers.CampusHatJSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)

# =============================================================================
# CORS — Allow all origins in development
# =============================================================================

CORS_ALLOW_ALL_ORIGINS = True

# =============================================================================
# THROTTLING — Relaxed in dev so hot-reload + manual testing don't get blocked.
# Production keeps the strict rates from base.py.
# =============================================================================

REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    **REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {}),
    'anon': '10000/min',
    'user': '10000/min',
    'login': '1000/min',
    'register': '1000/hour',
    'otp_send': '1000/min',
    'otp_verify': '1000/min',
}

# =============================================================================
# LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
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
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
