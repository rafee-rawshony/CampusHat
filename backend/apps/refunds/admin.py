"""Refund admin."""
from django.contrib import admin
from .models import Refund

@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('order', 'requested_by', 'refund_amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('order__order_number',)
    readonly_fields = ('refund_amount', 'commission_reversal_amount', 'seller_deduction_amount')
