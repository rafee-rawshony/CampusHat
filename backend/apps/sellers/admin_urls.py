"""Admin Seller URL Configuration."""

from django.urls import path

from .admin_views import (
    AdminSellerReviewView,
    AdminSellerListView, AdminSellerPendingView, AdminSellerDetailView,
    AdminSellerApproveView, AdminSellerRejectView, AdminSellerSuspendView,
    AdminStoreListView, AdminStorePendingView, AdminStoreDetailView,
    AdminStoreApproveView, AdminStoreRejectView,
    AdminAwardBadgeView, AdminRevokeBadgeView,
    AdminPayoutPendingView, AdminPayoutProcessView, AdminPayoutRejectView,
)

# Seller admin
seller_admin_urlpatterns = [
    path('', AdminSellerListView.as_view(), name='seller-list'),
    path('pending/', AdminSellerPendingView.as_view(), name='seller-pending'),
    path('<uuid:pk>/', AdminSellerDetailView.as_view(), name='seller-detail'),
    path('<uuid:pk>/approve/', AdminSellerApproveView.as_view(), name='seller-approve'),
    path('<uuid:pk>/review/', AdminSellerReviewView.as_view(), name='seller-review'),
    path('<uuid:pk>/reject/', AdminSellerRejectView.as_view(), name='seller-reject'),
    path('<uuid:pk>/suspend/', AdminSellerSuspendView.as_view(), name='seller-suspend'),
]

# Store admin
store_admin_urlpatterns = [
    path('', AdminStoreListView.as_view(), name='store-list'),
    path('pending/', AdminStorePendingView.as_view(), name='store-pending'),
    path('<uuid:pk>/', AdminStoreDetailView.as_view(), name='store-detail'),
    path('<uuid:pk>/approve/', AdminStoreApproveView.as_view(), name='store-approve'),
    path('<uuid:pk>/reject/', AdminStoreRejectView.as_view(), name='store-reject'),
    path('<uuid:pk>/badges/award/', AdminAwardBadgeView.as_view(), name='badge-award'),
    path('<uuid:pk>/badges/<uuid:badge_id>/revoke/', AdminRevokeBadgeView.as_view(), name='badge-revoke'),
]

# Payout admin
payout_admin_urlpatterns = [
    path('pending/', AdminPayoutPendingView.as_view(), name='payout-pending'),
    path('<uuid:pk>/process/', AdminPayoutProcessView.as_view(), name='payout-process'),
    path('<uuid:pk>/reject/', AdminPayoutRejectView.as_view(), name='payout-reject'),
]
