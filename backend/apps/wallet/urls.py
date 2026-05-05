"""Wallet URL Configuration."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    UserPaymentMethodViewSet,
    WalletBalanceView,
    WalletTopUpView,
    WalletTransactionListView,
)

app_name = 'wallet'

# Router for the saved payment methods viewset.
router = DefaultRouter()
router.register(r'payment-methods', UserPaymentMethodViewSet, basename='payment-method')

urlpatterns = [
    path('balance/', WalletBalanceView.as_view(), name='balance'),
    path('transactions/', WalletTransactionListView.as_view(), name='transactions'),
    path('topup/', WalletTopUpView.as_view(), name='topup'),
    path('', include(router.urls)),
]
