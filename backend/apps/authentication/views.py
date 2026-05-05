"""
Authentication Views.

Provides endpoints for user registration, email verification, JWT login/logout,
profile management, and password changes.
"""

import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers as drf_serializers, status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView

from .models import EmailVerificationToken, OTPCode, User, UserSession, UserVerification
from .serializers import (
    ChangePasswordSerializer,
    ConfirmEmailChangeSerializer,
    ForgotPasswordSerializer,
    RequestEmailChangeSerializer,
    ResetPasswordSerializer,
    UserDetailSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
)
from .models import EmailChangeRequest

logger = logging.getLogger(__name__)


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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # New users must always start as 'normal_user'. If serializer ever leaks
        # role input from the client, this catches it loudly instead of silently.
        if user.role != 'normal_user':
            logger.error(
                'Registration role bug: user %s got role %s, expected normal_user',
                user.email, user.role,
            )
            user.role = 'normal_user'
            user.save(update_fields=['role'])

        # Generate verification token and queue email. We always require
        # explicit email verification — even in dev. Local development uses
        # the Mailpit container (see docker-compose) so the link is visible
        # in a web inbox at http://localhost:8025/ instead of a real inbox.
        EmailVerificationToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(48),
            expires_at=timezone.now() + timedelta(hours=24)
        )

        # Queue verification email. If the broker is down, log it and continue —
        # registration itself should not fail just because email delivery is delayed.
        try:
            from .tasks import send_verification_email
            send_verification_email.delay(str(user.id))
        except Exception as exc:
            logger.exception(
                'Failed to queue verification email for %s: %s', user.email, exc,
            )

        # Escape hatch for automated tests / CI / CLI seeding only.
        # MUST NOT be enabled in production — gated by an explicit env flag,
        # never auto-detected from email backend strings.
        if getattr(settings, 'AUTO_VERIFY_EMAIL_ON_REGISTER', False):
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])

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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        if not isinstance(user, User):
            user = User.objects.get(email=user.get('email', ''))
        user = User.objects.select_related('university').get(pk=user.pk)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token_str = str(refresh)

        token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
        UserSession.objects.create(
            user=user,
            token_hash=token_hash,
            device_info=request.META.get('HTTP_USER_AGENT', '')[:300],
            ip_address=request.META.get('REMOTE_ADDR'),
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = Response({
            'success': True,
            'message': 'Login successful.',
            'data': {
                'access_token': access_token,
                'user': _build_login_user_data(user),
            }
        }, status=status.HTTP_200_OK)

        is_production = getattr(settings, 'DEBUG', True) is False
        response.set_cookie(
            key='refresh_token',
            value=refresh_token_str,
            httponly=True,
            secure=is_production,
            samesite='Lax',
            max_age=60 * 60 * 24 * 7,
            path='/',
        )
        return response


# =============================================================================
# OTP LOGIN (Passwordless)
# =============================================================================

class OTPSendSerializer(drf_serializers.Serializer):
    """Input: the identifier (email or phone) to send an OTP to."""
    identifier = drf_serializers.CharField(max_length=255)


class OTPVerifySerializer(drf_serializers.Serializer):
    """Input: the identifier and the 6-digit OTP code the user typed."""
    identifier = drf_serializers.CharField(max_length=255)
    otp = drf_serializers.RegexField(
        regex=r'^\d{6}$',
        error_messages={'invalid': 'OTP must be 6 digits.'},
    )


def _build_login_user_data(user) -> dict:
    """
    Build the full user dict for login/OTP responses.
    Includes verification status and seller application status from related models.
    """
    from apps.sellers.models import SellerProfile

    university_id = str(user.university_id) if user.university_id else None
    university_name = None
    if user.university_id:
        try:
            university_name = user.university.name
        except Exception:
            pass

    verification_status = None
    verification_rejection_reason = None
    latest_verification = (
        UserVerification.objects
        .filter(user=user, deleted_at__isnull=True)
        .order_by('-created_at')
        .first()
    )
    if latest_verification:
        verification_status = latest_verification.status
        if latest_verification.status == 'rejected':
            verification_rejection_reason = latest_verification.rejection_reason

    seller_application_status = None
    seller = (
        SellerProfile.objects
        .filter(user=user, deleted_at__isnull=True)
        .order_by('-created_at')
        .first()
    )
    if seller:
        seller_application_status = seller.status

    return {
        'id': str(user.id),
        'email': user.email,
        'university_email': user.university_email,
        'full_name': user.full_name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'birthday': user.birthday.isoformat() if user.birthday else None,
        'gender': user.gender,
        'role': user.role,
        'university_id': university_id,
        'university_name': university_name,
        'profile_picture': user.profile_picture,
        'is_email_verified': user.is_email_verified,
        'is_phone_verified': user.is_phone_verified,
        'reputation_score': str(user.reputation_score),
        'verification_status': verification_status,
        'verification_rejection_reason': verification_rejection_reason,
        'seller_application_status': seller_application_status,
        'is_profile_complete': user.is_profile_complete,
        'profile_completion_percent': user.profile_completion_percent,
    }


def _lookup_user_by_identifier(identifier: str):
    """
    Find an active user by email or phone.
    Returns None if no match — caller decides whether to leak that info.
    """
    qs = User.objects.select_related('university')
    if '@' in identifier:
        return qs.filter(email__iexact=identifier, is_active=True).first()
    return qs.filter(phone=identifier, is_active=True).first()


class OTPSendView(APIView):
    """
    POST /api/v1/auth/otp/send/

    Generate a one-time 6-digit code, store its SHA-256 hash, and email it
    to the user. Always returns 200 so attackers can't enumerate which
    emails exist in the system. Rate-limited via the 'otp_send' throttle scope.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_send'

    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier'].strip().lower()

        user = _lookup_user_by_identifier(identifier)

        # Only generate and send when a real user exists, but keep the response
        # identical to prevent email/phone enumeration attacks.
        if user and '@' in identifier:
            # Invalidate any previous unused codes for this identifier
            OTPCode.objects.filter(
                identifier=identifier, used=False
            ).update(used=True)

            # Generate a cryptographically random 6-digit code
            code = ''.join(secrets.choice('0123456789') for _ in range(6))
            code_hash = hashlib.sha256(code.encode('utf-8')).hexdigest()

            OTPCode.objects.create(
                identifier=identifier,
                code_hash=code_hash,
                expires_at=timezone.now() + timedelta(
                    minutes=OTPCode.EXPIRY_MINUTES
                ),
            )

            # Queue the email. We pass the plaintext code only to the task;
            # the DB only ever sees the hash.
            try:
                from .tasks import send_otp_email
                send_otp_email.delay(user.email, code, user.full_name)
            except Exception as exc:
                logger.exception(
                    'Failed to queue OTP email for %s: %s', user.email, exc,
                )

        return Response({
            'success': True,
            'message': (
                'If an account exists for this identifier, a login code has '
                'been sent.'
            ),
        }, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    """
    POST /api/v1/auth/otp/verify/

    Verify a 6-digit OTP. On success, returns the same JWT payload as
    password login and sets the refresh token cookie. Limited to 5 attempts
    per code and rate-limited via the 'otp_verify' throttle scope.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_verify'

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier'].strip().lower()
        otp = serializer.validated_data['otp']

        invalid_response = Response({
            'success': False,
            'message': 'OTP is invalid or has expired. Please request a new one.',
            'code': 'OTP_INVALID',
        }, status=status.HTTP_400_BAD_REQUEST)

        # Find the most recent unused code for this identifier
        otp_obj = (
            OTPCode.objects
            .filter(identifier=identifier, used=False)
            .order_by('-created_at')
            .first()
        )
        if not otp_obj or not otp_obj.is_valid:
            return invalid_response

        # Constant-time hash comparison — avoids timing side channels
        given_hash = hashlib.sha256(otp.encode('utf-8')).hexdigest()
        if not secrets.compare_digest(otp_obj.code_hash, given_hash):
            otp_obj.attempts += 1
            otp_obj.save(update_fields=['attempts'])
            return invalid_response

        # Code matched — mark as consumed so it can't be reused
        otp_obj.used = True
        otp_obj.save(update_fields=['used'])

        user = _lookup_user_by_identifier(identifier)
        if not user:
            return invalid_response

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
            'message': 'Login successful.',
            'data': {
                'access_token': access_token,
                'user': _build_login_user_data(user),
            },
        }, status=status.HTTP_200_OK)

        is_production = getattr(settings, 'DEBUG', True) is False
        response.set_cookie(
            key='refresh_token',
            value=refresh_token_str,
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
# EMAIL CHANGE FLOW
# =============================================================================

class RequestEmailChangeView(GenericAPIView):
    """
    POST /api/v1/auth/me/email/request-change/

    Body: {"new_email": "...", "current_password": "..."}

    Creates an EmailChangeRequest and sends a verification link to the new
    address. The actual email field on the user is NOT updated until the
    user clicks the link (handled by ConfirmEmailChangeView).
    """

    serializer_class = RequestEmailChangeSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_send'  # Reuse the OTP send throttle bucket.

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        new_email = serializer.validated_data['new_email']
        change_req = EmailChangeRequest.create_for_user(request.user, new_email)

        # Queue confirmation email to the NEW address.
        try:
            from .tasks import send_email_change_confirmation
            send_email_change_confirmation.delay(str(change_req.id))
        except Exception as exc:
            logger.exception(
                'Failed to queue email-change confirmation for %s: %s',
                new_email, exc,
            )

        return Response(
            {
                'success': True,
                'message': (
                    f'A confirmation link has been sent to {new_email}. '
                    'Click it to finish changing your email.'
                ),
            },
            status=status.HTTP_200_OK,
        )


class ConfirmEmailChangeView(GenericAPIView):
    """
    POST /api/v1/auth/me/email/confirm-change/
    GET  /api/v1/auth/me/email/confirm-change/?token=xxx

    Validates the token, swaps user.email to the new address, marks the
    request used, and notifies the OLD address (for security audit).
    """

    serializer_class = ConfirmEmailChangeSerializer
    permission_classes = [AllowAny]  # Token-only — anyone with the link confirms.

    def post(self, request):
        return self._confirm(request.data.get('token'))

    def get(self, request):
        # Convenience: support GET so the email link can be a plain URL.
        return self._confirm(request.query_params.get('token'))

    def _confirm(self, token):
        if not token:
            return Response(
                {'success': False, 'message': 'Token is required.', 'code': 'MISSING_TOKEN'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            change_req = EmailChangeRequest.objects.select_related('user').get(token=token)
        except EmailChangeRequest.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Invalid or expired link.', 'code': 'INVALID_TOKEN'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not change_req.is_valid:
            return Response(
                {'success': False, 'message': 'This link is no longer valid.', 'code': 'EXPIRED'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If someone else grabbed the new_email between request and confirm, fail.
        if User.objects.filter(
            email__iexact=change_req.new_email,
        ).exclude(id=change_req.user.id).exists():
            return Response(
                {
                    'success': False,
                    'message': 'That email is already in use by another account.',
                    'code': 'EMAIL_TAKEN',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_email = change_req.user.email
        user = change_req.user
        user.email = change_req.new_email
        user.save(update_fields=['email'])

        change_req.is_used = True
        change_req.save(update_fields=['is_used'])

        # Notify the old email so the rightful owner sees the change in case
        # the account was compromised.
        try:
            from .tasks import send_email_changed_notice_to_old_address
            send_email_changed_notice_to_old_address.delay(
                old_email, user.email, user.full_name,
            )
        except Exception as exc:
            logger.exception(
                'Failed to queue old-email notice for %s -> %s: %s',
                old_email, user.email, exc,
            )

        return Response(
            {
                'success': True,
                'message': 'Email changed successfully. Please log in with your new email.',
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


# =============================================================================
# FORGOT / RESET PASSWORD
# =============================================================================

class ForgotPasswordView(APIView):
    """
    POST /api/v1/auth/forgot-password/

    Send a 6-digit OTP to the user's email for password reset.
    Always returns 200 to prevent email enumeration.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_send'

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()

        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            OTPCode.objects.filter(
                identifier=email, purpose='password_reset', used=False
            ).update(used=True)

            code = ''.join(secrets.choice('0123456789') for _ in range(6))
            code_hash = hashlib.sha256(code.encode('utf-8')).hexdigest()

            OTPCode.objects.create(
                identifier=email,
                code_hash=code_hash,
                purpose='password_reset',
                expires_at=timezone.now() + timedelta(minutes=OTPCode.EXPIRY_MINUTES),
            )

            try:
                from .tasks import send_password_reset_email
                send_password_reset_email.delay(user.email, code, user.full_name)
            except Exception as exc:
                logger.exception(
                    'Failed to queue password reset email for %s: %s', user.email, exc,
                )

        return Response({
            'success': True,
            'message': 'If an account exists with this email, a password reset code has been sent.',
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    POST /api/v1/auth/reset-password/

    Verify the OTP and set a new password. No authentication required.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_verify'

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        invalid_response = Response({
            'success': False,
            'message': 'OTP is invalid or has expired. Please request a new one.',
            'code': 'OTP_INVALID',
        }, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = (
            OTPCode.objects
            .filter(identifier=email, purpose='password_reset', used=False)
            .order_by('-created_at')
            .first()
        )
        if not otp_obj or not otp_obj.is_valid:
            return invalid_response

        given_hash = hashlib.sha256(otp.encode('utf-8')).hexdigest()
        if not secrets.compare_digest(otp_obj.code_hash, given_hash):
            otp_obj.attempts += 1
            otp_obj.save(update_fields=['attempts'])
            return invalid_response

        otp_obj.used = True
        otp_obj.save(update_fields=['used'])

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if not user:
            return invalid_response

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({
            'success': True,
            'message': 'Password has been reset successfully. You can now log in.',
        }, status=status.HTTP_200_OK)



