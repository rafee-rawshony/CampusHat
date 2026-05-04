"""Analytics URLs."""

from django.urls import path
from .views import (
    AdminPlatformAnalyticsView,
    AdminRevenueChartView,
    SellerOverviewView,
    SellerPerformanceView,
    SellerRevenueView,
    SellerTopProductsView,
)

app_name = 'analytics'

# Seller analytics
seller_analytics_urlpatterns = [
    path('overview/', SellerOverviewView.as_view(), name='seller-overview'),
    path('revenue/', SellerRevenueView.as_view(), name='seller-revenue'),
    path('products/top/', SellerTopProductsView.as_view(), name='seller-top-products'),
    path('performance/', SellerPerformanceView.as_view(), name='seller-performance'),
]

# Admin analytics
admin_analytics_urlpatterns = [
    path('platform/', AdminPlatformAnalyticsView.as_view(), name='platform'),
    path('revenue/', AdminRevenueChartView.as_view(), name='admin-revenue-chart'),
]
