"""
Product Serializers for the Marketplace.

Handles category display, product creation (with image upload),
public listing, verified detail, and owner views.
"""

import uuid

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


from core.validators import validate_image_file

# =============================================================================
# PRODUCT CREATE
# =============================================================================

class MarketplaceProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a marketplace listing.

    Validates duration_days per post_type, uploads images to S3/local,
    sets university from request.user.
    """

    images = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_file]),
        max_length=8,
        required=False,
        write_only=True,
        help_text='Upload up to 8 images (max 5MB each).',
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
        if post_type in ('sell', 'rent') and duration not in SELL_RENT_DURATIONS:
            raise serializers.ValidationError({
                'duration_days': f'For {post_type}, duration must be one of {SELL_RENT_DURATIONS}.',
            })
        if post_type in ('service', 'food') and duration not in SERVICE_FOOD_DURATIONS:
            raise serializers.ValidationError({
                'duration_days': f'For {post_type}, duration must be one of {SERVICE_FOOD_DURATIONS}.',
            })
        return attrs

    def _upload_image(self, file_obj, user_id):
        """Upload image to S3 public or local fallback."""
        import os
        from django.conf import settings as s
        ext = file_obj.name.rsplit('.', 1)[-1] if '.' in file_obj.name else 'jpg'
        file_name = f'{uuid.uuid4().hex}.{ext}'
        try:
            aws_key = getattr(s, 'AWS_ACCESS_KEY_ID', '')
            if not aws_key:
                raise ValueError("S3 not configured")

            import boto3
            s3 = boto3.client(
                's3',
                aws_access_key_id=getattr(s, 'AWS_ACCESS_KEY_ID', ''),
                aws_secret_access_key=getattr(s, 'AWS_SECRET_ACCESS_KEY', ''),
                region_name=getattr(s, 'AWS_S3_REGION_NAME', 'ap-southeast-1'),
            )
            bucket = getattr(s, 'AWS_STORAGE_BUCKET_NAME', 'campushat-media')
            key = f'marketplace/{user_id}/{file_name}'
            s3.upload_fileobj(
                file_obj, bucket, key,
                ExtraArgs={'ContentType': file_obj.content_type},
            )
            domain = getattr(s, 'AWS_S3_CUSTOM_DOMAIN', '')
            if domain:
                return f'https://{domain}/{key}'
            return f'https://{bucket}.s3.amazonaws.com/{key}'
        except Exception:
            upload_dir = os.path.join(s.BASE_DIR, 'mediafiles', 'marketplace', str(user_id))
            os.makedirs(upload_dir, exist_ok=True)
            path = os.path.join(upload_dir, file_name)
            with open(path, 'wb+') as dest:
                for chunk in file_obj.chunks():
                    dest.write(chunk)
            return f'/media/marketplace/{user_id}/{file_name}'

    def create(self, validated_data):
        image_files = validated_data.pop('images', [])
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['university'] = user.university
        validated_data['status'] = 'pending'

        product = MarketplaceProduct.objects.create(**validated_data)

        for idx, img_file in enumerate(image_files):
            url = self._upload_image(img_file, str(user.id))
            MarketplaceProductImage.objects.create(
                product=product,
                image_url=url,
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
            'contact_visible',
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
        # Only show contact if requester is marketplace-verified
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            from core.permissions import IsVerifiedForMarketplace
            perm = IsVerifiedForMarketplace()
            if perm.has_permission(request, None):
                base['phone'] = obj.user.phone
                base['email'] = obj.user.email
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
        if instance and instance.status not in ['active', 'rejected']:
            raise serializers.ValidationError({
                'non_field_errors': [
                    f'Cannot edit an ad with status: {instance.status}. '
                    f'Only active or rejected ads can be edited.'
                ]
            })
        return data

    def update(self, instance, validated_data):
        # If title/description/price change on an ACTIVE ad →
        # re-submit for admin approval (status back to pending).
        content_fields = {'title', 'description', 'price'}
        if instance.status == 'active' and (set(validated_data) & content_fields):
            validated_data['status'] = 'pending'
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
