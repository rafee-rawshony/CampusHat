"""
Tests for Email Verification.

Covers valid token verification, expired token rejection,
and already-used token rejection.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import EmailVerificationToken, User
from apps.universities.models import University


class EmailVerificationTests(TestCase):
    """Test suite for the GET /api/v1/auth/verify-email/?token=xxx endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.verify_url = '/api/v1/auth/verify-email/'

        self.university = University.objects.create(
            name='Daffodil International University',
            short_name='DIU',
            division='Dhaka',
            district='Dhaka',
            postal_code='1207',
            full_address='Daffodil Smart City, Birulia, Savar, Dhaka',
            is_active=True,
        )

        self.user = User.objects.create_user(
            email='testuser@example.com',
            full_name='Test User',
            password='StrongPass123!',
            university=self.university,
            is_email_verified=False,
        )

        # Create a valid token
        self.valid_token = EmailVerificationToken.create_for_user(self.user)

    def test_valid_token_verification(self):
        """A valid, unexpired, unused token should verify the user's email."""
        response = self.client.get(
            self.verify_url, {'token': self.valid_token.token}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('verified', response.data['message'].lower())

        # Refresh user from DB and check
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)

        # Token should be marked as used
        self.valid_token.refresh_from_db()
        self.assertTrue(self.valid_token.is_used)

    def test_expired_token_rejected(self):
        """An expired token should be rejected."""
        # Manually expire the token
        self.valid_token.expires_at = timezone.now() - timedelta(hours=1)
        self.valid_token.save(update_fields=['expires_at'])

        response = self.client.get(
            self.verify_url, {'token': self.valid_token.token}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['code'], 'TOKEN_EXPIRED')

    def test_used_token_rejected(self):
        """A token that has already been used should be rejected."""
        # Mark token as used
        self.valid_token.is_used = True
        self.valid_token.save(update_fields=['is_used'])

        response = self.client.get(
            self.verify_url, {'token': self.valid_token.token}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['code'], 'TOKEN_USED')

    def test_invalid_token_rejected(self):
        """A completely invalid token string should be rejected."""
        response = self.client.get(
            self.verify_url, {'token': 'totally-invalid-token-string'}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['code'], 'INVALID_TOKEN')

    def test_missing_token_parameter(self):
        """A request without the token parameter should be rejected."""
        response = self.client.get(self.verify_url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
