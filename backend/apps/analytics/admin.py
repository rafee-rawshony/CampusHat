"""Analytics admin."""
from django.contrib import admin
from .models import ActivityLog, ProductView, SearchLog, SellerDashboardStats


@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display = ('product_id', 'product_type', 'user', 'viewed_at')
    list_filter = ('product_type',)
    readonly_fields = ('product_id', 'product_type', 'user', 'university', 'session_id', 'viewed_at')


@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = ('query', 'search_scope', 'result_count', 'university', 'searched_at')
    list_filter = ('search_scope',)
    search_fields = ('query',)


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'module', 'resource_type', 'created_at')
    list_filter = ('module', 'action')
    readonly_fields = ('user', 'action', 'module', 'resource_type', 'resource_id',
                       'ip_address', 'user_agent', 'metadata', 'created_at')


@admin.register(SellerDashboardStats)
class SellerDashboardStatsAdmin(admin.ModelAdmin):
    list_display = ('seller', 'total_revenue', 'total_orders', 'completed_orders', 'rating_avg', 'last_computed_at')
