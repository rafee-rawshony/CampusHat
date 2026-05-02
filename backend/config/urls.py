"""
CampusHat URL Configuration.

Project-level URL routing. All API endpoints are namespaced under /api/v1/.
API documentation is available at /api/docs/ via drf-spectacular.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.core.views import health_check
from core.upload_views import FileUploadView

urlpatterns = [
    # --- Health Check ---
    path('api/health/', health_check, name='health-check'),

    # --- Universal file upload (images) ---
    path('api/v1/uploads/', FileUploadView.as_view(), name='file-upload'),

    # --- Django built-in admin (moved to avoid conflict with Next.js /admin route) ---
    path('django-admin/', admin.site.urls),

    # --- API Documentation ---
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path(
        'api/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),

    # --- API v1 ---
    path('api/v1/universities/', include('apps.universities.urls')),
    path('api/v1/auth/', include('apps.authentication.urls')),

    # --- Admin API (Phase 03) ---
    path('api/v1/admin/verifications/',
         include(('apps.authentication.admin_urls', 'admin-verifications'))),

    # --- Marketplace (Phase 04) ---
    path('api/v1/marketplace/', include('apps.marketplace.urls')),

    # --- Admin Marketplace (Phase 04) ---
    path('api/v1/admin/marketplace/',
         include(('apps.marketplace.admin_urls', 'admin-marketplace'))),

    # --- Sellers (Phase 05) ---
    path('api/v1/sellers/', include(('apps.sellers.urls', 'sellers'))),

    # --- Admin Sellers (Phase 05) ---

    # --- Mall (Phase 06) ---
    path('api/v1/mall/', include('apps.mall.urls')),

    # --- Cart (Phase 06) ---
    # Cart URLs are imported below from apps.mall.urls

    # --- Wallet (Phase 07) ---
    path('api/v1/wallet/', include('apps.wallet.urls')),

    # --- Orders (Phase 07) ---
    path('api/v1/orders/', include('apps.orders.urls')),

    # --- Refunds (Phase 08) ---
    path('api/v1/refunds/', include('apps.refunds.urls')),

    # --- Delivery (Phase 08) ---
    path('api/v1/delivery/', include('apps.delivery.urls')),


    # --- Coupons (Phase 08) ---
    path('api/v1/coupons/', include('apps.coupons.urls')),

    # Phase 10+ app URLs will be added here:
]


# --- Phase 05 URL patterns from sellers ---
from apps.sellers.urls import store_urlpatterns
from apps.sellers.admin_urls import (
    seller_admin_urlpatterns,
    store_admin_urlpatterns,
    payout_admin_urlpatterns,
)

# --- Phase 06 Cart + Wishlist + Seller Products URL patterns ---
from apps.mall.urls import cart_urlpatterns, wishlist_urlpatterns, seller_product_urlpatterns

# --- Phase 07 Order URL patterns (seller + admin) ---
from apps.orders.urls import seller_order_urlpatterns, admin_order_urlpatterns

# --- Phase 08 URL patterns ---
from apps.refunds.urls import admin_refund_urlpatterns
from apps.delivery.urls import admin_delivery_urlpatterns
from apps.coupons.urls import (
    flash_sale_urlpatterns,
    seller_coupon_urlpatterns,
    seller_flash_sale_urlpatterns,
    admin_coupon_urlpatterns,
    admin_flash_sale_urlpatterns,
)

# --- Phase 09 URL patterns ---
from apps.admin_panel.urls import (
    notification_urlpatterns,
    admin_dashboard_urlpatterns,
    admin_user_urlpatterns,
    admin_role_urlpatterns,
    admin_wallet_urlpatterns as admin_panel_wallet_urlpatterns,
    admin_notification_urlpatterns,
    admin_log_urlpatterns,
    admin_permissions_urlpatterns,
)

# --- Phase 10 URL patterns ---
from apps.analytics.urls import seller_analytics_urlpatterns, admin_analytics_urlpatterns

urlpatterns += [
    path('api/v1/stores/', include((store_urlpatterns, 'stores'))),
    path('api/v1/admin/sellers/', include((seller_admin_urlpatterns, 'admin-sellers'))),
    path('api/v1/admin/stores/', include((store_admin_urlpatterns, 'admin-stores'))),
    path('api/v1/admin/payouts/', include((payout_admin_urlpatterns, 'admin-payouts'))),
    path('api/v1/cart/', include((cart_urlpatterns, 'cart'))),
    path('api/v1/wishlist/', include((wishlist_urlpatterns, 'wishlist'))),
    path('api/v1/seller/orders/', include((seller_order_urlpatterns, 'seller-orders'))),
    path('api/v1/seller/products/', include((seller_product_urlpatterns, 'seller-products'))),
    path('api/v1/admin/orders/', include((admin_order_urlpatterns, 'admin-orders'))),
    # Phase 08
    path('api/v1/admin/refunds/', include((admin_refund_urlpatterns, 'admin-refunds'))),
    path('api/v1/admin/delivery/', include((admin_delivery_urlpatterns, 'admin-delivery'))),
    path('api/v1/seller/coupons/', include((seller_coupon_urlpatterns, 'seller-coupons'))),
    path('api/v1/seller/flash-sales/', include((seller_flash_sale_urlpatterns, 'seller-flash-sales'))),
    path('api/v1/admin/coupons/', include((admin_coupon_urlpatterns, 'admin-coupons'))),
    path('api/v1/admin/flash-sales/', include((admin_flash_sale_urlpatterns, 'admin-flash-sales'))),
    path('api/v1/flash-sales/', include((flash_sale_urlpatterns, 'flash-sales'))),
    # Phase 09
    path('api/v1/notifications/', include((notification_urlpatterns, 'notifications'))),
    path('api/v1/admin/dashboard/', include((admin_dashboard_urlpatterns, 'admin-dashboard'))),
    path('api/v1/admin/users/', include((admin_user_urlpatterns, 'admin-users'))),
    path('api/v1/admin/roles/', include((admin_role_urlpatterns, 'admin-roles'))),
    path('api/v1/admin/wallet/', include((admin_panel_wallet_urlpatterns, 'admin-wallet'))),
    path('api/v1/admin/notifications/', include((admin_notification_urlpatterns, 'admin-notifications'))),
    path('api/v1/admin/action-logs/', include((admin_log_urlpatterns, 'admin-logs'))),
    path('api/v1/admin/', include((admin_permissions_urlpatterns, 'admin-permissions'))),
    # Phase 10
    path('api/v1/analytics/seller/', include((seller_analytics_urlpatterns, 'seller-analytics'))),
    path('api/v1/admin/analytics/', include((admin_analytics_urlpatterns, 'admin-analytics'))),
]




# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    # Django Debug Toolbar
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

# Admin site customization
admin.site.site_header = 'CampusHat Administration'
admin.site.site_title = 'CampusHat Admin'
admin.site.index_title = 'Dashboard'
