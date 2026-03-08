"""
Mall Serializers.

Covers categories, products, variants, reviews, and cart operations.
"""

import uuid

from decimal import Decimal

from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from apps.sellers.models import SellerBadge, Store

from .models import (
    Cart,
    CartItem,
    MallCategory,
    ProductReview,
    ProductVariant,
    StoreProduct,
    StoreProductImage,
)


# =============================================================================
# CATEGORY SERIALIZERS
# =============================================================================

class MallCategorySerializer(serializers.ModelSerializer):
    """Flat category list serializer."""

    class Meta:
        model = MallCategory
        fields = ['id', 'name', 'slug', 'icon_url', 'level', 'parent', 'sort_order']
        read_only_fields = fields


class MallCategoryTreeSerializer(serializers.Serializer):
    """Nested tree serializer (recursive)."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    level = serializers.IntegerField()
    icon_url = serializers.CharField(allow_null=True)
    sort_order = serializers.IntegerField()
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        if isinstance(obj, dict):
            children = obj.get('children', [])
        else:
            children = MallCategory.objects.filter(
                parent=obj, is_active=True, deleted_at__isnull=True,
            ).order_by('sort_order', 'name')
        return MallCategoryTreeSerializer(children, many=True).data


class MallCategoryDetailSerializer(serializers.ModelSerializer):
    """Category detail with children."""

    children = serializers.SerializerMethodField()
    full_path = serializers.CharField(read_only=True)

    class Meta:
        model = MallCategory
        fields = [
            'id', 'name', 'slug', 'icon_url', 'level',
            'parent', 'sort_order', 'full_path', 'children',
        ]
        read_only_fields = fields

    def get_children(self, obj):
        children = MallCategory.objects.filter(
            parent=obj, is_active=True, deleted_at__isnull=True,
        ).order_by('sort_order', 'name')
        return MallCategorySerializer(children, many=True).data


class MallCategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """Admin-only CRUD serializer for categories."""

    class Meta:
        model = MallCategory
        fields = ['name', 'slug', 'parent', 'icon_url', 'sort_order', 'is_active']
        extra_kwargs = {'slug': {'required': False}}


# =============================================================================
# STORE (nested read-only for product serializers)
# =============================================================================

class MiniStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'slug']
        read_only_fields = fields


class StoreDetailForProductSerializer(serializers.ModelSerializer):
    badges = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'name', 'slug', 'logo_url', 'rating_avg', 'badges']
        read_only_fields = fields

    def get_badges(self, obj):
        badges = SellerBadge.objects.filter(store=obj, is_active=True)
        return [
            {'badge_type': b.badge_type, 'display_label': b.display_label}
            for b in badges
        ]


# =============================================================================
# PRODUCT IMAGE SERIALIZERS
# =============================================================================

class StoreProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreProductImage
        fields = ['id', 'image_url', 'alt_text', 'sort_order', 'is_primary']
        read_only_fields = ['id']


# =============================================================================
# PRODUCT VARIANT SERIALIZERS
# =============================================================================

class ProductVariantSerializer(serializers.ModelSerializer):
    """Read-only variant serializer for product detail."""

    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'sku', 'price_override', 'stock_quantity',
            'attributes', 'is_active', 'effective_price',
        ]
        read_only_fields = fields


class ProductVariantCreateUpdateSerializer(serializers.ModelSerializer):
    """Seller CRUD for variants."""

    class Meta:
        model = ProductVariant
        fields = [
            'name', 'sku', 'price_override', 'stock_quantity',
            'attributes', 'is_active',
        ]

    def validate_attributes(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Attributes must be a JSON object.')
        return value


from core.validators import validate_image_file, sanitize_html

# =============================================================================
# PRODUCT SERIALIZERS
# =============================================================================

class StoreProductListSerializer(serializers.ModelSerializer):
    """Public product listing serializer."""

    current_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )
    is_in_stock = serializers.BooleanField(read_only=True)
    primary_image_url = serializers.SerializerMethodField()
    store = MiniStoreSerializer(read_only=True)
    category_name = serializers.CharField(
        source='category.name', read_only=True, default=None,
    )

    class Meta:
        model = StoreProduct
        fields = [
            'id', 'name', 'slug', 'base_price', 'discount_price',
            'current_price', 'sku', 'stock_quantity', 'is_in_stock',
            'is_featured', 'rating_avg', 'review_count', 'sold_count',
            'primary_image_url', 'store', 'category_name', 'tags',
            'has_variants', 'created_at',
        ]
        read_only_fields = fields

    def get_primary_image_url(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first = obj.images.order_by('sort_order').first()
        return first.image_url if first else None


class StoreProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail serializer."""

    current_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )
    is_in_stock = serializers.BooleanField(read_only=True)
    all_images = StoreProductImageSerializer(source='images', many=True, read_only=True)
    variants = serializers.SerializerMethodField()
    store = StoreDetailForProductSerializer(read_only=True)
    category_name = serializers.CharField(
        source='category.name', read_only=True, default=None,
    )

    class Meta:
        model = StoreProduct
        fields = [
            'id', 'name', 'slug', 'base_price', 'discount_price',
            'current_price', 'sku', 'stock_quantity', 'is_in_stock',
            'is_featured', 'rating_avg', 'review_count', 'sold_count',
            'description', 'short_description', 'weight_grams',
            'all_images', 'variants', 'is_active', 'has_variants',
            'tags', 'store', 'category_name', 'created_at',
        ]
        read_only_fields = fields

    def get_variants(self, obj):
        if not obj.has_variants:
            return []
        variants = obj.variants.filter(
            is_active=True, deleted_at__isnull=True,
        )
        return ProductVariantSerializer(variants, many=True).data


class StoreProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Seller-only product create/update serializer."""

    images = serializers.ListField(
        child=serializers.ImageField(max_length=500, validators=[validate_image_file]),
        required=False,
        write_only=True,
        max_length=8,
    )

    class Meta:
        model = StoreProduct
        fields = [
            'category', 'name', 'description', 'short_description',
            'base_price', 'discount_price', 'sku', 'stock_quantity',
            'has_variants', 'is_featured', 'is_active', 'weight_grams',
            'tags', 'images',
        ]

    def validate_tags(self, value):
        if value and not isinstance(value, list):
            raise serializers.ValidationError('Tags must be a list.')
        return value or []

    def validate_base_price(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError(
                'Price must be greater than 0.'
            )
        return value

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError(
                'Stock quantity cannot be negative.'
            )
        return value

    def _upload_image(self, image_file, product_id):
        """Upload image to S3 or save locally."""
        try:
            import boto3
            s3_client = boto3.client(
                's3',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', ''),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', ''),
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'ap-southeast-1'),
            )
            bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'campushat-media')
            ext = image_file.name.rsplit('.', 1)[-1] if '.' in image_file.name else 'jpg'
            key = f'mall/products/{product_id}/{uuid.uuid4().hex}.{ext}'
            s3_client.upload_fileobj(
                image_file, bucket, key,
                ExtraArgs={'ContentType': image_file.content_type},
            )
            domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', '')
            if domain:
                return f'https://{domain}/{key}'
            return f'https://{bucket}.s3.amazonaws.com/{key}'
        except Exception:
            import os
            upload_dir = os.path.join(
                settings.BASE_DIR, 'mediafiles', 'mall', 'products', str(product_id),
            )
            os.makedirs(upload_dir, exist_ok=True)
            ext = image_file.name.rsplit('.', 1)[-1] if '.' in image_file.name else 'jpg'
            file_name = f'{uuid.uuid4().hex}.{ext}'
            file_path = os.path.join(upload_dir, file_name)
            with open(file_path, 'wb+') as dest:
                for chunk in image_file.chunks():
                    dest.write(chunk)
            return f'/media/mall/products/{product_id}/{file_name}'

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        request = self.context['request']
        store = request.user.seller_profile.store

        with transaction.atomic():
            product = StoreProduct.objects.create(
                store=store, **validated_data,
            )
            for i, image_file in enumerate(images[:8]):
                url = self._upload_image(image_file, str(product.id))
                StoreProductImage.objects.create(
                    product=product,
                    image_url=url,
                    sort_order=i,
                    is_primary=(i == 0),
                )
        return product

    def update(self, instance, validated_data):
        images = validated_data.pop('images', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if images is not None:
            # Replace all images
            instance.images.all().delete()
            for i, image_file in enumerate(images[:8]):
                url = self._upload_image(image_file, str(instance.id))
                StoreProductImage.objects.create(
                    product=instance,
                    image_url=url,
                    sort_order=i,
                    is_primary=(i == 0),
                )
        return instance


# =============================================================================
# PRODUCT REVIEW SERIALIZERS
# =============================================================================

class ProductReviewSerializer(serializers.ModelSerializer):
    """Read-only review list serializer."""

    reviewer_name = serializers.CharField(
        source='reviewer.full_name', read_only=True,
    )

    class Meta:
        model = ProductReview
        fields = [
            'id', 'reviewer', 'reviewer_name', 'rating', 'comment',
            'seller_response', 'seller_responded_at',
            'is_visible', 'created_at',
        ]
        read_only_fields = fields


class ProductReviewCreateSerializer(serializers.Serializer):
    """Create review — validates verified purchase."""

    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)
    order_item_id = serializers.UUIDField(required=False)

    def validate_comment(self, value):
        return sanitize_html(value)

    def create(self, validated_data):
        request = self.context['request']
        product = self.context['product']

        review = ProductReview.objects.create(
            product=product,
            reviewer=request.user,
            rating=validated_data['rating'],
            comment=validated_data.get('comment', ''),
            order_item_id=validated_data.get('order_item_id'),
        )
        return review


class SellerResponseSerializer(serializers.Serializer):
    """Seller adds/updates response to a review."""

    seller_response = serializers.CharField()

    def validate_seller_response(self, value):
        return sanitize_html(value)

    def update(self, instance, validated_data):
        from django.utils import timezone
        instance.seller_response = validated_data['seller_response']
        instance.seller_responded_at = timezone.now()
        instance.save(update_fields=['seller_response', 'seller_responded_at'])
        return instance


# =============================================================================
# CART SERIALIZERS
# =============================================================================

class CartItemSerializer(serializers.ModelSerializer):
    """Cart item with product details."""

    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    variant_name = serializers.CharField(
        source='variant.name', read_only=True, default=None,
    )
    line_total = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_slug',
            'variant', 'variant_name', 'quantity',
            'unit_price_snapshot', 'line_total', 'primary_image_url',
        ]
        read_only_fields = fields

    def get_primary_image_url(self, obj):
        primary = obj.product.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first = obj.product.images.order_by('sort_order').first()
        return first.image_url if first else None


class CartSerializer(serializers.ModelSerializer):
    """Full cart with items and totals."""

    items = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'item_count', 'subtotal', 'coupon_code', 'created_at']
        read_only_fields = fields

    def get_item_count(self, obj):
        return obj.items.count()

    def get_subtotal(self, obj):
        total = sum(
            item.unit_price_snapshot * item.quantity
            for item in obj.items.all()
        )
        return str(total)


class CartSummarySerializer(serializers.Serializer):
    """Cart summary with totals breakdown."""

    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    item_count = serializers.IntegerField()


class AddToCartSerializer(serializers.Serializer):
    """Add item to cart."""

    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        from django.db import models as db_models

        product_id = attrs['product_id']
        variant_id = attrs.get('variant_id')
        quantity = attrs['quantity']

        # Validate product
        try:
            product = StoreProduct.objects.select_for_update().get(
                id=product_id,
                is_active=True,
                deleted_at__isnull=True,
                store__status='active',
                store__deleted_at__isnull=True,
            )
        except StoreProduct.DoesNotExist:
            raise serializers.ValidationError(
                'Product not found or not available.'
            )

        attrs['product'] = product

        # Validate variant if required
        if product.has_variants and not variant_id:
            raise serializers.ValidationError(
                'This product has variants. Please select a variant.'
            )

        variant = None
        if variant_id:
            try:
                variant = ProductVariant.objects.select_for_update().get(
                    id=variant_id,
                    product=product,
                    is_active=True,
                    deleted_at__isnull=True,
                )
            except ProductVariant.DoesNotExist:
                raise serializers.ValidationError('Variant not found.')

            if variant.stock_quantity < quantity:
                raise serializers.ValidationError(
                    f'Only {variant.stock_quantity} in stock for this variant.'
                )
            attrs['variant'] = variant
        else:
            if product.stock_quantity < quantity:
                raise serializers.ValidationError(
                    f'Only {product.stock_quantity} in stock.'
                )

        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """Update cart item quantity."""

    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        item = self.context.get('cart_item')
        if item:
            if item.variant:
                if value > item.variant.stock_quantity:
                    raise serializers.ValidationError(
                        f'Only {item.variant.stock_quantity} in stock.'
                    )
            else:
                if value > item.product.stock_quantity:
                    raise serializers.ValidationError(
                        f'Only {item.product.stock_quantity} in stock.'
                    )
        return value
