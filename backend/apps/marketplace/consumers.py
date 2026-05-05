"""
WebSocket consumer for real-time marketplace chat.

Handles connect/disconnect, sending messages, and marking messages as read
via WebSocket instead of polling REST endpoints.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from .models import MarketplaceChat, MarketplaceMessage


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for a single marketplace chat thread.

    URL: ws://<host>/ws/marketplace/chat/<chat_id>/
    Query param: ?token=<jwt_access_token>

    Group name: marketplace_chat_<chat_id>
    """

    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.group_name = f'marketplace_chat_{self.chat_id}'
        self.user = None

        # Extract JWT access token from ?token= query param (frontend sends it this way)
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=', 1)[1]
                break

        if not token:
            await self.close(code=4001)
            return

        self.user = await self._get_user_from_token(token)
        if not self.user:
            await self.close(code=4001)
            return

        # Verify user is a participant in this chat
        is_participant = await self._is_chat_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        """Handle incoming WebSocket messages from client."""
        msg_type = content.get('type')

        if msg_type == 'chat.message':
            await self._handle_send_message(content)
        elif msg_type == 'chat.mark_read':
            await self._handle_mark_read()
        elif msg_type == 'chat.typing':
            await self._handle_typing()

    # --- Handlers ---

    async def _handle_send_message(self, content):
        text = content.get('content', '').strip()
        message_type = content.get('message_type', 'text')

        if not text:
            await self.send_json({'type': 'error', 'message': 'Empty message.'})
            return

        chat_blocked = await self._is_chat_blocked()
        if chat_blocked:
            await self.send_json({'type': 'error', 'message': 'Chat is blocked.'})
            return

        msg_data = await self._save_message(text, message_type)

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'data': msg_data,
            },
        )

    async def _handle_mark_read(self):
        count = await self._mark_messages_read()
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_read_receipt',
                'data': {
                    'user_id': str(self.user.id),
                    'count': count,
                },
            },
        )

    async def _handle_typing(self):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_typing',
                'data': {
                    'user_id': str(self.user.id),
                },
            },
        )

    # --- Group message handlers (sent to all clients in the group) ---

    async def chat_message(self, event):
        await self.send_json({'type': 'chat.message', 'data': event['data']})

    async def chat_read_receipt(self, event):
        await self.send_json({'type': 'chat.read_receipt', 'data': event['data']})

    async def chat_typing(self, event):
        if event['data']['user_id'] != str(self.user.id):
            await self.send_json({'type': 'chat.typing', 'data': event['data']})

    # --- Database helpers ---

    @database_sync_to_async
    def _get_user_from_token(self, token_str):
        """Validate JWT access token and return the user, or None on failure."""
        from django.contrib.auth import get_user_model
        from rest_framework_simplejwt.tokens import AccessToken
        User = get_user_model()
        try:
            access_token = AccessToken(token_str)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id, is_active=True)
        except Exception:
            return None

    @database_sync_to_async
    def _is_chat_participant(self):
        try:
            chat = MarketplaceChat.objects.get(
                pk=self.chat_id, deleted_at__isnull=True,
            )
            return self.user in (chat.buyer, chat.seller)
        except MarketplaceChat.DoesNotExist:
            return False

    @database_sync_to_async
    def _is_chat_blocked(self):
        try:
            return MarketplaceChat.objects.get(pk=self.chat_id).is_blocked
        except MarketplaceChat.DoesNotExist:
            return True

    @database_sync_to_async
    def _save_message(self, text, message_type):
        chat = MarketplaceChat.objects.get(pk=self.chat_id)
        msg = MarketplaceMessage.objects.create(
            chat=chat,
            sender=self.user,
            message_type=message_type,
            content=text,
        )
        chat.last_message_at = timezone.now()
        chat.save(update_fields=['last_message_at'])

        return {
            'id': str(msg.id),
            'chat': str(chat.id),
            'sender': {
                'id': str(self.user.id),
                'full_name': self.user.full_name,
                'profile_picture': self.user.profile_picture or None,
            },
            'message_type': msg.message_type,
            'content': msg.content,
            'is_read': False,
            'created_at': msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def _mark_messages_read(self):
        try:
            chat = MarketplaceChat.objects.get(pk=self.chat_id)
            return chat.messages.filter(
                is_read=False,
            ).exclude(sender=self.user).update(is_read=True)
        except MarketplaceChat.DoesNotExist:
            return 0
