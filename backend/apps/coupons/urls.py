"""Coupon and Flash Sale URLs."""

from django.urls import path

from .views import (
    ActiveCouponsListView,
    ActiveFlashSalesView,
    AdminCouponDetailView,
    AdminCouponListView,
    AdminFlashSaleAddProductsView,
    AdminFlashSaleDetailView,
    AdminFlashSaleListView,
    CouponValidateView,
    FlashSaleDetailView,
    SellerCouponDetailView,
    SellerCouponListView,
    SellerFlashSaleAddProductsView,
    SellerFlashSaleListView,
    SellerFlashSaleProductDetailView,
)

app_name = 'coupons'

# Public
urlpatterns = [
    path('active/', ActiveCouponsListView.as_view(), name='active'),
    path('validate/', CouponValidateView.as_view(), name='validate'),
]

# Flash sales — public
flash_sale_urlpatterns = [
    path('active/', ActiveFlashSalesView.as_view(), name='active'),
    path('<uuid:flash_sale_id>/', FlashSaleDetailView.as_view(), name='detail'),
]

# Seller coupons
seller_coupon_urlpatterns = [
    path('', SellerCouponListView.as_view(), name='seller-list'),
    path('<uuid:coupon_id>/', SellerCouponDetailView.as_view(), name='seller-detail'),
]

# Seller flash sales — sellers can only manage their own products in admin-created sales
seller_flash_sale_urlpatterns = [
    path('', SellerFlashSaleListView.as_view(), name='seller-list'),
    path('<uuid:flash_sale_id>/add-products/', SellerFlashSaleAddProductsView.as_view(), name='seller-add-products'),
    path(
        '<uuid:flash_sale_id>/products/<uuid:fsp_id>/',
        SellerFlashSaleProductDetailView.as_view(),
        name='seller-product-detail',
    ),
]

# Admin coupons
admin_coupon_urlpatterns = [
    path('', AdminCouponListView.as_view(), name='admin-list'),
    path('<uuid:coupon_id>/', AdminCouponDetailView.as_view(), name='admin-detail'),
]

# Admin flash sales
admin_flash_sale_urlpatterns = [
    path('', AdminFlashSaleListView.as_view(), name='admin-list'),
    path('<uuid:flash_sale_id>/', AdminFlashSaleDetailView.as_view(), name='admin-detail'),
    path('<uuid:flash_sale_id>/add-products/', AdminFlashSaleAddProductsView.as_view(), name='admin-add-products'),
]
