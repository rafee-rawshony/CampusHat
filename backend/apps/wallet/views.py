"""
Wallet Views.

Balance check, transaction history, and top-up initiation.
"""

from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView

from core.wallet_engine import create_wallet_transaction

from .models import Wallet, WalletTransaction
from .serializers import (
    TopUpSerializer,
    WalletSerializer,
    WalletTransactionSerializer,
)


class WalletBalanceView(GenericAPIView):
    """GET /api/v1/wallet/balance/ — get user's wallet balance."""

    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get(self, request):
        wallet = Wallet.get_or_create_user_wallet(request.user, 'user')
        serializer = self.get_serializer(wallet)
        return Response({
            'success': True,
            'message': 'Request successful.',
            'data': serializer.data,
        })


class WalletTransactionListView(GenericAPIView):
    """GET /api/v1/wallet/transactions/ — paginated transaction history."""

    permission_classes = [IsAuthenticated]
    serializer_class = WalletTransactionSerializer

    def get(self, request):
        wallet = Wallet.get_or_create_user_wallet(request.user, 'user')
        transactions = WalletTransaction.objects.filter(
            wallet=wallet,
        ).order_by('-created_at')

        # Basic pagination
        from core.pagination import CampusHatPagination
        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(transactions, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = self.get_serializer(transactions, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class WalletTopUpView(GenericAPIView):
    """POST /api/v1/wallet/topup/ — initiate gateway top-up."""

    permission_classes = [IsAuthenticated]
    serializer_class = TopUpSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        method = serializer.validated_data['method']

        wallet = Wallet.get_or_create_user_wallet(request.user, 'user')

        # In production, this would redirect to a payment gateway.
        # For now, we directly credit the wallet (dev/testing mode).
        with transaction.atomic():
            updated_wallet = create_wallet_transaction(
                wallet=wallet,
                txn_type='credit',
                amount=amount,
                reason='topup',
                description=f'Wallet top-up via {method}',
                created_by=request.user,
            )

        return Response({
            'success': True,
            'message': f'Wallet topped up with {amount} BDT.',
            'data': WalletSerializer(updated_wallet).data,
        })
