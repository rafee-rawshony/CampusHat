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
# EMAIL — Console backend for development
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

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
