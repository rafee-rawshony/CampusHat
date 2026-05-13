"""
Marketplace Admin Configuration.

Custom admin interfaces for all marketplace models.
"""

from django.contrib import admin

from .models import (
    MarketplaceCategory,
    MarketplaceChat,
    MarketplaceMessage,
    MarketplaceOffer,
    MarketplaceProduct,
    MarketplaceProductImage,
    MarketplaceReport,
    MarketplaceReview,
)


class ProductImageInline(admin.TabularInline):
    model = MarketplaceProductImage
    extra = 0
    readonly_fields = ('id',)


@admin.register(MarketplaceCategory)
class MarketplaceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'ad_type', 'parent', 'sort_order', 'is_active')
    list_filter = ('ad_type', 'is_active')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('ad_type', 'sort_order', 'name')


@admin.register(MarketplaceProduct)
class MarketplaceProductAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'user', 'post_type', 'status', 'price',
        'campus_visibility', 'expires_at', 'view_count', 'created_at',
    )
    list_filter = ('status', 'post_type', 'campus_visibility', 'condition')
    search_fields = ('title', 'description', 'user__email', 'brand', 'model_name')
    raw_id_fields = ('user', 'university', 'category', 'reviewed_by')
    readonly_fields = ('id', 'view_count', 'repost_count', 'created_at', 'updated_at')
    inlines = [ProductImageInline]
    ordering = ('-created_at',)

    fieldsets = (
        ('Core', {
            'fields': (
                'id', 'user', 'university', 'category', 'title',
                'description', 'post_type', 'status', 'rejection_reason',
            ),
        }),
        ('Pricing & Visibility', {
            'fields': (
                'price', 'price_unit', 'condition', 'is_negotiable',
                'campus_visibility', 'duration_days', 'expires_at',
                'safe_meetup_location',
            ),
        }),
        ('Sell Details', {
            'classes': ('collapse',),
            'fields': ('brand', 'model_name', 'usage_duration', 'delivery_option'),
        }),
        ('Rent Details', {
            'classes': ('collapse',),
            'fields': (
                'location', 'availability_date', 'rental_duration',
                'deposit_amount', 'facilities', 'room_details',
                'rules_conditions', 'contact_preference',
            ),
        }),
        ('Service Details', {
            'classes': ('collapse',),
            'fields': (
                'skills', 'experience', 'delivery_time',
                'availability_hours', 'portfolio_url', 'previous_work_desc',
            ),
        }),
        ('Food Details', {
            'classes': ('collapse',),
            'fields': (
                'ingredients', 'portion_size', 'delivery_area',
                'food_delivery_time', 'daily_availability',
                'hygiene_certification', 'combo_packages',
            ),
        }),
        ('Stats & Audit', {
            'fields': (
                'view_count', 'repost_count', 'is_hidden_by_user',
                'is_auto_expired', 'reviewed_by', 'created_at', 'updated_at',
            ),
        }),
    )


@admin.register(MarketplaceProductImage)
class MarketplaceProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'sort_order', 'is_primary', 'created_at')
    raw_id_fields = ('product',)


@admin.register(MarketplaceOffer)
class MarketplaceOfferAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'buyer', 'offered_price', 'counter_price',
        'status', 'expires_at', 'created_at',
    )
    list_filter = ('status',)
    search_fields = ('product__title', 'buyer__email')
    raw_id_fields = ('product', 'buyer')
    ordering = ('-created_at',)


@admin.register(MarketplaceChat)
class MarketplaceChatAdmin(admin.ModelAdmin):
    list_display = ('product', 'buyer', 'seller', 'is_blocked', 'last_message_at')
    list_filter = ('is_blocked',)
    raw_id_fields = ('product', 'buyer', 'seller')
    ordering = ('-last_message_at',)


@admin.register(MarketplaceMessage)
class MarketplaceMessageAdmin(admin.ModelAdmin):
    list_display = ('chat', 'sender', 'message_type', 'is_read', 'created_at')
    list_filter = ('message_type', 'is_read')
    raw_id_fields = ('chat', 'sender')
    ordering = ('-created_at',)


@admin.register(MarketplaceReview)
class MarketplaceReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'reviewer', 'seller', 'rating', 'is_verified_transaction', 'created_at')
    list_filter = ('rating', 'is_verified_transaction')
    raw_id_fields = ('product', 'reviewer', 'seller')
    ordering = ('-created_at',)


@admin.register(MarketplaceReport)
class MarketplaceReportAdmin(admin.ModelAdmin):
    list_display = ('product', 'reporter', 'reason', 'status', 'reviewed_by', 'created_at')
    list_filter = ('status', 'reason')
    search_fields = ('product__title', 'reporter__email')
    raw_id_fields = ('product', 'reporter', 'reviewed_by')
    ordering = ('-created_at',)
