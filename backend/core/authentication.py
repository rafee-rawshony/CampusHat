import hashlib
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class RevokedSessionJWTAuthentication(JWTAuthentication):
    """
    Extends SimpleJWT to reject tokens whose session
    has been revoked via force-logout.
    """

    def get_validated_token(self, raw_token):
        validated_token = super().get_validated_token(raw_token)

        # Extract user_id from token payload
        user_id = validated_token.get('user_id')
        if not user_id:
            return validated_token

        # Check: does any active non-revoked session exist for this user?
        # (We check at the user level — if ALL sessions are revoked, block.)
        # For per-token revocation, hash matching is needed.
        # This is the lightweight version (per-user force-logout):
        from apps.authentication.models import UserSession
        from django.utils import timezone

        # Single aggregation query: count total + active sessions in one round-trip.
        # If user has any session but no ACTIVE (non-revoked) one → block.
        from django.db.models import Count, Q
        now = timezone.now()
        agg = UserSession.objects.filter(
            user_id=user_id,
            expires_at__gt=now,
        ).aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(revoked=False)),
        )

        if agg['total'] > 0 and agg['active'] == 0:
            raise AuthenticationFailed(
                {'code': 'SESSION_REVOKED',
                 'detail': 'All sessions have been revoked. Please log in again.'}
            )

        return validated_token
