"""
CampusHat Wallet Models.

Phase 07: Wallet, WalletTransaction (immutable ledger), and Payment.

Design:
  - Wallet balance is always computed from transactions.
  - WalletTransaction records are IMMUTABLE — save() raises on update.
  - Platform wallet has owner=None, wallet_type='platform'.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import BaseModel, TimestampMixin, UUIDMixin


# =============================================================================
# MODEL 1: WALLET
# =============================================================================

class Wallet(BaseModel):
    """
    Wallet for users, sellers, and the platform.

    Balance is a READ-ONLY computed field — always derived from
    the sum of wallet transactions. Never write directly.
    """

    WALLET_TYPE_CHOICES = [
        ('user', 'User Wallet'),
        ('seller', 'Seller Wallet'),
        ('platform', 'Platform Wallet'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='wallets',
        help_text='NULL for the platform wallet.',
    )
    wallet_type = models.CharField(
        max_length=10,
        choices=WALLET_TYPE_CHOICES,
        db_index=True,
    )
    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        help_text='Computed from transactions. Do not write directly.',
    )
    locked_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
    )
    currency = models.CharField(max_length=5, default='BDT')

    class Meta(BaseModel.Meta):
        db_table = 'wallets'
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'wallet_type'],
                name='unique_owner_wallet_type',
            ),
        ]

    def __str__(self):
        if self.owner:
            return f'{self.wallet_type} wallet — {self.owner.email}'
        return 'Platform Wallet'

    def refresh_balance(self):
        """Recalculate balance from the immutable transaction ledger."""
        from django.db.models import Sum

        credits = self.transactions.filter(
            transaction_type='credit',
        ).aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')

        debits = self.transactions.filter(
            transaction_type='debit',
        ).aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')

        self.balance = credits - debits
        self.save(update_fields=['balance', 'updated_at'])

    @classmethod
    def get_platform_wallet(cls):
        """Get or create the single platform wallet."""
        wallet, _ = cls.objects.get_or_create(
            wallet_type='platform',
            owner=None,
            defaults={'currency': 'BDT'},
        )
        return wallet

    @classmethod
    def get_or_create_user_wallet(cls, user, wallet_type='user'):
        """Get or create a wallet for a user."""
        wallet, _ = cls.objects.get_or_create(
            owner=user,
            wallet_type=wallet_type,
            defaults={'currency': 'BDT'},
        )
        return wallet


# =============================================================================
# MODEL 2: WALLET TRANSACTION (IMMUTABLE LEDGER)
# =============================================================================

class WalletTransaction(UUIDMixin):
    """
    Immutable wallet transaction record.

    CRITICAL: Once created, these records can NEVER be updated or deleted.
    The save() method raises PermissionError if pk already exists.
    """

    TRANSACTION_TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    ]

    REASON_CHOICES = [
        ('order_payment', 'Order Payment'),
        ('commission', 'Commission'),
        ('seller_credit', 'Seller Credit'),
        ('refund', 'Refund'),
        ('payout', 'Payout'),
        ('topup', 'Top-Up'),
        ('cashback', 'Cashback'),
    ]

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.PROTECT,
        related_name='transactions',
        db_index=True,
    )
    transaction_type = models.CharField(
        max_length=6, choices=TRANSACTION_TYPE_CHOICES,
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    balance_before = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text='Wallet balance snapshot before this transaction.',
    )
    balance_after = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text='Wallet balance snapshot after this transaction.',
    )
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    reference_type = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="e.g. 'order', 'refund', 'payout'.",
    )
    reference_id = models.UUIDField(
        blank=True, null=True, db_index=True,
    )
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wallet_transactions_created',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'wallet_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', 'created_at']),
            models.Index(fields=['reference_id', 'reference_type']),
        ]

    def __str__(self):
        return (
            f'{self.transaction_type.upper()} {self.amount} BDT — '
            f'{self.reason} ({self.created_at})'
        )

    def save(self, *args, **kwargs):
        """Override save to prevent updates — records are immutable."""
        if self.pk and WalletTransaction.objects.filter(pk=self.pk).exists():
            raise PermissionError(
                'WalletTransaction records are immutable. '
                'Cannot update an existing transaction.'
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Prevent deletion of transaction records."""
        raise PermissionError(
            'WalletTransaction records cannot be deleted.'
        )


# =============================================================================
# MODEL 3: PAYMENT
# =============================================================================

class Payment(BaseModel):
    """
    Payment record linked to an order.

    Tracks gateway responses and status for each payment attempt.
    """

    METHOD_CHOICES = [
        ('wallet', 'Wallet'),
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('card', 'Card'),
        ('cod', 'Cash on Delivery'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.PROTECT,
        related_name='payments',
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default='BDT')
    gateway_transaction_id = models.CharField(
        max_length=200, blank=True, null=True, unique=True,
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='pending', db_index=True,
    )
    gateway_response = models.JSONField(blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = 'payments'
        indexes = [
            models.Index(fields=['order', 'status']),
        ]

    def __str__(self):
        return f'Payment {self.method} — {self.amount} BDT ({self.status})'
