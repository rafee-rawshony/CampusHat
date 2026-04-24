"""
Interaction Serializers for the Marketplace.

Covers offers, chats, messages, reviews, and reports.
"""

from rest_framework import serializers

from .models import (
    MarketplaceChat,
    MarketplaceMessage,
    MarketplaceOffer,
    MarketplaceReport,
    MarketplaceReview,
)
from core.validators import sanitize_html


# =============================================================================
# OFFERS
# =============================================================================

class MarketplaceOfferSerializer(serializers.ModelSerializer):
    """Create/display offers."""

    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)

    class Meta:
        model = MarketplaceOffer
        fields = [
            'id', 'product', 'buyer', 'buyer_name',
            'offered_price', 'counter_price', 'status',
            'message', 'expires_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'buyer', 'buyer_name', 'counter_price',
            'status', 'expires_at', 'created_at',
        ]

    def validate(self, attrs):
        product = attrs.get('product')
        if product and not product.is_negotiable:
            raise serializers.ValidationError(
                'This product does not accept offers.'
            )
        if product and product.status != 'active':
            raise serializers.ValidationError(
                'You can only make offers on active listings.'
            )
        return attrs

    def validate_message(self, value):
        return sanitize_html(value)

    def create(self, validated_data):
        validated_data['buyer'] = self.context['request'].user
        return super().create(validated_data)


class OfferActionSerializer(serializers.Serializer):
    """Serializer for accept/reject/counter actions."""

    counter_price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
    )


# =============================================================================
# CHAT
# =============================================================================

class MarketplaceChatSerializer(serializers.ModelSerializer):
    """Chat thread serializer — frontend-friendly with other_user, listing, last_message."""

    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    listing = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceChat
        fields = [
            'id', 'product', 'buyer', 'seller',
            'buyer_name', 'seller_name', 'product_title',
            'is_blocked', 'last_message_at',
            'unread_count', 'other_user', 'listing',
            'last_message', 'created_at',
        ]
        read_only_fields = fields

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(
            sender=request.user,
        ).count()

    def get_other_user(self, obj):
        """Return the other participant's info relative to the request user."""
        request = self.context.get('request')
        if not request:
            return None
        other = obj.seller if request.user == obj.buyer else obj.buyer
        return {
            'id': str(other.id),
            'name': other.full_name,
            'profile_picture': other.profile_picture or None,
        }

    def get_listing(self, obj):
        """Return listing (product) info with first image."""
        product = obj.product
        images = []
        for img in product.images.all()[:3]:
            images.append({'image': img.image_url})
        return {
            'id': str(product.id),
            'title': product.title,
            'images': images,
        }

    def get_last_message(self, obj):
        """Return the most recent message in this thread."""
        msg = obj.messages.order_by('-created_at').first()
        if not msg:
            return None
        return {
            'content': msg.content,
            'created_at': msg.created_at.isoformat(),
            'message_type': msg.message_type,
        }


class StartChatSerializer(serializers.Serializer):
    """Start a chat with a product's seller."""

    product_id = serializers.UUIDField()


class MarketplaceMessageSerializer(serializers.ModelSerializer):
    """Individual message serializer with nested sender object."""

    sender = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceMessage
        fields = [
            'id', 'chat', 'sender',
            'message_type', 'content', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'chat', 'sender', 'is_read', 'created_at']

    def get_sender(self, obj):
        return {
            'id': str(obj.sender.id),
            'full_name': obj.sender.full_name,
            'profile_picture': obj.sender.profile_picture or None,
        }


class SendMessageSerializer(serializers.Serializer):
    """Send a message in a chat thread."""

    message_type = serializers.ChoiceField(
        choices=[('text', 'Text'), ('image', 'Image'), ('offer_ref', 'Offer Reference')],
        default='text',
    )
    content = serializers.CharField()

    def validate_content(self, value):
        return sanitize_html(value)


# =============================================================================
# REVIEWS
# =============================================================================

class MarketplaceReviewSerializer(serializers.ModelSerializer):
    """Review serializer with reviewer name."""

    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)

    class Meta:
        model = MarketplaceReview
        fields = [
            'id', 'product', 'reviewer', 'reviewer_name',
            'seller', 'rating', 'comment',
            'is_verified_transaction', 'created_at',
        ]
        read_only_fields = [
            'id', 'reviewer', 'reviewer_name', 'seller',
            'is_verified_transaction', 'created_at',
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate_comment(self, value):
        return sanitize_html(value)

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        validated_data['seller'] = validated_data['product'].user
        return super().create(validated_data)


# =============================================================================
# REPORTS
# =============================================================================

class MarketplaceReportSerializer(serializers.ModelSerializer):
    """Report serializer for flagging content."""

    class Meta:
        model = MarketplaceReport
        fields = [
            'id', 'product', 'reason', 'description',
            'status', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)


class AdminReportActionSerializer(serializers.Serializer):
    """Admin action on a report."""

    status = serializers.ChoiceField(
        choices=[('reviewed', 'Reviewed'), ('dismissed', 'Dismissed'), ('actioned', 'Actioned')],
    )
    admin_note = serializers.CharField(required=False, allow_blank=True)
