"""
Authentication Signals.

Handles post-save actions for UserVerification model:
- On approval: update user reputation score based on tier
- Send notification to user about verification result
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserVerification


@receiver(post_save, sender=UserVerification)
def handle_verification_status_change(sender, instance, **kwargs):
    """
    When a verification is approved, increase the user's reputation score
    based on the verification tier:
    - Bronze: +10
    - Silver: +20
    - Gold:   +30
    """
    if instance.status != 'approved':
        return

    tier_scores = {
        'bronze': 10,
        'silver': 20,
        'gold': 30,
    }

    score_increase = tier_scores.get(instance.verification_tier, 0)
    if score_increase > 0:
        user = instance.user
        user.reputation_score += score_increase
        user.save(update_fields=['reputation_score'])
