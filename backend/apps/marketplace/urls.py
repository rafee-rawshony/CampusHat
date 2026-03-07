"""
Marketplace URL Configuration.

All marketplace endpoints under /api/v1/marketplace/.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .product_views import (
    CategoryListView,
    MarketplaceListingViewSet,
    MyListingsView,
)
from .offer_views import CreateOfferView, ListOffersView, OfferActionView
from .chat_views import (
    BlockChatView,
    ChatMessagesView,
    MarkReadView,
    MyChatListView,
    SendMessageView,
    StartChatView,
)
from .review_views import CreateReviewView, ListReviewsView
from .report_views import CreateReportView

app_name = 'marketplace'

# Router for listing ViewSet
router = DefaultRouter()
router.register(r'listings', MarketplaceListingViewSet, basename='listing')

urlpatterns = [
    # Categories
    path('categories/', CategoryListView.as_view(), name='categories'),

    # My listings
    path('my-listings/', MyListingsView.as_view(), name='my-listings'),

    # Offers on a listing
    path('listings/<uuid:product_id>/offers/',
         CreateOfferView.as_view(), name='create-offer'),
    path('listings/<uuid:product_id>/offers/list/',
         ListOffersView.as_view(), name='list-offers'),

    # Offer actions
    path('offers/<uuid:pk>/accept/',
         OfferActionView.as_view(), {'action_type': 'accept'}, name='offer-accept'),
    path('offers/<uuid:pk>/reject/',
         OfferActionView.as_view(), {'action_type': 'reject'}, name='offer-reject'),
    path('offers/<uuid:pk>/counter/',
         OfferActionView.as_view(), {'action_type': 'counter'}, name='offer-counter'),

    # Chat
    path('chats/start/', StartChatView.as_view(), name='chat-start'),
    path('chats/', MyChatListView.as_view(), name='chat-list'),
    path('chats/<uuid:pk>/messages/', ChatMessagesView.as_view(), name='chat-messages'),
    path('chats/<uuid:pk>/send/', SendMessageView.as_view(), name='chat-send'),
    path('chats/<uuid:pk>/block/', BlockChatView.as_view(), name='chat-block'),
    path('chats/<uuid:pk>/mark-read/', MarkReadView.as_view(), name='chat-mark-read'),

    # Reviews
    path('listings/<uuid:product_id>/reviews/',
         CreateReviewView.as_view(), name='create-review'),
    path('listings/<uuid:product_id>/reviews/list/',
         ListReviewsView.as_view(), name='list-reviews'),

    # Report
    path('listings/<uuid:product_id>/report/',
         CreateReportView.as_view(), name='report'),
]

# Add router URLs
urlpatterns += router.urls
