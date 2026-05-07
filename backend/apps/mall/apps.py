"""Mall App Config."""

from django.apps import AppConfig


class MallConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.mall'
    verbose_name = 'CampusHat Mall'

    def ready(self):
        import apps.mall.signals  # noqa: F401
