"""Wallet serializers."""

from decimal import Decimal

from rest_framework import serializers

from .models import Payment, UserPaymentMethod, Wallet, WalletTransaction


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


# =============================================================================
# USER PAYMENT METHOD (saved bKash/Nagad/Card etc.)
# =============================================================================

class UserPaymentMethodSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for a user's saved payment methods."""

    method_display = serializers.CharField(source='get_method_display', read_only=True)
    masked_account = serializers.SerializerMethodField()

    class Meta:
        model = UserPaymentMethod
        fields = [
            'id', 'method', 'method_display', 'label',
            'account_holder_name', 'account_number', 'masked_account',
            'card_last4', 'card_brand', 'card_expiry',
            'is_default', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'method_display', 'masked_account', 'created_at', 'updated_at']

    def get_masked_account(self, obj):
        """Mask the account number for display — e.g. +88017******21."""
        acct = obj.account_number or ''
        if obj.method == 'card' and obj.card_last4:
            return f'**** **** **** {obj.card_last4}'
        if len(acct) <= 4:
            return acct
        return acct[:4] + '*' * (len(acct) - 6) + acct[-2:]

    def validate(self, attrs):
        # Mobile wallet phone numbers should be 11+ digits.
        method = attrs.get('method') or (self.instance and self.instance.method)
        account_number = attrs.get('account_number') or (self.instance and self.instance.account_number)

        if method in ['bkash', 'nagad', 'rocket', 'upay', 'tap']:
            digits = ''.join(filter(str.isdigit, account_number or ''))
            if len(digits) < 11:
                raise serializers.ValidationError({
                    'account_number': 'Mobile wallet number must be at least 11 digits.',
                })
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        # First saved method becomes default automatically.
        if not UserPaymentMethod.objects.filter(
            user=validated_data['user'], deleted_at__isnull=True,
        ).exists():
            validated_data['is_default'] = True
        return super().create(validated_data)
