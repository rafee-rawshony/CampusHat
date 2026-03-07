"""Seller Admin Configuration."""

from django.contrib import admin

from .models import (
    SellerProfile, Store, SellerBadge,
    SellerPayoutRequest, StudentBenefit,
)


class BadgeInline(admin.TabularInline):
    model = SellerBadge
    extra = 0
    readonly_fields = ('id', 'awarded_at')


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = (
        'business_name', 'user', 'business_type', 'status',
        'is_student_seller', 'commission_rate', 'created_at',
    )
    list_filter = ('status', 'business_type', 'is_student_seller')
    search_fields = ('business_name', 'user__email')
    raw_id_fields = ('user', 'approved_by')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'slug', 'seller', 'university', 'status',
        'rating_avg', 'review_count', 'total_sales_count', 'created_at',
    )
    list_filter = ('status',)
    search_fields = ('name', 'slug', 'seller__business_name')
    raw_id_fields = ('seller', 'university', 'approved_by')
    readonly_fields = ('id', 'slug', 'created_at', 'updated_at')
    inlines = [BadgeInline]
    ordering = ('-created_at',)


@admin.register(SellerBadge)
class SellerBadgeAdmin(admin.ModelAdmin):
    list_display = ('store', 'badge_type', 'display_label', 'is_active', 'awarded_at')
    list_filter = ('badge_type', 'is_active')
    raw_id_fields = ('store', 'awarded_by')


@admin.register(SellerPayoutRequest)
class SellerPayoutRequestAdmin(admin.ModelAdmin):
    list_display = ('seller', 'amount', 'method', 'status', 'processed_at', 'created_at')
    list_filter = ('status', 'method')
    raw_id_fields = ('seller', 'processed_by')
    ordering = ('-created_at',)


@admin.register(StudentBenefit)
class StudentBenefitAdmin(admin.ModelAdmin):
    list_display = ('seller', 'benefit_type', 'discount_percentage', 'valid_from', 'valid_until', 'is_active')
    list_filter = ('benefit_type', 'is_active')
    raw_id_fields = ('seller', 'granted_by')
