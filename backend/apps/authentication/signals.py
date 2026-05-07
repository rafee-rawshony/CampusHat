"""
Authentication Signals.

Handles post-save actions for User and UserVerification models:
- On approval: update user reputation score based on tier, elevate role.
- On user creation: auto-create user wallet.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.wallet.models import Wallet
from .models import User, UserVerification


@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.get_or_create(
            owner=instance,
            defaults={'wallet_type': 'user'}
        )


@receiver(post_save, sender=UserVerification)
def handle_verification_status_change(sender, instance, **kwargs):
    """
    When a verification is approved:
    1. Elevate user role if student_id or faculty_id.
    2. Increase reputation score based on tier.
    """
    if instance.status != 'approved':
        return

    user = instance.user
    update_user_fields = set()

    # Elevate role based on verification type
    if getattr(user, 'role', None) == 'normal_user':
        if instance.verification_type == 'student_id':
            user.role = 'student'
            update_user_fields.add('role')
        elif instance.verification_type == 'faculty_id':
            user.role = 'faculty'
            update_user_fields.add('role')

    # Reputation score increase
    tier_scores = {
        'bronze': 10,
        'silver': 20,
        'gold': 30,
    }
    score_increase = tier_scores.get(instance.verification_tier, 0)
    if score_increase > 0:
        user.reputation_score += score_increase
        update_user_fields.add('reputation_score')

    if update_user_fields:
        user.save(update_fields=list(update_user_fields))
