"""
WebSocket consumer for real-time marketplace chat.

Handles connect/disconnect, sending messages, and marking messages as read
via WebSocket instead of polling REST endpoints.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from .interaction_serializers import SendMessageSerializer
from .models import MarketplaceChat, MarketplaceMessage


def _extract_query_token(scope):
    """Return the JWT access token from ?token=... if present."""
    query_string = scope.get('query_string', b'').decode('utf-8')
    for param in query_string.split('&'):
        if param.startswith('token='):
            return param.split('=', 1)[1]
    return None


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

        token = _extract_query_token(self.scope)

        if not token:
            await self.close(code=4001)
            return

        self.user = await self._get_user_from_token(token)
        if not self.user:
            await self.close(code=4001)
            return

        is_verified = await self._is_verified_for_marketplace()
        if not is_verified:
            await self.close(code=4003)
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

        serializer_errors = await self._validate_message_payload(text, message_type)
        if serializer_errors:
            await self.send_json({'type': 'error', 'message': serializer_errors})
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

        await self._broadcast_thread_update(msg_data)

        # Send platform-wide notification to the recipient
        try:
            recipient_id = await self._get_recipient_id()
            if recipient_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                recipient = await database_sync_to_async(User.objects.get)(id=recipient_id)
                
                from apps.admin_panel.notification_utils import send_notification
                await database_sync_to_async(send_notification)(
                    user=recipient,
                    notification_type='marketplace',
                    title=f'New message from {self.user.full_name}',
                    message=text[:100] + ('...' if len(text) > 100 else ''),
                    action_url=f'/marketplace/chat/{self.chat_id}'
                )
        except Exception as e:
            logger.warning(f"Failed to send chat notification: {e}")

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

    async def _broadcast_thread_update(self, msg_data):
        chat_update = {
            'chat_id': str(self.chat_id),
            'last_message': msg_data,
            'last_message_at': msg_data['created_at'],
        }
        participant_ids = await self._get_participant_ids()
        for user_id in participant_ids:
            await self.channel_layer.group_send(
                f'marketplace_user_{user_id}',
                {
                    'type': 'chat_thread_update',
                    'data': chat_update,
                },
            )

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
    def _is_verified_for_marketplace(self):
        role = getattr(self.user, 'role', None)
        if role in ('admin', 'moderator', 'seller_mod', 'marketplace_mod'):
            return True

        from apps.authentication.models import UserVerification
        return UserVerification.objects.filter(
            user=self.user,
            verification_type__in=['student_id', 'faculty_id'],
            status='approved',
        ).exists()

    @database_sync_to_async
    def _is_chat_participant(self):
        try:
            chat = MarketplaceChat.objects.get(
                pk=self.chat_id, is_active=True, deleted_at__isnull=True,
            )
            return self.user in (chat.buyer, chat.seller)
        except MarketplaceChat.DoesNotExist:
            return False

    @database_sync_to_async
    def _is_chat_blocked(self):
        try:
            return MarketplaceChat.objects.get(
                pk=self.chat_id,
                is_active=True,
            ).is_blocked
        except MarketplaceChat.DoesNotExist:
            return True

    @database_sync_to_async
    def _validate_message_payload(self, text, message_type):
        serializer = SendMessageSerializer(data={
            'content': text,
            'message_type': message_type,
        })
        if serializer.is_valid():
            return None
        return {
            field: [str(message) for message in messages]
            for field, messages in serializer.errors.items()
        }

    @database_sync_to_async
    def _save_message(self, text, message_type):
        serializer = SendMessageSerializer(data={
            'content': text,
            'message_type': message_type,
        })
        serializer.is_valid(raise_exception=True)
        chat = MarketplaceChat.objects.get(pk=self.chat_id, is_active=True)
        msg = MarketplaceMessage.objects.create(
            chat=chat,
            sender=self.user,
            message_type=serializer.validated_data['message_type'],
            content=serializer.validated_data['content'],
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
            chat = MarketplaceChat.objects.get(pk=self.chat_id, is_active=True)
            return chat.messages.filter(
                is_read=False,
            ).exclude(sender=self.user).update(is_read=True)
        except MarketplaceChat.DoesNotExist:
            return 0

    @database_sync_to_async
    def _get_participant_ids(self):
        try:
            chat = MarketplaceChat.objects.get(pk=self.chat_id, is_active=True)
            return [str(chat.buyer_id), str(chat.seller_id)]
        except MarketplaceChat.DoesNotExist:
            return []

    @database_sync_to_async
    def _get_recipient_id(self):
        try:
            chat = MarketplaceChat.objects.get(pk=self.chat_id, is_active=True)
            return str(chat.seller_id) if self.user.id == chat.buyer_id else str(chat.buyer_id)
        except MarketplaceChat.DoesNotExist:
            return None


class MarketplaceInboxConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for marketplace conversation list updates.

    URL: ws://<host>/ws/marketplace/chats/?token=<jwt_access_token>
    Group name: marketplace_user_<user_id>
    """

    async def connect(self):
        token = _extract_query_token(self.scope)
        if not token:
            await self.close(code=4001)
            return

        self.user = await self._get_user_from_token(token)
        if not self.user:
            await self.close(code=4001)
            return

        is_verified = await self._is_verified_for_marketplace()
        if not is_verified:
            await self.close(code=4003)
            return

        self.group_name = f'marketplace_user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def chat_thread_update(self, event):
        await self.send_json({'type': 'chat.thread_update', 'data': event['data']})

    @database_sync_to_async
    def _get_user_from_token(self, token_str):
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
    def _is_verified_for_marketplace(self):
        role = getattr(self.user, 'role', None)
        if role in ('admin', 'moderator', 'seller_mod', 'marketplace_mod'):
            return True

        from apps.authentication.models import UserVerification
        return UserVerification.objects.filter(
            user=self.user,
            verification_type__in=['student_id', 'faculty_id'],
            status='approved',
        ).exists()
