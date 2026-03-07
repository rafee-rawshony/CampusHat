"""
Tests for User Registration.

Covers successful registration, duplicate email rejection,
and inactive university rejection.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import EmailVerificationToken, User
from apps.universities.models import University


class UserRegistrationTests(TestCase):
    """Test suite for the POST /api/v1/auth/register/ endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'

        # Create an active university for testing
        self.university = University.objects.create(
            name='Daffodil International University',
            short_name='DIU',
            division='Dhaka',
            district='Dhaka',
            postal_code='1207',
            full_address='Daffodil Smart City, Birulia, Savar, Dhaka',
            is_active=True,
        )

        # Create an inactive university
        self.inactive_university = University.objects.create(
            name='Inactive Test University',
            short_name='ITU',
            division='Dhaka',
            district='Dhaka',
            postal_code='1000',
            full_address='Test Address',
            is_active=False,
        )

        self.valid_data = {
            'email': 'student@example.com',
            'password': 'StrongPass123!',
            'full_name': 'Test Student',
            'university_id': str(self.university.id),
        }

    def test_successful_registration(self):
        """A valid registration should create a user and verification token."""
        response = self.client.post(self.register_url, self.valid_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('verify', response.data['message'].lower())

        # User should be created
        user = User.objects.get(email='student@example.com')
        self.assertEqual(user.full_name, 'Test Student')
        self.assertEqual(user.role, 'student')
        self.assertFalse(user.is_email_verified)
        self.assertTrue(user.check_password('StrongPass123!'))

        # Verification token should exist
        token = EmailVerificationToken.objects.filter(user=user).first()
        self.assertIsNotNone(token)
        self.assertFalse(token.is_used)

    def test_duplicate_email_rejected(self):
        """Registration with an existing email should fail."""
        # Register first time
        self.client.post(self.register_url, self.valid_data, format='json')

        # Try again with same email
        response = self.client.post(self.register_url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_university_rejected(self):
        """Registration with an inactive university should fail."""
        data = self.valid_data.copy()
        data['university_id'] = str(self.inactive_university.id)

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_password_rejected(self):
        """A password that is entirely numeric should be rejected."""
        data = self.valid_data.copy()
        data['password'] = '12345678'

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_rejected(self):
        """A password shorter than 8 characters should be rejected."""
        data = self.valid_data.copy()
        data['password'] = 'Ab1!'

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
