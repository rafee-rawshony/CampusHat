"""
Admin Verification URL Configuration.

Endpoints for the admin verification review queue, exposed under
/api/v1/admin/verifications/.
"""

from django.urls import path

from .verification_views import (
    AdminVerificationDetailView,
    AdminVerificationListView,
    AdminVerificationReviewView,
)

urlpatterns = [
    path('', AdminVerificationListView.as_view(), name='list'),
    path('<uuid:pk>/', AdminVerificationDetailView.as_view(), name='detail'),
    path('<uuid:pk>/review/', AdminVerificationReviewView.as_view(), name='review'),
]
