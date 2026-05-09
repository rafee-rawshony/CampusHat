"""
Google OAuth Authentication.

Handles "Sign in with Google" / "Sign up with Google" flow.
The frontend uses Google Identity Services (GIS) to obtain an ID token,
then POSTs it to /api/v1/auth/google/. We verify the token here, then
either create a new normal_user account or sign the existing user in,
and finally issue the same JWT payload as password login.
"""

import hashlib
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserSession
from .views import _build_login_user_data, _should_use_secure_refresh_cookie

logger = logging.getLogger(__name__)


class GoogleAuthSerializer(serializers.Serializer):
    """Input: Google ID token (JWT) returned by Google Identity Services."""
    credential = serializers.CharField()


def _verify_google_token(id_token_str: str) -> dict | None:
    """
    Verify a Google ID token using google-auth library.
    Returns the decoded payload (email, name, sub, picture) on success,
    or None if the token is invalid or expired.
    """
    try:
        # Lazy import — keep dependency optional in environments without Google OAuth.
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
    except ImportError:
        logger.error('google-auth package is not installed. Run: pip install google-auth')
        return None

    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
    if not client_id:
        logger.error('GOOGLE_OAUTH_CLIENT_ID not configured in settings.')
        return None

    try:
        payload = google_id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            client_id,
            clock_skew_in_seconds=10,
        )
    except ValueError as exc:
        # Token is invalid, expired, or audience mismatch
        logger.warning('Google ID token verification failed: %s', exc)
        return None

    # Ensure the issuer is actually Google
    if payload.get('iss') not in ('accounts.google.com', 'https://accounts.google.com'):
        logger.warning('Invalid issuer in Google ID token: %s', payload.get('iss'))
        return None

    return payload


class GoogleAuthView(APIView):
    """
    POST /api/v1/auth/google/

    Body: { "credential": "<Google ID token>" }

    On success returns the same shape as /auth/login/:
    { success, message, data: { access_token, user } }
    Also sets the refresh_token HttpOnly cookie.

    New users created via Google start with role='normal_user' and
    is_email_verified=True (Google has already verified the email).
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data['credential']

        payload = _verify_google_token(credential)
        if not payload:
            return Response({
                'success': False,
                'message': 'Invalid or expired Google sign-in token. Please try again.',
                'code': 'GOOGLE_TOKEN_INVALID',
            }, status=status.HTTP_400_BAD_REQUEST)

        email = (payload.get('email') or '').strip().lower()
        if not email or not payload.get('email_verified'):
            return Response({
                'success': False,
                'message': 'Google account email is not available or not verified.',
                'code': 'GOOGLE_EMAIL_INVALID',
            }, status=status.HTTP_400_BAD_REQUEST)

        full_name = (payload.get('name') or '').strip() or email.split('@')[0]
        picture = payload.get('picture') or None

        # Find or create user. Email is the unique identifier.
        user = User.objects.filter(email__iexact=email).first()
        is_new_user = False

        if not user:
            # New user → create as normal_user, email already verified by Google.
            user = User.objects.create_user(
                email=email,
                full_name=full_name,
                password=None,  # No password — they sign in via Google
                role='normal_user',
                is_email_verified=True,
                profile_picture=picture,
            )
            # create_user sets unusable password when password=None — keep it that way.
            user.set_unusable_password()
            user.save(update_fields=['password'])
            is_new_user = True
        else:
            # Existing user → keep their role, just update profile picture if missing
            # and mark email as verified (Google has confirmed it).
            updates = []
            if not user.is_email_verified:
                user.is_email_verified = True
                updates.append('is_email_verified')
            if picture and not user.profile_picture:
                user.profile_picture = picture
                updates.append('profile_picture')
            if updates:
                user.save(update_fields=updates)

        # Make sure the user is active before letting them in
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'This account is disabled. Please contact support.',
                'code': 'ACCOUNT_DISABLED',
            }, status=status.HTTP_403_FORBIDDEN)

        # Reload with university for the response payload
        user = User.objects.select_related('university').get(pk=user.pk)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token_str = str(refresh)

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        token_hash = hashlib.sha256(refresh_token_str.encode('utf-8')).hexdigest()
        UserSession.objects.create(
            user=user,
            token_hash=token_hash,
            device_info=request.META.get('HTTP_USER_AGENT', '')[:300],
            ip_address=request.META.get('REMOTE_ADDR'),
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = Response({
            'success': True,
            'message': 'Account created successfully.' if is_new_user else 'Login successful.',
            'data': {
                'access_token': access_token,
                'user': _build_login_user_data(user),
                'is_new_user': is_new_user,
            },
        }, status=status.HTTP_200_OK)

        response.set_cookie(
            key='refresh_token',
            value=refresh_token_str,
            httponly=True,
            secure=_should_use_secure_refresh_cookie(request),
            samesite='Lax',
            max_age=60 * 60 * 24 * 7,
            path='/',
        )
        return response
