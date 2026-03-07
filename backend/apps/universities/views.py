"""
University Views.

Provides a full CRUD ViewSet for universities with public list/retrieve,
admin-only create/update/destroy, and a public search endpoint.
"""

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.permissions import IsAdminOrModerator

from .models import University
from .serializers import (
    UniversityCreateUpdateSerializer,
    UniversityDetailSerializer,
    UniversityListSerializer,
)


class UniversityViewSet(ModelViewSet):
    """
    ViewSet for University CRUD operations.

    - list / retrieve / search: public, no authentication required
    - create / update / destroy: admin only
    - destroy performs a soft delete (sets is_active=False)
    """

    queryset = University.objects.filter(is_active=True)
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return UniversityListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return UniversityCreateUpdateSerializer
        return UniversityDetailSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'search'):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        """
        Admin users see all universities (including inactive).
        Public users see only active universities.
        """
        if self.request.user and self.request.user.is_staff:
            return University.objects.all()
        return University.objects.filter(is_active=True)

    def destroy(self, request, *args, **kwargs):
        """Soft delete: set is_active=False instead of removing the record."""
        university = self.get_object()
        university.is_active = False
        university.save(update_fields=['is_active'])
        return Response(
            {
                'success': True,
                'message': f'University "{university.short_name}" has been deactivated.',
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def search(self, request):
        """
        Search universities by name, short_name, district, or division.

        GET /api/v1/universities/search/?q=diu
        """
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response(
                {
                    'success': False,
                    'message': 'Search query parameter "q" is required.',
                    'errors': {'q': ['This field is required.']},
                    'code': 'VALIDATION_ERROR',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(
            Q(name__icontains=query)
            | Q(short_name__icontains=query)
            | Q(district__icontains=query)
            | Q(division__icontains=query)
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = UniversityListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = UniversityListSerializer(queryset, many=True)
        return Response(serializer.data)
