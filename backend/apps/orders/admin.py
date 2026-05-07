"""Order admin registration."""

from django.contrib import admin

from .models import Invoice, Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        'product', 'variant', 'product_name_snapshot',
        'unit_price', 'quantity', 'line_total',
        'commission_rate_snapshot', 'commission_amount',
    )


class StatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = (
        'from_status', 'to_status', 'changed_by',
        'changed_by_role', 'note', 'created_at',
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'buyer', 'store',
        'total_amount', 'payment_status', 'order_status',
        'created_at',
    )
    list_filter = ('payment_status', 'order_status')
    search_fields = ('order_number', 'buyer__email')
    readonly_fields = (
        'order_number', 'buyer', 'store',
        'subtotal', 'discount_amount', 'delivery_fee',
        'total_amount', 'platform_commission', 'seller_net_amount',
    )
    inlines = [OrderItemInline, StatusHistoryInline]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'order', 'total_amount', 'issued_at')
    search_fields = ('invoice_number',)
