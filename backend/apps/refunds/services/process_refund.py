"""
Atomic Refund Processing Service.

Reverses buyer debit, seller credit, and platform commission
in a single atomic transaction.
"""

from django.db import transaction
from django.utils import timezone

from apps.wallet.models import Wallet
from core.wallet_engine import create_wallet_transaction


def process_approved_refund(refund, admin_user):
    """
    Process an approved refund atomically.

    Reverses:
      1. Credits buyer wallet with refund_amount
      2. Debits seller wallet with seller_deduction_amount
      3. Debits platform wallet with commission_reversal_amount
      4. Updates refund status to 'processed'
      5. Updates order payment_status to 'refunded'

    Args:
        refund: Approved Refund instance.
        admin_user: Admin processing the refund.

    Raises:
        ValueError: If refund is not in 'approved' status.
    """
    if refund.status != 'approved':
        raise ValueError(
            f"Refund must be 'approved' to process. Current: {refund.status}"
        )

    with transaction.atomic():
        # Lock wallets
        buyer_wallet = Wallet.objects.select_for_update().get(
            owner=refund.order.buyer, wallet_type='user',
        )
        seller_wallet = Wallet.objects.select_for_update().get(
            owner=refund.order.store.seller.user, wallet_type='seller',
        )
        platform_wallet = Wallet.get_platform_wallet()
        platform_wallet = Wallet.objects.select_for_update().get(
            pk=platform_wallet.pk,
        )

        # Reverse: credit buyer
        create_wallet_transaction(
            wallet=buyer_wallet, txn_type='credit',
            amount=refund.refund_amount, reason='refund',
            reference_type='refund', reference_id=refund.id,
            description=f'Refund for order {refund.order.order_number}',
            created_by=admin_user,
        )

        # Reverse: debit seller
        create_wallet_transaction(
            wallet=seller_wallet, txn_type='debit',
            amount=refund.seller_deduction_amount, reason='refund',
            reference_type='refund', reference_id=refund.id,
            description=f'Refund deduction for order {refund.order.order_number}',
            created_by=admin_user,
        )

        # Reverse: debit platform commission
        create_wallet_transaction(
            wallet=platform_wallet, txn_type='debit',
            amount=refund.commission_reversal_amount, reason='refund',
            reference_type='refund', reference_id=refund.id,
            description=f'Commission reversal for order {refund.order.order_number}',
            created_by=admin_user,
        )

        # Update refund
        refund.status = 'processed'
        refund.processed_at = timezone.now()
        refund.reviewed_by = admin_user
        refund.save(update_fields=[
            'status', 'processed_at', 'reviewed_by', 'updated_at',
        ])

        # Update order
        refund.order.payment_status = 'refunded'
        refund.order.save(update_fields=['payment_status', 'updated_at'])

        # Queue notification
        try:
            from apps.refunds.tasks import notify_refund_processed
            notify_refund_processed.delay(str(refund.id))
        except Exception:
            pass
