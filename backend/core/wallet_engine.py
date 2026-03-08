"""
CampusHat Wallet Engine.

Atomic wallet transaction creation with select_for_update().

CRITICAL: All calls to create_wallet_transaction() MUST be made
inside a transaction.atomic() block.
"""

from decimal import Decimal

from django.db import models

from apps.wallet.models import Wallet, WalletTransaction


class InsufficientBalanceError(Exception):
    """Raised when a debit exceeds the available wallet balance."""
    pass


def create_wallet_transaction(
    wallet,
    txn_type,
    amount,
    reason,
    reference_type=None,
    reference_id=None,
    description=None,
    created_by=None,
):
    """
    Create an atomic wallet transaction.

    MUST be called inside transaction.atomic().
    Uses select_for_update() to prevent race conditions.

    Args:
        wallet: Wallet instance to transact on.
        txn_type: 'credit' or 'debit'.
        amount: Decimal amount (must be > 0).
        reason: One of WalletTransaction.REASON_CHOICES.
        reference_type: e.g. 'order', 'refund', 'payout'.
        reference_id: UUID of the referenced object.
        description: Optional text description.
        created_by: User who initiated the transaction.

    Returns:
        The updated Wallet instance with new balance.

    Raises:
        InsufficientBalanceError: If debit exceeds balance.
        ValueError: If txn_type is invalid.
    """
    if txn_type not in ('credit', 'debit'):
        raise ValueError(f"Invalid transaction type: {txn_type}")

    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Transaction amount must be positive.")

    # Lock wallet row to prevent concurrent modifications
    wallet_locked = Wallet.objects.select_for_update().get(pk=wallet.pk)
    balance_before = wallet_locked.balance

    if txn_type == 'debit' and balance_before < amount:
        raise InsufficientBalanceError(
            f'Insufficient balance. Available: {balance_before}, '
            f'Requested: {amount}.'
        )

    if txn_type == 'credit':
        balance_after = balance_before + amount
    else:
        balance_after = balance_before - amount

    WalletTransaction.objects.create(
        wallet=wallet_locked,
        transaction_type=txn_type,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        reason=reason,
        reference_type=reference_type,
        reference_id=reference_id,
        description=description,
        created_by=created_by,
    )

    wallet_locked.balance = balance_after
    wallet_locked.save(update_fields=['balance', 'updated_at'])

    return wallet_locked
