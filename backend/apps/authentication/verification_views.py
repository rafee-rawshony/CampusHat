"""
Verification Views.

Endpoints for submitting verification documents, checking status,
and admin review queue.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminOnly, IsAdminOrModerator, IsVerificationModerator

from .models import UserVerification
from .verification_serializers import (
    AdminReviewSerializer,
    SubmitVerificationSerializer,
    VerificationStatusSerializer,
)


# =============================================================================
# USER ENDPOINTS
# =============================================================================

class SubmitVerificationView(APIView):
    """
    POST /api/v1/auth/verification/submit/

    Submit a verification request with identity documents.
    Creates a UserVerification record with status='pending' and
    queues a Celery task to notify admins.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Require complete profile before submitting verification.
        if not request.user.is_profile_complete:
            return Response(
                {
                    'success': False,
                    'message': 'Please complete your profile (name, phone, birthday, gender, and address) before submitting for verification.',
                    'code': 'PROFILE_INCOMPLETE',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            serializer = SubmitVerificationSerializer(
                data=request.data,
                context={'request': request},
            )
            serializer.is_valid(raise_exception=True)
            verification = serializer.save()

            # Queue Celery task to notify admin
            try:
                from .tasks import notify_admin_new_verification
                notify_admin_new_verification.delay(str(verification.id))
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to queue verification notification: {e}")

            output_serializer = VerificationStatusSerializer(
                verification,
                context={'request': request},
            )
            return Response(
                {
                    'success': True,
                    'message': 'Verification submitted successfully. '
                               'An admin will review your documents.',
                    'data': output_serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Verification submit error: {e}", exc_info=True)
            return Response(
                {
                    'success': False,
                    'message': 'An unexpected error occurred while processing your request.',
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MyVerificationStatusView(APIView):
    """
    GET /api/v1/auth/verification/my-status/

    Return the authenticated user's verification records.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        verifications = UserVerification.objects.filter(
            user=request.user,
            deleted_at__isnull=True,
        )
        serializer = VerificationStatusSerializer(
            verifications,
            many=True,
            context={'request': request},
        )
        return Response(
            {
                'success': True,
                'message': 'Data retrieved successfully.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

class AdminVerificationListView(APIView):
    """
    GET /api/v1/admin/verifications/

    List all pending verifications (admin review queue).
    Supports ?status= filter for approved/rejected/expired.
    """

    permission_classes = [IsAuthenticated, IsVerificationModerator]

    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        verifications = UserVerification.objects.filter(
            status=status_filter,
            deleted_at__isnull=True,
        ).select_related('user', 'reviewed_by')

        serializer = VerificationStatusSerializer(
            verifications,
            many=True,
            context={'request': request},
        )
        return Response(
            {
                'success': True,
                'message': 'Data retrieved successfully.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminVerificationDetailView(APIView):
    """
    GET /api/v1/admin/verifications/{id}/

    Get detailed verification info including presigned download URLs
    for the submitted documents.
    """

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request, pk):
        try:
            verification = UserVerification.objects.select_related(
                'user', 'reviewed_by',
            ).get(pk=pk, deleted_at__isnull=True)
        except UserVerification.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'message': 'Verification record not found.',
                    'errors': {},
                    'code': 'NOT_FOUND',
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = VerificationStatusSerializer(
            verification,
            context={'request': request},
        )
        return Response(
            {
                'success': True,
                'message': 'Request successful.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminVerificationReviewView(APIView):
    """
    PATCH /api/v1/admin/verifications/{id}/review/

    Approve or reject a pending verification.
    """

    permission_classes = [IsAuthenticated, IsVerificationModerator]

    def post(self, request, pk):
        # Frontend uses POST; delegate to patch handler
        return self.patch(request, pk)

    def patch(self, request, pk):
        try:
            verification = UserVerification.objects.get(
                pk=pk,
                deleted_at__isnull=True,
            )
        except UserVerification.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'message': 'Verification record not found.',
                    'errors': {},
                    'code': 'NOT_FOUND',
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate status transition
        if verification.status not in ('pending',):
            return Response(
                {
                    'success': False,
                    'message': f'Cannot review a verification with status '
                               f'"{verification.status}". Only pending '
                               f'verifications can be reviewed.',
                    'errors': {},
                    'code': 'INVALID_STATUS_TRANSITION',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AdminReviewSerializer(
            instance=verification,
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        # Queue Celery task to notify user of the result
        from .tasks import send_verification_result
        send_verification_result.delay(str(updated.id))

        output_serializer = VerificationStatusSerializer(
            updated,
            context={'request': request},
        )
        action = 'approved' if updated.status == 'approved' else 'rejected'
        return Response(
            {
                'success': True,
                'message': f'Verification {action} successfully.',
                'data': output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
