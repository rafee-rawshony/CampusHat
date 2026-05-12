"""
Mall Serializers.

Covers categories, products, variants, reviews, and cart operations.
"""

from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.sellers.models import SellerBadge, Store

from .models import (
    Brand,
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

    icon = serializers.CharField(source='icon_url', read_only=True)
    display_order = serializers.IntegerField(source='sort_order', read_only=True)
    parent_id = serializers.UUIDField(read_only=True, allow_null=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True, default=None)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = MallCategory
        fields = [
            'id', 'name', 'slug', 'icon_url', 'icon', 'level', 'parent',
            'parent_id', 'parent_name', 'sort_order', 'display_order', 'is_active',
            'product_count',
        ]
        read_only_fields = fields

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, deleted_at__isnull=True).count()


class MallCategoryTreeSerializer(serializers.Serializer):
    """Nested tree serializer (recursive)."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    level = serializers.IntegerField()
    parent = serializers.UUIDField(allow_null=True, required=False)
    parent_id = serializers.UUIDField(allow_null=True, required=False)
    parent_name = serializers.CharField(allow_null=True, required=False)
    icon_url = serializers.CharField(allow_null=True)
    icon = serializers.CharField(allow_null=True, required=False)
    sort_order = serializers.IntegerField()
    display_order = serializers.IntegerField(required=False)
    is_active = serializers.BooleanField(required=False)
    product_count = serializers.IntegerField(required=False)
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
    parent_id = serializers.UUIDField(read_only=True, allow_null=True)

    class Meta:
        model = MallCategory
        fields = [
            'id', 'name', 'slug', 'icon_url', 'level',
            'parent', 'parent_id', 'sort_order', 'full_path', 'children',
        ]
        read_only_fields = fields

    def get_children(self, obj):
        children = MallCategory.objects.filter(
            parent=obj, is_active=True, deleted_at__isnull=True,
        ).order_by('sort_order', 'name')
        return MallCategorySerializer(children, many=True).data


class MallCategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """Admin-only CRUD serializer for categories."""

    parent = serializers.PrimaryKeyRelatedField(
        queryset=MallCategory.objects.filter(deleted_at__isnull=True),
        required=False,
        allow_null=True,
    )
    parent_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    icon = serializers.CharField(write_only=True, required=False, allow_blank=True)
    display_order = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = MallCategory
        fields = [
            'name', 'slug', 'parent', 'parent_id', 'icon_url', 'icon', 'sort_order',
            'display_order', 'is_active',
        ]
        extra_kwargs = {'slug': {'required': False}}

    def validate_slug(self, value):
        if not value:
            return value
        qs = MallCategory.all_objects.filter(slug=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'This slug is already used. Please choose a different slug.'
            )
        return value

    def validate(self, attrs):
        parent_id = attrs.pop('parent_id', serializers.empty)
        icon = attrs.pop('icon', None)
        display_order = attrs.pop('display_order', None)
        if parent_id is not serializers.empty:
            if parent_id is None:
                attrs['parent'] = None
            else:
                try:
                    attrs['parent'] = MallCategory.objects.get(
                        id=parent_id,
                        deleted_at__isnull=True,
                    )
                except MallCategory.DoesNotExist:
                    raise serializers.ValidationError({
                        'parent_id': 'Parent category not found.'
                    })
        if icon is not None and 'icon_url' not in attrs:
            attrs['icon_url'] = icon
        if display_order is not None and 'sort_order' not in attrs:
            attrs['sort_order'] = display_order

        parent = attrs.get('parent')
        if self.instance and parent:
            if parent.pk == self.instance.pk:
                raise serializers.ValidationError({
                    'parent': 'A category cannot be its own parent.'
                })
            descendant_ids = self.instance.get_descendants(include_self=False)
            if parent.pk in descendant_ids:
                raise serializers.ValidationError({
                    'parent': 'A category cannot be moved under its own child.'
                })
        return attrs


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


from core.validators import sanitize_html

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
    images = serializers.SerializerMethodField()
    store = MiniStoreSerializer(read_only=True)
    category_name = serializers.CharField(
        source='category.name', read_only=True, default=None,
    )
    brand_name = serializers.CharField(
        source='brand.name', read_only=True, default=None,
    )

    class Meta:
        model = StoreProduct
        fields = [
            'id', 'name', 'slug', 'base_price', 'discount_price',
            'current_price', 'sku', 'stock_quantity', 'is_in_stock',
            'is_active', 'is_featured', 'rating_avg', 'review_count', 'sold_count',
            'primary_image_url', 'images', 'store', 'category_name', 'brand_name',
            'tags', 'has_variants', 'created_at',
        ]
        read_only_fields = fields

    def get_primary_image_url(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first = obj.images.order_by('sort_order').first()
        return first.image_url if first else None

    def get_images(self, obj):
        imgs = obj.images.order_by('sort_order')[:10]
        return StoreProductImageSerializer(imgs, many=True).data


class StoreProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail serializer."""

    current_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )
    is_in_stock = serializers.BooleanField(read_only=True)
    images = StoreProductImageSerializer(many=True, read_only=True)
    variants = serializers.SerializerMethodField()
    store = StoreDetailForProductSerializer(read_only=True)
    category_name = serializers.CharField(
        source='category.name', read_only=True, default=None,
    )
    brand_name = serializers.CharField(
        source='brand.name', read_only=True, default=None,
    )

    class Meta:
        model = StoreProduct
        fields = [
            'id', 'name', 'slug', 'base_price', 'discount_price',
            'current_price', 'sku', 'stock_quantity', 'is_in_stock',
            'is_featured', 'rating_avg', 'review_count', 'sold_count',
            'description', 'short_description', 'weight_grams',
            'images', 'variants', 'is_active', 'has_variants',
            'tags', 'store', 'category_name', 'brand_name',
            'view_count', 'created_at',
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

    # Frontend uploads images first via /uploads/ and gets back URL strings.
    # Accepts a list of up to 10 URL strings — no raw file upload needed.
    image_urls = serializers.ListField(
        child=serializers.CharField(allow_blank=True, allow_null=True, default=''),
        required=False,
        max_length=10,
        default=list,
        write_only=True,
    )

    brand = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = StoreProduct
        fields = [
            'category', 'brand', 'name', 'description', 'short_description',
            'base_price', 'discount_price', 'sku', 'stock_quantity',
            'has_variants', 'is_featured', 'is_active', 'weight_grams',
            'tags', 'image_urls',
        ]
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
        }

    def validate_tags(self, value):
        if value and not isinstance(value, list):
            raise serializers.ValidationError('Tags must be a list.')
        return value or []

    def validate_brand(self, value):
        if not value:
            return None
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
            brand = Brand.objects.filter(name__iexact=value).first()
            if not brand:
                brand = Brand.objects.create(name=value)
            return brand
        return value

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

    def _save_images(self, product, image_urls):
        """Create StoreProductImage records from a list of URL strings."""
        first = True
        for i, url in enumerate(image_urls):
            url = (url or '').strip()
            if url:
                StoreProductImage.objects.create(
                    product=product,
                    image_url=url,
                    sort_order=i,
                    is_primary=first,
                )
                first = False

    def create(self, validated_data):
        image_urls = validated_data.pop('image_urls', [])
        request = self.context['request']
        store = request.user.seller_profile.store

        with transaction.atomic():
            product = StoreProduct.objects.create(store=store, **validated_data)
            self._save_images(product, image_urls)
        return product

    def update(self, instance, validated_data):
        # None means the key was not sent — preserve existing images.
        # An empty list means the user cleared all images.
        image_urls = validated_data.pop('image_urls', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if image_urls is not None:
            instance.images.all().delete()
            self._save_images(instance, image_urls)
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
            'evidence_urls', 'seller_response', 'seller_responded_at',
            'is_visible', 'created_at',
        ]
        read_only_fields = fields


class ProductReviewCreateSerializer(serializers.Serializer):
    """Create review — validates verified purchase."""

    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)
    evidence_urls = serializers.ListField(
        child=serializers.URLField(), required=False, max_length=5,
    )
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
            evidence_urls=validated_data.get('evidence_urls', []),
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
    is_flash_sale = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_slug',
            'variant', 'variant_name', 'quantity',
            'unit_price_snapshot', 'line_total', 'primary_image_url',
            'is_flash_sale', 'original_price',
        ]
        read_only_fields = fields

    def get_primary_image_url(self, obj):
        primary = obj.product.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first = obj.product.images.order_by('sort_order').first()
        return first.image_url if first else None

    def get_is_flash_sale(self, obj):
        return obj.flash_sale_product_id is not None

    def get_original_price(self, obj):
        if obj.flash_sale_product_id:
            return str(obj.product.current_price)
        return None


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


# =============================================================================
# PRODUCT Q&A SERIALIZERS
# =============================================================================

from .models import ProductQuestion


class ProductQuestionSerializer(serializers.ModelSerializer):
    """Read-only Q&A list serializer."""

    asker_name = serializers.CharField(
        source='asker.full_name', read_only=True,
    )
    answerer_name = serializers.CharField(
        source='answered_by.full_name', read_only=True, default=None,
    )

    class Meta:
        model = ProductQuestion
        fields = [
            'id', 'asker', 'asker_name', 'question', 'answer',
            'answered_by', 'answerer_name', 'answered_at',
            'vote_count', 'created_at',
        ]
        read_only_fields = fields


class ProductQuestionCreateSerializer(serializers.Serializer):
    """Create a question on a product."""

    question = serializers.CharField(max_length=500)

    def validate_question(self, value):
        return sanitize_html(value)

    def create(self, validated_data):
        request = self.context['request']
        product = self.context['product']

        return ProductQuestion.objects.create(
            product=product,
            asker=request.user,
            question=validated_data['question'],
        )


class SellerAnswerQuestionSerializer(serializers.Serializer):
    """Seller answers a question."""

    answer = serializers.CharField()

    def validate_answer(self, value):
        return sanitize_html(value)

    def update(self, instance, validated_data):
        from django.utils import timezone
        instance.answer = validated_data['answer']
        instance.answered_by = self.context['request'].user
        instance.answered_at = timezone.now()
        instance.save(update_fields=['answer', 'answered_by', 'answered_at'])
        return instance

