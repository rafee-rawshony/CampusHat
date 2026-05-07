"""
ASGI config for CampusHat project.

Supports both HTTP and WebSocket protocols via Django Channels.
WebSocket connections are routed to marketplace chat and notification consumers.
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

django_asgi_app = get_asgi_application()

from apps.marketplace.routing import websocket_urlpatterns as marketplace_ws  # noqa: E402
from apps.admin_panel.routing import websocket_urlpatterns as notification_ws  # noqa: E402

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(marketplace_ws + notification_ws)
        )
    ),
})

