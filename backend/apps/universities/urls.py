"""
University URL Configuration.

Routes university and institution-request endpoints through the DRF router.

Paths under this app's prefix (/api/v1/universities/):
    requests/                 -- InstitutionRequest list / create
    requests/{id}/            -- request detail
    requests/{id}/approve/    -- admin approve & create University
    requests/{id}/reject/     -- admin reject with reason
    search/                   -- search universities by name/short_name
    {slug}/                   -- university detail
    (root)                    -- university list / create
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InstitutionRequestViewSet, UniversityViewSet

# Register the more specific path first so it resolves before the catch-all
# University router that lives at the root of this URLconf.
router = DefaultRouter()
router.register(r'requests', InstitutionRequestViewSet, basename='institution-request')
router.register(r'', UniversityViewSet, basename='university')

app_name = 'universities'

urlpatterns = [
    path('', include(router.urls)),
]
