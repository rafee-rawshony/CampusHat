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

INSTALLED_APPS += [
    'debug_toolbar',
]

# =============================================================================
# MIDDLEWARE — Debug toolbar
# =============================================================================

MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

# =============================================================================
# DEBUG TOOLBAR
# =============================================================================

INTERNAL_IPS = ['127.0.0.1', 'localhost']

DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
    'INTERCEPT_REDIRECTS': False,
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
