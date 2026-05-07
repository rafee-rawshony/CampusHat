"""
Refund Model.

Tracks refund requests with evidence, atomic wallet reversal,
and commission correction.
"""

from decimal import Decimal

from django.conf import settings
from django.db import models

from core.models import BaseModel


class Refund(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
    ]

    METHOD_CHOICES = [
        ('wallet', 'Wallet'),
        ('original_payment', 'Original Payment'),
    ]

    order = models.ForeignKey(
        'orders.Order', on_delete=models.PROTECT,
        related_name='refunds', db_index=True,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='refund_requests',
    )
    reason = models.TextField()
    evidence_urls = models.JSONField(default=list, blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_reversal_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
    )
    seller_deduction_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
    )
    refund_method = models.CharField(
        max_length=20, choices=METHOD_CHOICES, default='wallet',
    )
    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES,
        default='pending', db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='refunds_reviewed',
    )
    rejection_reason = models.TextField(blank=True, null=True)
    seller_response = models.CharField(
        max_length=20,
        choices=[('accepted', 'Accepted'), ('disputed', 'Disputed')],
        null=True, blank=True,
    )
    seller_response_note = models.TextField(null=True, blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = 'refunds'

    def __str__(self):
        return f'Refund {self.id} for Order {self.order.order_number}'
