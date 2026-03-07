"""Sellers App Config."""

from django.apps import AppConfig


class SellersConfig(AppConfig):
    """Configuration for the sellers app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sellers'
    verbose_name = 'Sellers'

    def ready(self):
        import apps.sellers.signals  # noqa: F401
