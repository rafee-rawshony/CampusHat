"""Wallet serializers."""

from decimal import Decimal

from rest_framework import serializers

from .models import Payment, Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    """Read-only wallet info."""

    class Meta:
        model = Wallet
        fields = [
            'id', 'wallet_type', 'balance', 'locked_balance',
            'currency', 'created_at',
        ]
        read_only_fields = fields


class WalletTransactionSerializer(serializers.ModelSerializer):
    """Read-only transaction record."""

    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'transaction_type', 'amount',
            'balance_before', 'balance_after',
            'reason', 'reference_type', 'reference_id',
            'description', 'created_at',
        ]
        read_only_fields = fields


class TopUpSerializer(serializers.Serializer):
    """Initiate a wallet top-up."""

    amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal('1.00'),
    )
    method = serializers.ChoiceField(
        choices=['bkash', 'nagad', 'rocket', 'card'],
    )


class PaymentSerializer(serializers.ModelSerializer):
    """Payment detail."""

    class Meta:
        model = Payment
        fields = [
            'id', 'method', 'amount', 'currency', 'status',
            'gateway_transaction_id', 'paid_at', 'created_at',
        ]
        read_only_fields = fields
