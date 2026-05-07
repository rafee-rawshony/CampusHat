"""Coupon and Flash Sale serializers."""

from decimal import Decimal

from rest_framework import serializers

from .models import Coupon, CouponUsage, FlashSale, FlashSaleProduct
from apps.mall.serializers import StoreProductListSerializer

# ── Coupon ──

class CouponSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.store_name', read_only=True, default=None)

    class Meta:
        model = Coupon
        fields = [
            'id', 'store', 'store_name', 'code', 'coupon_type',
            'discount_value', 'minimum_order_amount', 'maximum_discount_cap',
            'total_usage_limit', 'per_user_limit', 'used_count',
            'valid_from', 'expires_at', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'used_count', 'created_at']


class CouponCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'code', 'coupon_type', 'discount_value',
            'minimum_order_amount', 'maximum_discount_cap',
            'total_usage_limit', 'per_user_limit',
            'valid_from', 'expires_at',
        ]

    def validate_code(self, value):
        return value.upper()


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2)


class CouponValidateResponseSerializer(serializers.Serializer):
    is_valid = serializers.BooleanField()
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    error = serializers.CharField(allow_null=True)


# ── Flash Sale ──

class FlashSaleProductSerializer(serializers.ModelSerializer):
    product = StoreProductListSerializer(read_only=True)

    class Meta:
        model = FlashSaleProduct
        fields = ['id', 'product', 'override_price']
        read_only_fields = ['id']


class FlashSaleListSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.store_name', read_only=True)
    is_currently_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = FlashSale
        fields = [
            'id', 'store', 'store_name', 'title', 'description',
            'discount_percentage', 'starts_at', 'ends_at',
            'max_items_per_user', 'is_active', 'is_currently_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'is_currently_active']


class FlashSaleDetailSerializer(serializers.ModelSerializer):
    products = FlashSaleProductSerializer(many=True, read_only=True)
    store_name = serializers.CharField(source='store.store_name', read_only=True)
    is_currently_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = FlashSale
        fields = [
            'id', 'store', 'store_name', 'title', 'description',
            'discount_percentage', 'starts_at', 'ends_at',
            'max_items_per_user', 'is_active', 'is_currently_active',
            'products', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'is_currently_active']


class FlashSaleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashSale
        fields = [
            'title', 'description', 'discount_percentage',
            'starts_at', 'ends_at', 'max_items_per_user',
        ]


class FlashSaleAddProductsSerializer(serializers.Serializer):
    product_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1,
    )
    override_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True,
    )
