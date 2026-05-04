"""Refund URLs."""
from django.urls import path
from .views import (
    AdminApproveRefundView, AdminPendingRefundsView,
    AdminProcessRefundView, AdminRefundDetailView,
    AdminRejectRefundView, BuyerRefundListView,
    RefundDetailView, RefundRequestView,
    SellerRefundListView,
)

app_name = 'refunds'

urlpatterns = [
    path('request/', RefundRequestView.as_view(), name='request'),
    path('my-refunds/', BuyerRefundListView.as_view(), name='my-refunds'),
    path('<uuid:refund_id>/', RefundDetailView.as_view(), name='detail'),
]

# Seller-side refund views (mounted under /api/v1/seller/refunds/)
seller_refund_urlpatterns = [
    path('', SellerRefundListView.as_view(), name='seller-refunds'),
]

admin_refund_urlpatterns = [
    path('pending/', AdminPendingRefundsView.as_view(), name='admin-pending'),
    path('<uuid:refund_id>/', AdminRefundDetailView.as_view(), name='admin-detail'),
    path('<uuid:refund_id>/approve/', AdminApproveRefundView.as_view(), name='admin-approve'),
    path('<uuid:refund_id>/reject/', AdminRejectRefundView.as_view(), name='admin-reject'),
    path('<uuid:refund_id>/process/', AdminProcessRefundView.as_view(), name='admin-process'),
]
