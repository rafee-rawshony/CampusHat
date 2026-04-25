"""
Authentication URL Configuration.

Maps all auth-related endpoints to their views, including
Phase 02 (registration, login, profile) and Phase 03 (verification,
addresses, sessions).
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MeUpdateView,
    MeView,
    OTPSendView,
    OTPVerifyView,
    RegisterView,
    ResendVerificationView,
    ResetPasswordView,
    CookieTokenRefreshView,
    VerifyEmailView,
)
from .verification_views import (
    MyVerificationStatusView,
    SubmitVerificationView,
)
from .address_views import UserAddressViewSet
from .session_views import (
    SessionListView,
    SessionRevokeAllView,
    SessionRevokeView,
)

app_name = 'authentication'

# Router for address ViewSet
router = DefaultRouter()
router.register(r'addresses', UserAddressViewSet, basename='address')

urlpatterns = [
    # Registration & Verification (Phase 02)
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),

    # Login / Logout / Token (Phase 02)
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Passwordless OTP Login
    path('otp/send/', OTPSendView.as_view(), name='otp-send'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp-verify'),

    # Profile (Phase 02)
    path('me/', MeView.as_view(), name='me'),
    path('me/update/', MeUpdateView.as_view(), name='me-update'),

    # Password (Phase 02)
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    # Verification (Phase 03)
    path('verification/submit/', SubmitVerificationView.as_view(), name='verification-submit'),
    path('verification/my-status/', MyVerificationStatusView.as_view(), name='verification-status'),

    # Sessions (Phase 03)
    path('sessions/', SessionListView.as_view(), name='session-list'),
    path('sessions/<uuid:pk>/', SessionRevokeView.as_view(), name='session-revoke'),
    path('sessions/revoke-all/', SessionRevokeAllView.as_view(), name='session-revoke-all'),

    # Addresses (Phase 03) — router-based
    path('', include(router.urls)),
]
