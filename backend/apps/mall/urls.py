"""
Mall URL Configuration.

All mall endpoints under /api/v1/mall/.
Cart endpoints under /api/v1/cart/.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminMallProductToggleView,
    BannerListView,
    BrandListView,
    CartAddItemView,
    CartApplyCouponView,
    CartClearView,
    CartRemoveCouponView,
    CartRemoveItemView,
    CartSummaryView,
    CartUpdateItemView,
    CartView,
    MallCategoryViewSet,
    MyReviewDetailView,
    MyReviewsListView,
    ProductReviewCanReviewView,
    ProductReviewCreateView,
    ProductReviewListView,
    ProductVariantDetailView,
    ProductVariantListCreateView,
    SellerBulkProductUploadView,
    SellerProductListView,
    SellerReplyToReviewView,
    SellerReviewResponseView,
    SellerReviewsListView,
    StoreProductViewSet,
    WishlistToggleView,
    WishlistView,
    ProductQuestionListView,
    SellerAnswerQuestionView,
)

from .chat_views import (
    BuyerChatListView,
    SellerChatListView,
    StartStoreChatView,
    StoreChatMessagesView,
    SendStoreMessageView,
    MarkStoreMessagesReadView
)

app_name = 'mall'

# Routers for ViewSets
category_router = DefaultRouter()
category_router.register(r'categories', MallCategoryViewSet, basename='category')

product_router = DefaultRouter()
product_router.register(r'products', StoreProductViewSet, basename='product')

# Mall URLs (mounted under /api/v1/mall/)
urlpatterns = []
urlpatterns += category_router.urls
urlpatterns += product_router.urls

# Brands
urlpatterns += [
    path('products/brands/', BrandListView.as_view(), name='brand-list'),
]

# Banners (hero carousel)
urlpatterns += [
    path('banners/', BannerListView.as_view(), name='banner-list'),
]

# Product reviews (nested under product)
urlpatterns += [
    path('products/<slug:product_slug>/reviews/',
         ProductReviewListView.as_view(), name='product-reviews-list'),
    path('products/<slug:product_slug>/reviews/can-review/',
         ProductReviewCanReviewView.as_view(), name='product-review-can-review'),
    path('products/<slug:product_slug>/reviews/create/',
         ProductReviewCreateView.as_view(), name='product-review-create'),
    path('products/<slug:product_slug>/reviews/<uuid:review_id>/seller-response/',
         SellerReviewResponseView.as_view(), name='review-seller-response'),
]

# My Reviews — dashboard "My Reviews" section
urlpatterns += [
    path('reviews/my/', MyReviewsListView.as_view(), name='my-reviews-list'),
    path('reviews/my/<uuid:review_id>/', MyReviewDetailView.as_view(), name='my-review-detail'),
]

# Product variants (nested under product)
urlpatterns += [
    path('products/<slug:product_slug>/variants/',
         ProductVariantListCreateView.as_view(), name='product-variants'),
    path('products/<slug:product_slug>/variants/<uuid:variant_id>/',
         ProductVariantDetailView.as_view(), name='product-variant-detail'),
]

# Admin product actions
urlpatterns += [
    path('products/<uuid:pk>/admin-toggle/', AdminMallProductToggleView.as_view(), name='product-admin-toggle'),
]

# Product Q&A (nested under product)
urlpatterns += [
    path('products/<slug:slug>/questions/',
         ProductQuestionListView.as_view(), name='product-questions'),
    path('products/<slug:slug>/questions/<uuid:question_id>/answer/',
         SellerAnswerQuestionView.as_view(), name='product-question-answer'),
]

# Cart URLs (mounted separately under /api/v1/cart/)
cart_urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('add/', CartAddItemView.as_view(), name='cart-add'),
    path('update/<uuid:item_id>/', CartUpdateItemView.as_view(), name='cart-update'),
    path('remove/<uuid:item_id>/', CartRemoveItemView.as_view(), name='cart-remove'),
    path('clear/', CartClearView.as_view(), name='cart-clear'),
    path('apply-coupon/', CartApplyCouponView.as_view(), name='cart-apply-coupon'),
    path('remove-coupon/', CartRemoveCouponView.as_view(), name='cart-remove-coupon'),
    path('summary/', CartSummaryView.as_view(), name='cart-summary'),
]

# Wishlist URLs (mounted under /api/v1/wishlist/)
wishlist_urlpatterns = [
    path('', WishlistView.as_view(), name='wishlist'),
    path('toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
]

# Seller product URLs (mounted under /api/v1/seller/products/)
seller_product_urlpatterns = [
    path('', SellerProductListView.as_view(), name='seller-products'),
    path('bulk-upload/', SellerBulkProductUploadView.as_view(), name='seller-bulk-upload'),
]

# Seller review URLs (mounted under /api/v1/seller/reviews/)
seller_review_urlpatterns = [
    path('', SellerReviewsListView.as_view(), name='seller-reviews'),
    path('<uuid:review_id>/reply/', SellerReplyToReviewView.as_view(), name='seller-reply'),
]

# Mall chat URLs (mounted under /api/v1/mall/chats/)
chat_urlpatterns = [
    path('buyer/', BuyerChatListView.as_view(), name='buyer-chats'),
    path('start/', StartStoreChatView.as_view(), name='chat-start'),
    path('<uuid:pk>/messages/', StoreChatMessagesView.as_view(), name='chat-messages'),
    path('<uuid:pk>/send/', SendStoreMessageView.as_view(), name='chat-send'),
    path('<uuid:pk>/mark-read/', MarkStoreMessagesReadView.as_view(), name='chat-mark-read'),
]

# Seller chat URLs (mounted under /api/v1/seller/chats/)
seller_chat_urlpatterns = [
    path('', SellerChatListView.as_view(), name='seller-chats'),
]
