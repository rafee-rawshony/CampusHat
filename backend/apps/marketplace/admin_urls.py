"""
Admin Marketplace URL Configuration.

Endpoints for admin moderation under /api/v1/admin/marketplace/.
"""

from django.urls import path

from .admin_views import (
    AdminApproveView,
    AdminPendingListView,
    AdminProductDetailView,
    AdminRejectView,
    AdminReportActionView,
    AdminReportsListView,
    AdminReviewView,
    AdminReportedListView,
    AdminReportResolveView,
)

urlpatterns = [
    path('pending/', AdminPendingListView.as_view(), name='pending'),
    path('reported/', AdminReportedListView.as_view(), name='reported'),
    path('<uuid:pk>/', AdminProductDetailView.as_view(), name='detail'),
    path('<uuid:pk>/review/', AdminReviewView.as_view(), name='review'),
    path('<uuid:pk>/approve/', AdminApproveView.as_view(), name='approve'),
    path('<uuid:pk>/reject/', AdminRejectView.as_view(), name='reject'),
    path('reports/', AdminReportsListView.as_view(), name='reports'),
    path('reports/<uuid:pk>/action/', AdminReportActionView.as_view(), name='report-action'),
    path('reports/<uuid:pk>/resolve/', AdminReportResolveView.as_view(), name='report-resolve'),
]
