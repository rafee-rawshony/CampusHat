"""
Product Serializers for the Marketplace.

Handles category display, product creation (with uploaded image URLs),
public listing, verified detail, and owner views.
"""

from rest_framework import serializers

from .models import (
    MarketplaceCategory,
    MarketplaceProduct,
    MarketplaceProductImage,
    SELL_RENT_DURATIONS,
    SERVICE_FOOD_DURATIONS,
)


# =============================================================================
# CATEGORY
# =============================================================================

class MarketplaceCategorySerializer(serializers.ModelSerializer):
    """Category serializer with nested children for tree display."""

    children = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceCategory
        fields = [
            'id', 'name', 'slug', 'ad_type', 'parent',
            'icon_url', 'sort_order', 'is_active', 'children',
        ]
        read_only_fields = fields

    def get_children(self, obj):
        children = obj.children.filter(deleted_at__isnull=True, is_active=True)
        return MarketplaceCategorySerializer(children, many=True).data


class MarketplaceCategoryFlatSerializer(serializers.ModelSerializer):
    """Flat category serializer (no children) for list views."""

    class Meta:
        model = MarketplaceCategory
        fields = ['id', 'name', 'slug', 'ad_type']
        read_only_fields = fields


# =============================================================================
# PRODUCT IMAGE
# =============================================================================

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceProductImage
        fields = ['id', 'image_url', 'sort_order', 'is_primary']
        read_only_fields = fields


# =============================================================================
# PRODUCT CREATE
# =============================================================================

class MarketplaceProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a marketplace listing.

    Validates duration_days per post_type and stores image URLs returned by the
    universal upload endpoint. Sets university from request.user.
    """

    images = serializers.ListField(
        child=serializers.URLField(max_length=500),
        max_length=8,
        required=False,
        write_only=True,
        help_text='Up to 8 image URLs returned by /api/v1/uploads/.',
    )

    class Meta:
        model = MarketplaceProduct
        fields = [
            'category', 'title', 'description', 'post_type',
            'price', 'price_unit', 'condition', 'is_negotiable',
            'campus_visibility', 'duration_days',
            'safe_meetup_location', 'images',
        ]

    def validate_duration_days(self, value):
        """Will be cross-validated with post_type in validate()."""
        return value

    def validate(self, attrs):
        post_type = attrs.get('post_type')
        duration = attrs.get('duration_days')
        category = attrs.get('category')

        if category:
            if not category.is_active or category.deleted_at is not None:
                raise serializers.ValidationError({
                    'category': 'Selected category is not available.',
                })
            if category.ad_type != post_type:
                raise serializers.ValidationError({
                    'category': f'Selected category is not valid for {post_type} ads.',
                })

        if post_type in ('sell', 'rent') and duration not in SELL_RENT_DURATIONS:
            raise serializers.ValidationError({
                'duration_days': f'For {post_type}, duration must be one of {SELL_RENT_DURATIONS}.',
            })
        if post_type in ('service', 'food') and duration not in SERVICE_FOOD_DURATIONS:
            raise serializers.ValidationError({
                'duration_days': f'For {post_type}, duration must be one of {SERVICE_FOOD_DURATIONS}.',
            })
        return attrs

    def create(self, validated_data):
        image_urls = validated_data.pop('images', [])
        user = self.context['request'].user
        if not getattr(user, 'university_id', None):
            raise serializers.ValidationError({
                'university': 'Your profile must be linked to a university before posting.',
            })
        validated_data['user'] = user
        validated_data['university'] = user.university
        validated_data['status'] = 'pending'

        product = MarketplaceProduct.objects.create(**validated_data)

        # Notify admins about new listing
        try:
            from apps.admin_panel.notification_utils import notify_admins
            notify_admins(
                notification_type='marketplace',
                title='New Marketplace Listing',
                message=f'A new ad "{product.title}" has been submitted and is pending review.',
                action_url=f'/admin/marketplace/ads' # Admin dashboard URL
            )
        except Exception as e:
            # Don't fail the listing creation if notification fails
            import logging
            logging.getLogger(__name__).error(f"Failed to notify admins: {e}")

        for idx, image_url in enumerate(image_urls):
            MarketplaceProductImage.objects.create(
                product=product,
                image_url=image_url,
                sort_order=idx,
                is_primary=(idx == 0),
            )

        return product


# =============================================================================
# PRODUCT LIST (PUBLIC — limited info)
# =============================================================================

class MarketplaceProductListSerializer(serializers.ModelSerializer):
    """
    Public listing serializer. No user contact info.
    """

    university_name = serializers.CharField(source='university.name', read_only=True)
    university_short = serializers.CharField(source='university.short_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceProduct
        fields = [
            'id', 'title', 'post_type', 'price', 'price_unit',
            'condition', 'campus_visibility',
            'university_name', 'university_short',
            'category_name', 'primary_image_url',
            'status', 'expires_at', 'view_count',
            'is_negotiable', 'created_at',
        ]
        read_only_fields = fields

    def get_primary_image_url(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first = obj.images.first()
        return first.image_url if first else None


# =============================================================================
# PRODUCT DETAIL (verified users see more)
# =============================================================================

class MarketplaceProductDetailSerializer(serializers.ModelSerializer):
    """
    Detail serializer. Verified users see user info and contact.
    """

    university_name = serializers.CharField(source='university.name', read_only=True)
    university_short = serializers.CharField(source='university.short_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    images = ProductImageSerializer(many=True, read_only=True)
    user_info = serializers.SerializerMethodField()
    contact_visible = serializers.SerializerMethodField()
    offers_count = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceProduct
        fields = [
            'id', 'title', 'description', 'post_type', 'price',
            'price_unit', 'condition', 'is_negotiable',
            'campus_visibility', 'status', 'duration_days',
            'expires_at', 'view_count', 'safe_meetup_location',
            'university_name', 'university_short',
            'category_name', 'images', 'user_info',
            'contact_visible', 'rejection_reason',
            'offers_count', 'reviews_count', 'average_rating',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_user_info(self, obj):
        request = self.context.get('request')
        base = {
            'id': str(obj.user.id),
            'full_name': obj.user.full_name,
            'profile_picture': getattr(obj.user, 'profile_picture', None),
            'reputation_score': float(obj.user.reputation_score),
        }
        # Keep direct phone/email private. Verified users can contact sellers
        # through Marketplace Chat instead of receiving personal contact data.
        return base

    def get_contact_visible(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
            return False
        from core.permissions import IsVerifiedForMarketplace
        perm = IsVerifiedForMarketplace()
        return perm.has_permission(request, None)

    def get_offers_count(self, obj):
        return obj.offers.filter(deleted_at__isnull=True).count()

    def get_reviews_count(self, obj):
        return obj.reviews.filter(deleted_at__isnull=True).count()

    def get_average_rating(self, obj):
        from django.db.models import Avg
        avg = obj.reviews.filter(deleted_at__isnull=True).aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg else None


# =============================================================================
# PRODUCT OWNER (own posts — full info)
# =============================================================================

class MarketplaceProductOwnerSerializer(serializers.ModelSerializer):
    """Full serializer for product owner showing rejection_reason, etc."""

    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = MarketplaceProduct
        fields = [
            'id', 'title', 'description', 'post_type', 'price',
            'price_unit', 'condition', 'is_negotiable',
            'campus_visibility', 'status', 'duration_days',
            'expires_at', 'view_count', 'safe_meetup_location',
            'is_hidden_by_user', 'is_auto_expired',
            'repost_count', 'rejection_reason', 'reviewed_by',
            'category_name', 'images',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields
from decimal import Decimal

class MarketplaceProductOwnerUpdateSerializer(serializers.ModelSerializer):
    """
    Used ONLY by the post owner to update their own listing via PATCH.
    Only safe fields are writable. Status, university, user are all
    read-only — owners cannot self-approve their ads.
    """
    class Meta:
        model = MarketplaceProduct
        fields = [
            # WRITABLE — owner can change these:
            'title',
            'description',
            'price',
            'price_unit',
            'condition',
            'is_negotiable',
            'safe_meetup_location',
        ]

    def validate_price(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError('Price must be greater than 0.')
        return value

    def validate(self, data):
        # Only active or rejected ads can be edited.
        # pending, expired, sold, deleted → no edits allowed.
        instance = self.instance
        if instance and instance.status not in ['active', 'rejected', 'pending']:
            raise serializers.ValidationError({
                'non_field_errors': [
                    f'Cannot edit an ad with status: {instance.status}. '
                    f'Only active, rejected, or pending ads can be edited.'
                ]
            })
        return data

    def update(self, instance, validated_data):
        content_fields = {'title', 'description', 'price'}
        was_resubmitted = False
        
        if instance.status == 'active' and (set(validated_data) & content_fields):
            validated_data['status'] = 'pending'
            was_resubmitted = True
        if instance.status == 'rejected':
            validated_data['status'] = 'pending'
            validated_data['rejection_reason'] = ''
            was_resubmitted = True
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if was_resubmitted:
            try:
                from apps.admin_panel.notification_utils import notify_admins
                notify_admins(
                    notification_type='marketplace',
                    title='Marketplace Ad Re-submitted',
                    message=f'The ad "{instance.title}" has been edited and re-submitted for review.',
                    action_url='/admin/marketplace/ads'
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to notify admins of re-submission: {e}")
                
        return instance
