"""
Tests for verification document submission.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status as http_status
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.authentication.models import User, UserVerification
from apps.universities.models import University


class VerificationSubmitTestCase(TestCase):
    """Test cases for POST /api/v1/auth/verification/submit/"""

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

    def _create_test_image(self):
        """Create a simple test image file."""
        import io
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        return SimpleUploadedFile(
            'test_id.jpg',
            buffer.read(),
            content_type='image/jpeg',
        )

    def test_submit_verification_success(self):
        """Should create a pending verification with document."""
        image = self._create_test_image()
        response = self.client.post(
            '/api/v1/auth/verification/submit/',
            {
                'verification_type': 'student_id',
                'student_id_number': 'STU-001',
                'submitted_document': image,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, http_status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['status'], 'pending')

    def test_duplicate_pending_verification_rejected(self):
        """Should reject if a pending verification of same type exists."""
        UserVerification.objects.create(
            user=self.user,
            verification_type='student_id',
            status='pending',
            student_id_number='STU-001',
        )
        image = self._create_test_image()
        response = self.client.post(
            '/api/v1/auth/verification/submit/',
            {
                'verification_type': 'student_id',
                'student_id_number': 'STU-002',
                'submitted_document': image,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_submit_rejected(self):
        """Should reject unauthenticated requests."""
        self.client.force_authenticate(user=None)
        image = self._create_test_image()
        response = self.client.post(
            '/api/v1/auth/verification/submit/',
            {
                'verification_type': 'student_id',
                'submitted_document': image,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)
