"""
Chat views for Mall (Store Chats).
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers

from core.permissions import IsApprovedSeller
from .models import StoreChat, StoreMessage
from apps.sellers.models import Store


# ── SERIALIZERS ──

class StoreMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = StoreMessage
        fields = ['id', 'sender', 'message_type', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_sender(self, obj):
        return {
            'id': str(obj.sender.id),
            'full_name': obj.sender.full_name,
            'profile_picture': obj.sender.profile_picture or None,
        }


class StoreChatSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_logo = serializers.SerializerMethodField()
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    buyer_avatar = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = StoreChat
        fields = [
            'id', 'buyer', 'buyer_name', 'buyer_avatar',
            'store', 'store_name', 'store_logo',
            'is_blocked', 'last_message_at',
            'last_message', 'unread_count'
        ]

    def get_store_logo(self, obj):
        return obj.store.logo_url or None

    def get_buyer_avatar(self, obj):
        return obj.buyer.profile_picture or None

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return StoreMessageSerializer(last_msg, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.exclude(sender=request.user).filter(is_read=False).count()


# ── VIEWS ──

class BuyerChatListView(APIView):
    """GET /api/v1/mall/chats/buyer/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        chats = StoreChat.objects.filter(buyer=request.user).select_related('store', 'buyer').order_by('-last_message_at')
        serializer = StoreChatSerializer(chats, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})


class SellerChatListView(APIView):
    """GET /api/v1/mall/chats/seller/"""
    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        try:
            store = request.user.seller_profile.store
            chats = StoreChat.objects.filter(store=store).select_related('store', 'buyer').order_by('-last_message_at')
            serializer = StoreChatSerializer(chats, many=True, context={'request': request})
            return Response({'success': True, 'data': serializer.data})
        except Exception:
            return Response({'success': False, 'message': 'Store not found.'}, status=404)


class StartStoreChatView(APIView):
    """POST /api/v1/mall/chats/start/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        if not store_id:
            return Response({'success': False, 'message': 'store_id required'}, status=400)
        
        try:
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response({'success': False, 'message': 'Store not found'}, status=404)

        if store.seller.user == request.user:
            return Response({'success': False, 'message': 'Cannot chat with your own store'}, status=400)

        chat, created = StoreChat.objects.get_or_create(buyer=request.user, store=store)
        return Response({
            'success': True,
            'data': StoreChatSerializer(chat, context={'request': request}).data
        })


class StoreChatMessagesView(APIView):
    """GET /api/v1/mall/chats/<id>/messages/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            chat = StoreChat.objects.get(pk=pk)
        except StoreChat.DoesNotExist:
            return Response({'success': False, 'message': 'Chat not found'}, status=404)

        if request.user != chat.buyer and request.user != chat.store.seller.user:
            return Response({'success': False, 'message': 'Forbidden'}, status=403)

        messages = chat.messages.all().order_by('created_at')
        return Response({
            'success': True,
            'data': StoreMessageSerializer(messages, many=True, context={'request': request}).data
        })


class SendStoreMessageView(APIView):
    """POST /api/v1/mall/chats/<id>/send/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            chat = StoreChat.objects.get(pk=pk)
        except StoreChat.DoesNotExist:
            return Response({'success': False, 'message': 'Chat not found'}, status=404)

        if request.user != chat.buyer and request.user != chat.store.seller.user:
            return Response({'success': False, 'message': 'Forbidden'}, status=403)

        if chat.is_blocked:
            return Response({'success': False, 'message': 'Chat is blocked'}, status=400)

        content = request.data.get('content')
        if not content:
            return Response({'success': False, 'message': 'content required'}, status=400)

        message_type = request.data.get('message_type', 'text')
        if message_type not in ('text', 'image', 'product_ref'):
            message_type = 'text'

        msg = StoreMessage.objects.create(
            chat=chat,
            sender=request.user,
            content=content,
            message_type=message_type,
        )

        chat.last_message_at = timezone.now()
        chat.save()

        return Response({
            'success': True,
            'data': StoreMessageSerializer(msg, context={'request': request}).data
        })

class MarkStoreMessagesReadView(APIView):
    """POST /api/v1/mall/chats/<id>/mark-read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            chat = StoreChat.objects.get(pk=pk)
        except StoreChat.DoesNotExist:
            return Response({'success': False, 'message': 'Chat not found'}, status=404)

        if request.user != chat.buyer and request.user != chat.store.seller.user:
            return Response({'success': False, 'message': 'Forbidden'}, status=403)

        chat.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        return Response({'success': True, 'message': 'Messages marked as read'})
