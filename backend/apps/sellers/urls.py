"""Seller URL Configuration."""

from django.urls import path

from .views import (
    SellerOnboardView,
    SellerRegisterView, SellerMyProfileView, SellerDashboardView,
    StoreCreateView, MyStoreView, StoreUpdateView, StoreSubmitForReviewView,
    PublicStoreDetailView, PublicStoreListView, FeaturedStoresView,
    PayoutRequestView, PayoutListView,
    StoreFollowToggleView, StoreFollowStatusView,
    MyFollowedStoresView,
)

app_name = 'sellers'

urlpatterns = [
    # Seller
    path('register/', SellerRegisterView.as_view(), name='register'),
    path('onboard/', SellerOnboardView.as_view(), name='onboard'),  # Daraz-style multi-section
    path('my-profile/', SellerMyProfileView.as_view(), name='my-profile'),
    path('my-dashboard/', SellerDashboardView.as_view(), name='dashboard'),
    path('featured/', FeaturedStoresView.as_view(), name='featured'),

    # Buyer-side: stores I follow
    path('my/followed-stores/', MyFollowedStoresView.as_view(), name='my-followed-stores'),

    # Payouts
    path('payouts/request/', PayoutRequestView.as_view(), name='payout-request'),
    path('payouts/', PayoutListView.as_view(), name='payout-list'),
]

# Store URLs (mounted separately under /stores/)
store_urlpatterns = [
    path('create/', StoreCreateView.as_view(), name='store-create'),
    path('my-store/', MyStoreView.as_view(), name='my-store'),
    path('my-store/update/', StoreUpdateView.as_view(), name='store-update'),
    path('my-store/submit-for-review/', StoreSubmitForReviewView.as_view(), name='store-submit'),
    path('', PublicStoreListView.as_view(), name='store-list'),
    path('<slug:slug>/', PublicStoreDetailView.as_view(), name='store-detail'),
    path('<slug:slug>/follow/', StoreFollowToggleView.as_view(), name='store-follow'),
    path('<slug:slug>/follow_status/', StoreFollowStatusView.as_view(), name='store-follow-status'),
]
