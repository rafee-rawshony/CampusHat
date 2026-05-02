"""
Wallet Views.

Balance check, transaction history, and top-up initiation.
"""

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.viewsets import ModelViewSet

from core.wallet_engine import create_wallet_transaction

from .models import UserPaymentMethod, Wallet, WalletTransaction
from .serializers import (
    TopUpSerializer,
    UserPaymentMethodSerializer,
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


# =============================================================================
# USER PAYMENT METHOD VIEWSET
# =============================================================================

class UserPaymentMethodViewSet(ModelViewSet):
    """
    CRUD for the user's saved payment methods (bKash, Nagad, card, etc.).

    list:    GET    /api/v1/wallet/payment-methods/
    create:  POST   /api/v1/wallet/payment-methods/
    update:  PATCH  /api/v1/wallet/payment-methods/{id}/
    destroy: DELETE /api/v1/wallet/payment-methods/{id}/  (soft delete)
    set_default: POST /api/v1/wallet/payment-methods/{id}/set-default/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserPaymentMethodSerializer
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        # Only this user's non-deleted methods.
        return UserPaymentMethod.objects.filter(
            user=self.request.user, deleted_at__isnull=True,
        )

    def perform_destroy(self, instance):
        instance.soft_delete()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Payment method added successfully.',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Payment method updated.',
            'data': serializer.data,
        })

    def destroy(self, request, *args, **kwargs):
        self.perform_destroy(self.get_object())
        return Response({
            'success': True,
            'message': 'Payment method removed.',
        })

    @action(detail=True, methods=['post'], url_path='set-default')
    def set_default(self, request, pk=None):
        method = self.get_object()
        method.is_default = True
        method.save()  # Model save() handles unsetting other defaults atomically.
        return Response({
            'success': True,
            'message': 'Default payment method updated.',
            'data': UserPaymentMethodSerializer(method).data,
        })
