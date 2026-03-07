"""
Authentication URL Configuration.

Maps all auth-related endpoints to their views.
"""

from django.urls import path

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeUpdateView,
    MeView,
    RegisterView,
    ResendVerificationView,
    CampusHatTokenRefreshView,
    VerifyEmailView,
)

app_name = 'authentication'

urlpatterns = [
    # Registration & Verification
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),

    # Login / Logout / Token
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', CampusHatTokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Profile
    path('me/', MeView.as_view(), name='me'),
    path('me/update/', MeUpdateView.as_view(), name='me-update'),

    # Password
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
