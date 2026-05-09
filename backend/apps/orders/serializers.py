"""
Order Serializers.

Covers: checkout, buyer orders, seller orders, admin orders, invoices.
"""

from rest_framework import serializers

from apps.wallet.serializers import PaymentSerializer

from .models import Invoice, Order, OrderItem, OrderStatusHistory


# =============================================================================
# ORDER ITEM
# =============================================================================

class OrderItemSerializer(serializers.ModelSerializer):
    """Read-only order item with product details."""

    product_slug = serializers.CharField(
        source='product.slug', read_only=True,
    )
    variant_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_slug', 'variant', 'variant_name',
            'product_name_snapshot', 'unit_price', 'quantity',
            'line_total', 'commission_rate_snapshot', 'commission_amount',
        ]
        read_only_fields = fields

    def get_variant_name(self, obj):
        if obj.variant:
            return obj.variant.name
        return None


# =============================================================================
# ORDER STATUS HISTORY
# =============================================================================

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(
        source='changed_by.email', read_only=True, default=None,
    )

    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'from_status', 'to_status',
            'changed_by_email', 'changed_by_role',
            'note', 'created_at',
        ]
        read_only_fields = fields


# =============================================================================
# ORDER — BUYER VIEW
# =============================================================================

class OrderListSerializer(serializers.ModelSerializer):
    """Buyer's order list — summary view with up to 3 item previews."""

    store_name = serializers.CharField(source='store.store_name', read_only=True)
    item_count = serializers.SerializerMethodField()
    items_preview = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'store', 'store_name',
            'total_amount', 'payment_status', 'order_status',
            'item_count', 'items_preview',
            'cancelled_at', 'cancellation_reason',
            'created_at',
        ]
        read_only_fields = fields

    def get_item_count(self, obj):
        return obj.items.count()

    def get_items_preview(self, obj):
        """First 3 items — name, qty, image — for the order list card."""
        previews = []
        for item in obj.items.all()[:3]:
            image_url = None
            # Try variant image first, then product main image. Wrapped in
            # try/except because field names vary across product models.
            try:
                if item.variant and getattr(item.variant, 'image_url', None):
                    image_url = item.variant.image_url
                elif item.product and getattr(item.product, 'main_image_url', None):
                    image_url = item.product.main_image_url
            except Exception:
                image_url = None
            previews.append({
                'product_name': item.product_name_snapshot,
                'quantity': item.quantity,
                'image_url': image_url,
            })
        return previews


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full order detail with items, payments, and status history."""

    store_name = serializers.CharField(source='store.store_name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'store', 'store_name',
            'delivery_address_snapshot',
            'coupon_code_snapshot',
            'subtotal', 'discount_amount', 'delivery_fee',
            'total_amount', 'platform_commission', 'seller_net_amount',
            'payment_status', 'order_status',
            'buyer_note', 'tracking_code',
            'cancelled_at', 'cancellation_reason',
            'items', 'status_history', 'payments',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


# =============================================================================
# CHECKOUT
# =============================================================================

class CheckoutSerializer(serializers.Serializer):
    """Checkout request body."""

    delivery_address_id = serializers.UUIDField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(
        choices=['wallet', 'bkash', 'nagad', 'rocket', 'card', 'cod'],
    )
    buyer_note = serializers.CharField(required=False, allow_blank=True)


# =============================================================================
# SELLER ORDER VIEWS
# =============================================================================

class SellerOrderListSerializer(serializers.ModelSerializer):
    """Seller view of their store's orders."""

    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer_email',
            'total_amount', 'seller_net_amount', 'platform_commission',
            'payment_status', 'order_status',
            'item_count', 'created_at',
        ]
        read_only_fields = fields

    def get_item_count(self, obj):
        return obj.items.count()


class SellerOrderDetailSerializer(serializers.ModelSerializer):
    """Seller view — full order detail (excludes buyer wallet info)."""

    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer_email',
            'delivery_address_snapshot',
            'subtotal', 'discount_amount', 'delivery_fee',
            'total_amount', 'platform_commission', 'seller_net_amount',
            'payment_status', 'order_status',
            'buyer_note', 'tracking_code',
            'cancelled_at', 'cancellation_reason',
            'items', 'status_history',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


# =============================================================================
# INVOICE
# =============================================================================

class InvoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'pdf_url',
            'subtotal', 'tax_amount', 'total_amount',
            'issued_at', 'created_at',
        ]
        read_only_fields = fields


# =============================================================================
# ADMIN ORDER
# =============================================================================

class AdminOrderSerializer(serializers.ModelSerializer):
    """Admin view — includes all financial details."""

    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    buyer_phone = serializers.CharField(source='buyer.phone', read_only=True, default=None)
    store_name = serializers.CharField(source='store.store_name', read_only=True)
    status = serializers.CharField(source='order_status', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'buyer_name', 'buyer_email', 'buyer_phone',
            'store', 'store_name',
            'delivery_address_snapshot',
            'coupon_code_snapshot',
            'subtotal', 'discount_amount', 'delivery_fee',
            'total_amount', 'platform_commission', 'seller_net_amount',
            'payment_status', 'order_status', 'status',
            'buyer_note', 'tracking_code',
            'cancelled_at', 'cancellation_reason',
            'items', 'status_history', 'payments',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class AdminStatusUpdateSerializer(serializers.Serializer):
    """Force status update by admin."""

    status = serializers.ChoiceField(choices=[
        'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled',
    ])
    note = serializers.CharField(required=False, allow_blank=True)
