"""
Session Views.

Endpoints for listing, revoking, and force-logging out sessions.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserSession
from .session_serializers import UserSessionSerializer


class SessionListView(APIView):
    """
    GET /api/v1/auth/sessions/

    List the authenticated user's active (non-revoked) sessions.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = UserSession.objects.filter(
            user=request.user,
            revoked=False,
        )
        serializer = UserSessionSerializer(
            sessions,
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


class SessionRevokeView(APIView):
    """
    DELETE /api/v1/auth/sessions/{id}/

    Revoke a specific session (log out that device).
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            session = UserSession.objects.get(
                pk=pk,
                user=request.user,
                revoked=False,
            )
        except UserSession.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'message': 'Session not found or already revoked.',
                    'errors': {},
                    'code': 'NOT_FOUND',
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        session.revoked = True
        session.save(update_fields=['revoked'])
        return Response(
            {
                'success': True,
                'message': 'Session revoked successfully.',
            },
            status=status.HTTP_200_OK,
        )


class SessionRevokeAllView(APIView):
    """
    DELETE /api/v1/auth/sessions/revoke-all/

    Revoke ALL sessions for the authenticated user (force logout everywhere).
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        count = UserSession.revoke_all_for_user(request.user.id)
        return Response(
            {
                'success': True,
                'message': f'{count} session(s) revoked. '
                           f'You have been logged out of all devices.',
            },
            status=status.HTTP_200_OK,
        )
