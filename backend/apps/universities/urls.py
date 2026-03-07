"""
University URL Configuration.

Routes all university endpoints through the DRF router.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import UniversityViewSet

router = DefaultRouter()
router.register(r'', UniversityViewSet, basename='university')

app_name = 'universities'

urlpatterns = [
    path('', include(router.urls)),
]
