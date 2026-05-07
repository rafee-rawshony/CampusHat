"""
Tests for user address CRUD and default toggle.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status as http_status

from apps.authentication.models import User, UserAddress
from apps.universities.models import University


class AddressTestCase(TestCase):
    """Test cases for /api/v1/auth/addresses/ CRUD."""

    def setUp(self):
        self.client = APIClient()
        self.university = University.objects.create(
            name='Test University',
            short_name='TU',
            division='Dhaka',
            district='Dhaka',
            postal_code='1200',
            full_address='Test Address',
            is_active=True,
        )
        self.user = User.objects.create_user(
            email='student@test.com',
            full_name='Test Student',
            password='TestPass@123',
            university=self.university,
            is_email_verified=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_create_address(self):
        """Should create a new address."""
        response = self.client.post(
            '/api/v1/auth/addresses/',
            {
                'label': 'Home',
                'address_line1': '123 Main St',
                'district': 'Dhaka',
                'city': 'Dhaka',
                'postal_code': '1200',
                'is_default': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['label'], 'Home')

    def test_list_addresses(self):
        """Should list user's addresses."""
        UserAddress.objects.create(
            user=self.user,
            label='Home',
            address_line1='123 Main St',
            district='Dhaka',
            city='Dhaka',
            postal_code='1200',
        )
        response = self.client.get('/api/v1/auth/addresses/')
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

    def test_default_toggle(self):
        """Setting one address as default should unset others."""
        addr1 = UserAddress.objects.create(
            user=self.user,
            label='Home',
            address_line1='123 Main St',
            district='Dhaka',
            city='Dhaka',
            postal_code='1200',
            is_default=True,
        )
        addr2 = UserAddress.objects.create(
            user=self.user,
            label='Dorm',
            address_line1='456 Campus Rd',
            district='Dhaka',
            city='Dhaka',
            postal_code='1207',
            is_default=False,
        )

        # Set addr2 as default
        response = self.client.post(
            f'/api/v1/auth/addresses/{addr2.id}/set-default/',
        )
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)

        addr1.refresh_from_db()
        addr2.refresh_from_db()
        self.assertFalse(addr1.is_default)
        self.assertTrue(addr2.is_default)

    def test_soft_delete_address(self):
        """DELETE should soft-delete, not hard delete."""
        addr = UserAddress.objects.create(
            user=self.user,
            label='Home',
            address_line1='123 Main St',
            district='Dhaka',
            city='Dhaka',
            postal_code='1200',
        )
        response = self.client.delete(f'/api/v1/auth/addresses/{addr.id}/')
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)

        # Should not appear in list
        response = self.client.get('/api/v1/auth/addresses/')
        self.assertEqual(len(response.data['data']), 0)
