"""
Tests for User Login.

Covers valid login with JWT tokens, wrong password,
and blocked login for unverified email.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.universities.models import University


class UserLoginTests(TestCase):
    """Test suite for the POST /api/v1/auth/login/ endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/v1/auth/login/'

        self.university = University.objects.create(
            name='Daffodil International University',
            short_name='DIU',
            division='Dhaka',
            district='Dhaka',
            postal_code='1207',
            full_address='Daffodil Smart City, Birulia, Savar, Dhaka',
            is_active=True,
        )

        # Create a verified user
        self.verified_user = User.objects.create_user(
            email='verified@example.com',
            full_name='Verified User',
            password='StrongPass123!',
            university=self.university,
            is_email_verified=True,
        )

        # Create an unverified user
        self.unverified_user = User.objects.create_user(
            email='unverified@example.com',
            full_name='Unverified User',
            password='StrongPass123!',
            university=self.university,
            is_email_verified=False,
        )

    def test_valid_login(self):
        """A verified user with correct credentials should receive JWT tokens."""
        data = {'email': 'verified@example.com', 'password': 'StrongPass123!'}
        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access_token', response.data['data'])
        self.assertNotIn('refresh_token', response.data['data'])
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['data']['user']['email'], 'verified@example.com')

    def test_wrong_password(self):
        """Login with an incorrect password should fail."""
        data = {'email': 'verified@example.com', 'password': 'WrongPassword!'}
        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unverified_email_blocked(self):
        """Login with an unverified email should be rejected."""
        data = {'email': 'unverified@example.com', 'password': 'StrongPass123!'}
        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_user(self):
        """Login with a non-existent email should fail."""
        data = {'email': 'noone@example.com', 'password': 'StrongPass123!'}
        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
