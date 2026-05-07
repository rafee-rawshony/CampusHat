"""
Order URL Configuration.

Buyer, seller, and admin order endpoints.
"""

from django.urls import path

from .views import (
    AdminForceStatusView,
    AdminOrderDetailView,
    AdminOrderListView,
    BuyerCancelOrderView,
    BuyerOrderDetailView,
    BuyerOrderListView,
    CheckoutView,
    OrderTrackingView,
    SellerConfirmOrderView,
    SellerOrderCountsView,
    SellerOrderDetailView,
    SellerOrderListView,
    SellerPackOrderView,
    SellerShipOrderView,
)

app_name = 'orders'

# Buyer order URLs (mounted under /api/v1/orders/)
urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('', BuyerOrderListView.as_view(), name='buyer-orders'),
    path('<uuid:order_id>/', BuyerOrderDetailView.as_view(), name='buyer-order-detail'),
    path('<uuid:order_id>/cancel/', BuyerCancelOrderView.as_view(), name='buyer-cancel'),
    path('<uuid:order_id>/tracking/', OrderTrackingView.as_view(), name='order-tracking'),
]

# Seller order URLs (mounted under /api/v1/seller/orders/)
seller_order_urlpatterns = [
    path('counts/', SellerOrderCountsView.as_view(), name='seller-order-counts'),
    path('', SellerOrderListView.as_view(), name='seller-orders'),
    path('<uuid:order_id>/', SellerOrderDetailView.as_view(), name='seller-order-detail'),
    path('<uuid:order_id>/confirm/', SellerConfirmOrderView.as_view(), name='seller-confirm'),
    path('<uuid:order_id>/pack/', SellerPackOrderView.as_view(), name='seller-pack'),
    path('<uuid:order_id>/ship/', SellerShipOrderView.as_view(), name='seller-ship'),
]

# Admin order URLs (mounted under /api/v1/admin/orders/)
admin_order_urlpatterns = [
    path('', AdminOrderListView.as_view(), name='admin-orders'),
    path('<uuid:order_id>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('<uuid:order_id>/status/', AdminForceStatusView.as_view(), name='admin-force-status'),
]
