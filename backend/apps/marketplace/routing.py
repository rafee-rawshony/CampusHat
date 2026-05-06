"""WebSocket URL routing for marketplace chat."""

from django.urls import re_path

from .consumers import ChatConsumer, MarketplaceInboxConsumer

websocket_urlpatterns = [
    re_path(r'ws/marketplace/chats/$', MarketplaceInboxConsumer.as_asgi()),
    re_path(r'ws/marketplace/chat/(?P<chat_id>[0-9a-f-]+)/$', ChatConsumer.as_asgi()),
]
