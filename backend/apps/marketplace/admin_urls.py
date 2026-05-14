"""
Admin Marketplace URL Configuration.

Endpoints for admin moderation under /api/v1/admin/marketplace/.
"""

from django.urls import path

from .admin_views import (
    AdminAllProductsListView,
    AdminApproveView,
    AdminHideProductView,
    AdminPendingListView,
    AdminProductDetailView,
    AdminRejectView,
    AdminReportActionView,
    AdminReportsListView,
    AdminReviewView,
    AdminReportedListView,
    AdminReportResolveView,
    AdminUnhideProductView,
)
from .category_views import (
    AdminCategoryListView,
    AdminCategoryDetailView,
    AdminCategoryToggleView,
    AdminCategoryReorderView,
)

urlpatterns = [
    # All products listing (must come before <uuid:pk>/ pattern)
    path('', AdminAllProductsListView.as_view(), name='all-products'),

    # Category Management
    path('categories/', AdminCategoryListView.as_view(), name='admin-categories'),
    path('categories/reorder/', AdminCategoryReorderView.as_view(), name='admin-categories-reorder'),
    path('categories/<uuid:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),
    path('categories/<uuid:pk>/toggle/', AdminCategoryToggleView.as_view(), name='admin-category-toggle'),

    # Product Moderation
    path('pending/', AdminPendingListView.as_view(), name='pending'),
    path('reported/', AdminReportedListView.as_view(), name='reported'),
    path('<uuid:pk>/', AdminProductDetailView.as_view(), name='detail'),
    path('<uuid:pk>/review/', AdminReviewView.as_view(), name='review'),
    path('<uuid:pk>/approve/', AdminApproveView.as_view(), name='approve'),
    path('<uuid:pk>/reject/', AdminRejectView.as_view(), name='reject'),
    path('<uuid:pk>/hide/', AdminHideProductView.as_view(), name='hide'),
    path('<uuid:pk>/unhide/', AdminUnhideProductView.as_view(), name='unhide'),
    path('reports/', AdminReportsListView.as_view(), name='reports'),
    path('reports/<uuid:pk>/action/', AdminReportActionView.as_view(), name='report-action'),
    path('reports/<uuid:pk>/resolve/', AdminReportResolveView.as_view(), name='report-resolve'),
]
