"""
University Views.

Provides a full CRUD ViewSet for universities with public list/retrieve,
admin-only create/update/destroy, and a public search endpoint.
Plus the InstitutionRequest flow — students can submit "add my school"
requests, admins approve or reject them.
"""

from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.viewsets import ModelViewSet

from core.permissions import IsAdminOrModerator

from .models import InstitutionRequest, University
from .serializers import (
    InstitutionRequestApproveSerializer,
    InstitutionRequestCreateSerializer,
    InstitutionRequestListSerializer,
    InstitutionRequestRejectSerializer,
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
    
    Note: list endpoint does not paginate to allow clients to fetch all universities at once.
    """

    queryset = University.objects.filter(is_active=True)
    lookup_field = 'slug'
    pagination_class = None  # No pagination for list endpoint

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


class InstitutionRequestViewSet(ModelViewSet):
    """
    ViewSet for the "request to add my institution" flow.

    Public:
        POST /api/v1/institution-requests/   -- submit a new request

    Admin only:
        GET    /api/v1/institution-requests/                 -- list
        GET    /api/v1/institution-requests/{id}/            -- detail
        POST   /api/v1/institution-requests/{id}/approve/    -- approve & create University
        POST   /api/v1/institution-requests/{id}/reject/     -- reject with reason
    """

    queryset = InstitutionRequest.objects.all()
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return InstitutionRequestCreateSerializer
        if self.action == 'approve':
            return InstitutionRequestApproveSerializer
        if self.action == 'reject':
            return InstitutionRequestRejectSerializer
        return InstitutionRequestListSerializer

    def get_permissions(self):
        # Anyone can submit; only admins can list / review.
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]

    def get_throttles(self):
        # Rate-limit anonymous submissions to prevent spam.
        if self.action == 'create':
            return [AnonRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        qs = InstitutionRequest.objects.all().select_related(
            'reviewed_by', 'created_university',
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """
        Approve a pending request and create a University record from it.
        Admin must supply short_name + postal_code (and may override address).
        """
        instance = self.get_object()
        if instance.status != InstitutionRequest.STATUS_PENDING:
            return Response(
                {
                    'success': False,
                    'message': f'This request is already {instance.status}.',
                    'code': 'INVALID_STATE',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = InstitutionRequestApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        university = University.objects.create(
            name=instance.name,
            short_name=data['short_name'],
            division=instance.division,
            district=instance.district,
            postal_code=data['postal_code'],
            full_address=data.get('full_address') or instance.full_address or '',
            email_domain=data.get('email_domain') or None,
            is_active=True,
        )

        instance.status = InstitutionRequest.STATUS_APPROVED
        instance.reviewed_by = request.user
        instance.reviewed_at = timezone.now()
        instance.created_university = university
        instance.save(update_fields=[
            'status', 'reviewed_by', 'reviewed_at', 'created_university', 'updated_at',
        ])

        return Response(
            {
                'success': True,
                'message': f'Request approved — created "{university.short_name}".',
                'university': UniversityDetailSerializer(university).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject a pending request with a reason."""
        instance = self.get_object()
        if instance.status != InstitutionRequest.STATUS_PENDING:
            return Response(
                {
                    'success': False,
                    'message': f'This request is already {instance.status}.',
                    'code': 'INVALID_STATE',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = InstitutionRequestRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instance.status = InstitutionRequest.STATUS_REJECTED
        instance.review_note = serializer.validated_data['review_note']
        instance.reviewed_by = request.user
        instance.reviewed_at = timezone.now()
        instance.save(update_fields=[
            'status', 'review_note', 'reviewed_by', 'reviewed_at', 'updated_at',
        ])

        return Response(
            {
                'success': True,
                'message': 'Request rejected.',
                'request': InstitutionRequestListSerializer(instance).data,
            },
            status=status.HTTP_200_OK,
        )
