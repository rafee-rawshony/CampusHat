"""
Seller Signals.

post_save on SellerProfile: elevate user role on approval, notify on status change.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='sellers.SellerProfile')
def seller_status_changed(sender, instance, created, **kwargs):
    """
    When seller is approved: set user role to 'seller'.
    When seller is rejected/suspended: revert role to 'student' or 'normal_user'.
    Also queues a notification task in both cases.
    """
    if created:
        return

    user = instance.user

    if instance.status == 'approved':
        # Elevate role to seller if not already admin/moderator
        safe_roles = ('admin', 'moderator', 'seller_mod', 'marketplace_mod')
        if getattr(user, 'role', None) not in safe_roles and user.role != 'seller':
            user.role = 'seller'
            user.save(update_fields=['role'])

    elif instance.status in ('rejected', 'suspended'):
        # Revert back to student (if verified) or normal_user
        if getattr(user, 'role', None) == 'seller':
            has_student_verification = user.verifications.filter(
                verification_type='student_id', status='approved',
            ).exists()
            user.role = 'student' if has_student_verification else 'normal_user'
            user.save(update_fields=['role'])

    if instance.status in ('approved', 'rejected'):
        try:
            from .tasks import notify_seller_approval_result
            notify_seller_approval_result.delay(str(instance.id))
        except Exception:
            pass
