"""
Seller Signals.

post_save on SellerProfile: queue notification on status change.

NOTE: Seller approval does NOT change user.role.
Seller access is controlled entirely by SellerProfile.status = 'approved'.
The 'seller' role in ROLE_CHOICES is reserved for admin manual assignment only.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='sellers.SellerProfile')
def seller_status_changed(sender, instance, created, **kwargs):
    """When seller status changes to approved/rejected, notify the user."""
    if created:
        return
    if instance.status in ('approved', 'rejected'):
        try:
            from .tasks import notify_seller_approval_result
            notify_seller_approval_result.delay(str(instance.id))
        except Exception:
            pass
