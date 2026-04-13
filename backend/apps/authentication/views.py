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

class LoginView(APIView):
    """
    POST /api/v1/auth/login/

    Authenticate with email/password and receive JWT access + refresh tokens.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user_data = serializer.validated_data.get('user')
        if user_data and isinstance(user_data, dict):
             user_email = user_data.get('email', '')
             user = User.objects.get(email=user_email)
        else:
             user = user_data
             if not user:
                 user_email = serializer.validated_data.get('email', '')
                 if user_email:
                     user = User.objects.get(email=user_email)

        # Generate tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.conf import settings
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Create UserSession record for revocation tracking
        import hashlib
        from datetime import timedelta
        from django.utils import timezone
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        from .models import UserSession
        UserSession.objects.create(
            user=user,
            token_hash=token_hash,
            device_info=request.META.get('HTTP_USER_AGENT', '')[:300],
            ip_address=request.META.get('REMOTE_ADDR'),
            expires_at=timezone.now() + timedelta(days=7)
        )

        # Build response
        response = Response({
            'success': True,
            'message': 'Login successful.',
            'data': {
                'access_token': access_token,  # access token in body
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role,
                    'university': str(user.university_id) if user.university else None,
                }
            }
        }, status=status.HTTP_200_OK)

        # Set refresh token as HttpOnly cookie
        is_production = getattr(settings, 'DEBUG', True) is False
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=is_production,
            samesite='Lax',
            max_age=60 * 60 * 24 * 7,
            path='/',
        )
        return response


# =============================================================================
# TOKEN REFRESH
# =============================================================================

class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Read refresh token from HttpOnly cookie
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token not found.', 'code': 'NO_REFRESH_TOKEN'},
                status=401
            )
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            from django.conf import settings
            token = RefreshToken(refresh_token)
            access_token = str(token.access_token)
            # ROTATE_REFRESH_TOKENS=True means we issue a new refresh token
            new_refresh_token = str(token)
            is_production = getattr(settings, 'DEBUG', True) is False

            response = Response({
                'success': True,
                'data': {'access_token': access_token}
            }, status=200)
            # Set the new rotated refresh token cookie
            response.set_cookie(
                key='refresh_token',
                value=new_refresh_token,
                httponly=True,
                secure=is_production,
                samesite='Lax',
                max_age=60 * 60 * 24 * 7,
                path='/',
            )
            return response
        except Exception:
            return Response(
                {'error': 'Invalid or expired refresh token.', 'code': 'TOKEN_INVALID'},
                status=401
            )


# =============================================================================
# LOGOUT
# =============================================================================

class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/

    Blacklist the provided refresh token to log the user out.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Already invalid — ignore

            # Revoke UserSession
            import hashlib
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            from .models import UserSession
            UserSession.objects.filter(
                user=request.user, token_hash=token_hash
            ).update(revoked=True)

        response = Response({'success': True, 'message': 'Logged out.'}, status=200)
        response.delete_cookie('refresh_token', path='/')
        return response


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



