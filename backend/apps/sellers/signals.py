"""
Seller Signals.

post_save on SellerProfile: queue notification on status change.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='sellers.SellerProfile')
def seller_status_changed(sender, instance, created, **kwargs):
    """When seller status changes to approved/rejected, notify."""
    if created:
        return
    # Check if status was updated
    if instance.status in ('approved', 'rejected'):
        try:
            from .tasks import notify_seller_approval_result
            notify_seller_approval_result.delay(str(instance.id))
        except Exception:
            pass
