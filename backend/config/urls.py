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

urlpatterns = [
    # --- Admin ---
    path('admin/', admin.site.urls),

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

    # Phase 04+ app URLs will be added here:
    # path('api/v1/users/', include('apps.users.urls')),
    # path('api/v1/mall/', include('apps.mall.urls')),
    # path('api/v1/marketplace/', include('apps.marketplace.urls')),
    # path('api/v1/orders/', include('apps.orders.urls')),
    # path('api/v1/payments/', include('apps.payments.urls')),
    # path('api/v1/notifications/', include('apps.notifications.urls')),
    # path('api/v1/reviews/', include('apps.reviews.urls')),
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
