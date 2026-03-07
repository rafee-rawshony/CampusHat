"""
Tests for admin verification review.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status as http_status

from apps.authentication.models import User, UserVerification
from apps.universities.models import University


class AdminReviewTestCase(TestCase):
    """Test cases for PATCH /api/v1/admin/verifications/{id}/review/"""

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
        self.admin = User.objects.create_user(
            email='admin@test.com',
            full_name='Admin User',
            password='AdminPass@123',
            university=self.university,
            is_email_verified=True,
            role='admin',
            is_staff=True,
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            full_name='Test Student',
            password='TestPass@123',
            university=self.university,
            is_email_verified=True,
        )
        self.verification = UserVerification.objects.create(
            user=self.student,
            verification_type='student_id',
            status='pending',
            student_id_number='STU-001',
            submitted_document_url='verifications/test/doc.jpg',
        )
        self.client.force_authenticate(user=self.admin)

    def test_approve_verification(self):
        """Admin should be able to approve a pending verification."""
        response = self.client.patch(
            f'/api/v1/admin/verifications/{self.verification.id}/review/',
            {
                'status': 'approved',
                'verification_tier': 'silver',
            },
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.verification.refresh_from_db()
        self.assertEqual(self.verification.status, 'approved')
        self.assertEqual(self.verification.verification_tier, 'silver')
        self.assertEqual(self.verification.reviewed_by, self.admin)

    def test_reject_without_reason_fails(self):
        """Rejecting without a reason should fail validation."""
        response = self.client.patch(
            f'/api/v1/admin/verifications/{self.verification.id}/review/',
            {
                'status': 'rejected',
            },
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)

    def test_reject_with_reason_succeeds(self):
        """Rejecting with a reason should succeed."""
        response = self.client.patch(
            f'/api/v1/admin/verifications/{self.verification.id}/review/',
            {
                'status': 'rejected',
                'rejection_reason': 'Document is blurry, please resubmit.',
            },
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        self.verification.refresh_from_db()
        self.assertEqual(self.verification.status, 'rejected')
        self.assertIn('blurry', self.verification.rejection_reason)

    def test_non_admin_cannot_review(self):
        """Non-admin users should be blocked from reviewing."""
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(
            f'/api/v1/admin/verifications/{self.verification.id}/review/',
            {'status': 'approved'},
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_403_FORBIDDEN)

    def test_reputation_score_increases_on_approval(self):
        """Approving should increase user's reputation_score via signal."""
        initial_score = self.student.reputation_score
        self.client.patch(
            f'/api/v1/admin/verifications/{self.verification.id}/review/',
            {
                'status': 'approved',
                'verification_tier': 'gold',
            },
            format='json',
        )
        self.student.refresh_from_db()
        self.assertEqual(
            self.student.reputation_score,
            initial_score + 30,  # gold = +30
        )
