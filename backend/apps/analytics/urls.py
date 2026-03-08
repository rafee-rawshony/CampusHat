"""Analytics URLs."""

from django.urls import path
from .views import (
    AdminPlatformAnalyticsView,
    SellerOverviewView,
    SellerRevenueView,
    SellerTopProductsView,
)

app_name = 'analytics'

# Seller analytics
seller_analytics_urlpatterns = [
    path('overview/', SellerOverviewView.as_view(), name='seller-overview'),
    path('revenue/', SellerRevenueView.as_view(), name='seller-revenue'),
    path('products/top/', SellerTopProductsView.as_view(), name='seller-top-products'),
]

# Admin analytics
admin_analytics_urlpatterns = [
    path('platform/', AdminPlatformAnalyticsView.as_view(), name='platform'),
]
