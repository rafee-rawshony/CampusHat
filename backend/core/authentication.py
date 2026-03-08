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

        # If user has sessions and ALL are revoked → block
        sessions_exist = UserSession.objects.filter(
            user_id=user_id,
            expires_at__gt=timezone.now()
        ).exists()

        if sessions_exist:
            active_exists = UserSession.objects.filter(
                user_id=user_id,
                expires_at__gt=timezone.now(),
                revoked=False
            ).exists()
            if not active_exists:
                raise AuthenticationFailed(
                    {'code': 'SESSION_REVOKED',
                     'detail': 'All sessions have been revoked. Please log in again.'}
                )

        return validated_token
