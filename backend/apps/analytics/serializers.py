"""Analytics serializers."""

from rest_framework import serializers
from .models import ActivityLog, ProductView, SearchLog, SellerDashboardStats


class ProductViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductView
        fields = ['id', 'product_id', 'product_type', 'viewed_at']
        read_only_fields = fields


class SearchLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchLog
        fields = ['id', 'search_scope', 'query', 'result_count', 'searched_at']
        read_only_fields = fields


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, default=None)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_email', 'action', 'module',
            'resource_type', 'resource_id', 'ip_address',
            'user_agent', 'metadata', 'created_at',
        ]
        read_only_fields = fields


class SellerDashboardStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerDashboardStats
        fields = [
            'total_revenue', 'total_commission_paid', 'total_orders',
            'completed_orders', 'pending_balance', 'rating_avg',
            'last_computed_at',
        ]
        read_only_fields = fields
