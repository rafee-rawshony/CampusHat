"""WebSocket consumer for real-time user notifications."""

import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer that sends real-time notifications to authenticated users.

    Each user is added to a personal channel group: `notifications_{user_id}`.
    When a notification is created via the helper function `send_realtime_notification`,
    it pushes the notification payload to this consumer.
    """

    async def connect(self):
        """Authenticate the user via JWT token in query string and join their notification group."""
        self.user = None
        self.group_name = None

        # Extract token from query string: ?token=<jwt>
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=', 1)[1]
                break

        if not token:
            await self.close(code=4001)
            return

        try:
            user = await self._get_user_from_token(token)
            if user is None:
                await self.close(code=4001)
                return

            self.user = user
            self.group_name = f'notifications_{user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info(f'[WS Notifications] User {user.email} connected')
        except Exception as e:
            logger.error(f'[WS Notifications] Auth error: {e}')
            await self.close(code=4001)

    async def disconnect(self, close_code):
        """Leave the notification group on disconnect."""
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info(f'[WS Notifications] User disconnected from {self.group_name}')

    async def receive_json(self, content, **kwargs):
        """No client-to-server messages expected for notifications."""
        pass

    async def notification_message(self, event):
        """Handler for notification.message type sent via channel layer."""
        await self.send_json({
            'type': 'notification',
            'notification': event.get('notification', {}),
        })

    @database_sync_to_async
    def _get_user_from_token(self, token_str):
        """Validate JWT token and return the user."""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            access_token = AccessToken(token_str)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id, is_active=True)
        except Exception:
            return None
