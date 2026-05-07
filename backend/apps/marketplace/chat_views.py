"""
Chat Views for the Marketplace.

Start a chat, list own chats, read messages, send message, block, mark-read.
"""

from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsVerifiedForMarketplace

from .interaction_serializers import (
    MarketplaceChatSerializer,
    MarketplaceMessageSerializer,
    SendMessageSerializer,
    StartChatSerializer,
)
from .models import MarketplaceChat, MarketplaceMessage, MarketplaceProduct


def _broadcast_chat_thread_update(chat):
    """Notify both chat participants that their inbox should refresh."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    payload = {
        'type': 'chat.thread_update',
        'data': {
            'chat_id': str(chat.id),
            'product_id': str(chat.product_id),
            'last_message_at': chat.last_message_at.isoformat() if chat.last_message_at else None,
        },
    }
    for user_id in (chat.buyer_id, chat.seller_id):
        async_to_sync(channel_layer.group_send)(
            f'marketplace_user_{user_id}',
            {
                'type': 'chat_thread_update',
                'data': payload['data'],
            },
        )


class StartChatView(APIView):
    """
    POST /api/v1/marketplace/chats/start/

    Start a chat with a product's seller, or return existing thread.
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def post(self, request):
        serializer = StartChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data['product_id']

        try:
            product = MarketplaceProduct.objects.get(
                pk=product_id,
                status='active',
                is_hidden_by_user=False,
                expires_at__gt=timezone.now(),
                deleted_at__isnull=True,
            )
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Listing is not available for chat.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if product.user == request.user:
            return Response({
                'success': False,
                'message': 'You cannot chat with yourself.',
                'code': 'SELF_CHAT',
            }, status=status.HTTP_400_BAD_REQUEST)

        chat, created = MarketplaceChat.objects.get_or_create(
            product=product,
            buyer=request.user,
            defaults={'seller': product.user},
        )
        if not created and not chat.is_active:
            chat.is_active = True
            chat.is_blocked = False
            chat.save(update_fields=['is_active', 'is_blocked'])

        output = MarketplaceChatSerializer(chat, context={'request': request}).data
        return Response({
            'success': True,
            'message': 'Chat started.' if created else 'Existing chat found.',
            'data': output,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class MyChatListView(APIView):
    """
    GET /api/v1/marketplace/chats/

    List all chat threads the user is part of.
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def get(self, request):
        from django.db.models import Q
        chats = (
            MarketplaceChat.objects
            .filter(
                Q(buyer=request.user) | Q(seller=request.user),
                is_active=True,
                deleted_at__isnull=True,
            )
            .select_related('product', 'buyer', 'seller')
            .order_by('-last_message_at')
        )
        serializer = MarketplaceChatSerializer(
            chats, many=True, context={'request': request},
        )
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class ChatDetailView(APIView):
    """
    GET /api/v1/marketplace/chats/{id}/

    Retrieve a single chat thread with other_user and listing info.
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def get(self, request, pk):
        try:
            chat = MarketplaceChat.objects.select_related(
                'product', 'buyer', 'seller',
            ).get(pk=pk, is_active=True, deleted_at__isnull=True)
        except MarketplaceChat.DoesNotExist:
            return Response({
                'success': False, 'message': 'Chat not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user not in (chat.buyer, chat.seller):
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = MarketplaceChatSerializer(chat, context={'request': request})
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class ChatMessagesView(APIView):
    """
    GET /api/v1/marketplace/chats/{id}/messages/

    Paginated messages for a chat thread.
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def get(self, request, pk):
        try:
            chat = MarketplaceChat.objects.get(pk=pk, is_active=True, deleted_at__isnull=True)
        except MarketplaceChat.DoesNotExist:
            return Response({
                'success': False, 'message': 'Chat not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user not in (chat.buyer, chat.seller):
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        messages = chat.messages.all().order_by('created_at')
        serializer = MarketplaceMessageSerializer(messages, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class SendMessageView(APIView):
    """
    POST /api/v1/marketplace/chats/{id}/send/

    Send a message in a chat thread.
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def post(self, request, pk):
        try:
            chat = MarketplaceChat.objects.get(pk=pk, is_active=True, deleted_at__isnull=True)
        except MarketplaceChat.DoesNotExist:
            return Response({
                'success': False, 'message': 'Chat not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user not in (chat.buyer, chat.seller):
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        if chat.is_blocked:
            return Response({
                'success': False,
                'message': 'This conversation has been blocked.',
                'code': 'BLOCKED',
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        msg = MarketplaceMessage.objects.create(
            chat=chat,
            sender=request.user,
            message_type=serializer.validated_data['message_type'],
            content=serializer.validated_data['content'],
        )
        chat.last_message_at = timezone.now()
        chat.save(update_fields=['last_message_at'])
        _broadcast_chat_thread_update(chat)

        output = MarketplaceMessageSerializer(msg).data
        return Response({
            'success': True,
            'message': 'Message sent.',
            'data': output,
        }, status=status.HTTP_201_CREATED)


class BlockChatView(APIView):
    """
    POST /api/v1/marketplace/chats/{id}/block/
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def post(self, request, pk):
        try:
            chat = MarketplaceChat.objects.get(pk=pk, is_active=True, deleted_at__isnull=True)
        except MarketplaceChat.DoesNotExist:
            return Response({
                'success': False, 'message': 'Chat not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user not in (chat.buyer, chat.seller):
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        chat.is_blocked = True
        chat.save(update_fields=['is_blocked'])
        return Response({
            'success': True,
            'message': 'Conversation blocked.',
        })


class MarkReadView(APIView):
    """
    POST /api/v1/marketplace/chats/{id}/mark-read/
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def post(self, request, pk):
        try:
            chat = MarketplaceChat.objects.get(pk=pk, is_active=True, deleted_at__isnull=True)
        except MarketplaceChat.DoesNotExist:
            return Response({
                'success': False, 'message': 'Chat not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if request.user not in (chat.buyer, chat.seller):
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        updated = chat.messages.filter(is_read=False).exclude(
            sender=request.user,
        ).update(is_read=True)
        if updated:
            _broadcast_chat_thread_update(chat)

        return Response({
            'success': True,
            'message': f'{updated} message(s) marked as read.',
        })
