"""Wallet URL Configuration."""

from django.urls import path

from .views import WalletBalanceView, WalletTopUpView, WalletTransactionListView

app_name = 'wallet'

urlpatterns = [
    path('balance/', WalletBalanceView.as_view(), name='balance'),
    path('transactions/', WalletTransactionListView.as_view(), name='transactions'),
    path('topup/', WalletTopUpView.as_view(), name='topup'),
]
