"""Delivery URLs."""
from django.urls import path
from .views import AdminDeliveryUpdateView, PublicTrackingView

app_name = 'delivery'

urlpatterns = [
    path('track/<str:tracking_code>/', PublicTrackingView.as_view(), name='track'),
]

admin_delivery_urlpatterns = [
    path('<uuid:delivery_id>/update-status/', AdminDeliveryUpdateView.as_view(), name='admin-update'),
]
