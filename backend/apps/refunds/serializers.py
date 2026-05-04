"""Refund serializers."""

from rest_framework import serializers
from .models import Refund


class RefundListSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Refund
        fields = [
            'id', 'order', 'order_number', 'refund_amount',
            'status', 'reason', 'seller_response', 'seller_response_note',
            'created_at',
        ]
        read_only_fields = fields


class RefundDetailSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    reviewed_by_email = serializers.CharField(
        source='reviewed_by.email', read_only=True, default=None,
    )

    class Meta:
        model = Refund
        fields = [
            'id', 'order', 'order_number',
            'reason', 'evidence_urls',
            'refund_amount', 'commission_reversal_amount',
            'seller_deduction_amount', 'refund_method',
            'status', 'reviewed_by_email', 'rejection_reason',
            'seller_response', 'seller_response_note',
            'approved_at', 'processed_at', 'created_at',
        ]
        read_only_fields = fields


class RefundRequestSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    reason = serializers.CharField()


class AdminRefundActionSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
