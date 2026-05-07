"""
Universities App Config.
"""

from django.apps import AppConfig


class UniversitiesConfig(AppConfig):
    """Configuration for the universities app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.universities'
    verbose_name = 'Universities'
