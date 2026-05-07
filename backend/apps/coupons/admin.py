"""Coupon admin."""
from django.contrib import admin
from .models import Coupon, CouponUsage, FlashSale, FlashSaleProduct


class FlashSaleProductInline(admin.TabularInline):
    model = FlashSaleProduct
    extra = 0


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'coupon_type', 'discount_value', 'store', 'used_count', 'is_active', 'expires_at')
    list_filter = ('coupon_type', 'is_active')
    search_fields = ('code',)


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ('coupon', 'user', 'order', 'discount_applied', 'used_at')
    list_filter = ('used_at',)


@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = ('title', 'store', 'discount_percentage', 'starts_at', 'ends_at', 'is_active')
    list_filter = ('is_active',)
    inlines = [FlashSaleProductInline]
