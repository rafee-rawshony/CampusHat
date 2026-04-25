"""
Mall URL Configuration.

All mall endpoints under /api/v1/mall/.
Cart endpoints under /api/v1/cart/.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
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
    ProductReviewCreateView,
    ProductReviewListView,
    ProductVariantDetailView,
    ProductVariantListCreateView,
    SellerProductListView,
    SellerReviewResponseView,
    StoreProductViewSet,
    WishlistToggleView,
    WishlistView,
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
    path('products/<slug:product_slug>/reviews/create/',
         ProductReviewCreateView.as_view(), name='product-review-create'),
    path('products/<slug:product_slug>/reviews/<uuid:review_id>/seller-response/',
         SellerReviewResponseView.as_view(), name='review-seller-response'),
]

# Product variants (nested under product)
urlpatterns += [
    path('products/<slug:product_slug>/variants/',
         ProductVariantListCreateView.as_view(), name='product-variants'),
    path('products/<slug:product_slug>/variants/<uuid:variant_id>/',
         ProductVariantDetailView.as_view(), name='product-variant-detail'),
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
]
