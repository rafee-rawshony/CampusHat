"""
Authentication Views.

Provides endpoints for user registration, email verification, JWT login/logout,
profile management, and password changes.
"""

import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView

from .models import EmailVerificationToken, User
from .serializers import (
    ChangePasswordSerializer,
    UserDetailSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
)


# =============================================================================
# REGISTRATION
# =============================================================================

class RegisterView(APIView):
    """
    POST /api/v1/auth/register/

    Register a new user. Creates the user with role='normal_user',
    generates an email verification token, and queues a Celery task
    to send the verification email.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Explicitly confirm role in response for debugging/logging
        assert user.role == 'normal_user', (
            f'Registration bug: user {user.email} got role {user.role}'
        )

        # Generate verification token and queue email
        token = EmailVerificationToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(48),
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        try:
            from .tasks import send_verification_email
            send_verification_email.delay(str(user.id))
        except Exception:
            # If Celery is not available, fail gracefully
            pass

        return Response({
            'success': True,
            'message': 'Registration successful. Check your email to verify your account.',
            'data': {'email': user.email, 'role': user.role}
        }, status=status.HTTP_201_CREATED)


# =============================================================================
# EMAIL VERIFICATION
# =============================================================================

class VerifyEmailView(GenericAPIView):
    """
    GET /api/v1/auth/verify-email/?token=xxx

    Verify the user's email using the token sent during registration.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        token_str = request.query_params.get('token')

        if not token_str:
            return Response(
                {
                    'success': False,
                    'message': 'Verification token is required.',
                    'errors': {'token': ['This field is required.']},
                    'code': 'VALIDATION_ERROR',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(
                token=token_str,
            )
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid verification token.',
                    'errors': {},
                    'code': 'INVALID_TOKEN',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token_obj.is_used:
            return Response(
                {
                    'success': False,
                    'message': 'This token has already been used.',
                    'errors': {},
                    'code': 'TOKEN_USED',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token_obj.is_expired:
            return Response(
                {
                    'success': False,
                    'message': 'This verification token has expired. Please request a new one.',
                    'errors': {},
                    'code': 'TOKEN_EXPIRED',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark token as used and verify the user's email
        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])

        user = token_obj.user
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

        return Response(
            {
                'success': True,
                'message': 'Email verified successfully. You can now log in.',
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(APIView):
    """
    POST /api/v1/auth/resend-verification/
    
    Resend verification email to an unverified user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Block already-verified users
        if user.is_email_verified:
            return Response({
                'success': False,
                'message': 'Email is already verified.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Invalidate existing unused tokens for this user
        EmailVerificationToken.objects.filter(
            user=user, is_used=False
        ).update(is_used=True)  # Mark old tokens as used

        # Create fresh token
        token = EmailVerificationToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(48),
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        try:
            from .tasks import send_verification_email
            send_verification_email.delay(str(user.id))
        except Exception:
            pass

        return Response({
            'success': True,
            'message': 'Verification email resent. Check your inbox.'
        }, status=status.HTTP_200_OK)


# =============================================================================
# LOGIN
# =============================================================================

class LoginView(GenericAPIView):
    """
    POST /api/v1/auth/login/

    Authenticate with email/password and receive JWT access + refresh tokens.
    """

    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create a UserSession record for session tracking (Phase 03)
        data = serializer.validated_data
        access_token = data.get('access_token', '')
        if access_token:
            from .models import UserSession
            try:
                user_email = data.get('user', {}).get('email', '')
                if user_email:
                    from .models import User
                    user = User.objects.get(email=user_email)
                    UserSession.create_from_request(user, access_token, request)
            except Exception:
                pass  # Don't block login if session tracking fails

        return Response(
            {
                'success': True,
                'message': 'Login successful.',
                'data': data,
            },
            status=status.HTTP_200_OK,
        )


# =============================================================================
# TOKEN REFRESH
# =============================================================================

class CampusHatTokenRefreshView(SimpleJWTTokenRefreshView):
    """
    POST /api/v1/auth/token/refresh/

    Refresh an access token using a valid refresh token.
    Uses SimpleJWT's built-in refresh logic with token rotation.
    """

    pass


# =============================================================================
# LOGOUT
# =============================================================================

class LogoutView(GenericAPIView):
    """
    POST /api/v1/auth/logout/

    Blacklist the provided refresh token to log the user out.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            return Response(
                {
                    'success': False,
                    'message': 'Refresh token is required.',
                    'errors': {'refresh_token': ['This field is required.']},
                    'code': 'VALIDATION_ERROR',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid or already blacklisted token.',
                    'errors': {},
                    'code': 'INVALID_TOKEN',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'success': True,
                'message': 'Logged out successfully.',
            },
            status=status.HTTP_200_OK,
        )


# =============================================================================
# PROFILE
# =============================================================================

class MeView(GenericAPIView):
    """
    GET /api/v1/auth/me/

    Return the authenticated user's full profile.
    """

    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = self.get_serializer(
            User.objects.select_related('university').get(id=request.user.id)
        )
        return Response(serializer.data)


class MeUpdateView(GenericAPIView):
    """
    PATCH /api/v1/auth/me/update/

    Update the authenticated user's profile (name, phone, picture).
    """

    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = User.objects.select_related('university').get(id=request.user.id)
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        detail_serializer = UserDetailSerializer(user)
        return Response(
            {
                'success': True,
                'message': 'Profile updated successfully.',
                'data': detail_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# =============================================================================
# CHANGE PASSWORD
# =============================================================================

class ChangePasswordView(GenericAPIView):
    """
    POST /api/v1/auth/change-password/

    Change the authenticated user's password.
    """

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                'success': True,
                'message': 'Password changed successfully.',
            },
            status=status.HTTP_200_OK,
        )



