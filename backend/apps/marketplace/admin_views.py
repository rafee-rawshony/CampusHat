"""
Admin Views for the Marketplace.

Approval queue, approve/reject listings, reports queue, action on reports.
"""

from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import CampusHatPagination
from core.permissions import IsAdminOrModerator

from .interaction_serializers import AdminReportActionSerializer
from .models import MarketplaceProduct, MarketplaceReport
from .product_serializers import (
    MarketplaceProductDetailSerializer,
    MarketplaceProductOwnerSerializer,
)


class AdminMarketplaceListSerializer(drf_serializers.ModelSerializer):
    """Compact serializer for the admin marketplace listing table."""

    seller_name = drf_serializers.CharField(source='user.full_name', read_only=True)
    seller_email = drf_serializers.CharField(source='user.email', read_only=True)
    university_name = drf_serializers.CharField(source='university.name', read_only=True)
    category_name = drf_serializers.CharField(source='category.name', read_only=True, default=None)
    primary_image_url = drf_serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceProduct
        fields = [
            'id', 'title', 'description', 'post_type', 'price', 'price_unit',
            'condition', 'is_negotiable', 'status', 'campus_visibility',
            'safe_meetup_location', 'rejection_reason', 'duration_days',
            'expires_at', 'view_count',
            'seller_name', 'seller_email', 'university_name', 'category_name',
            'primary_image_url',
            # Sell-specific
            'brand', 'model_name', 'usage_duration', 'delivery_option',
            # Rent-specific
            'location', 'availability_date', 'rental_duration',
            'deposit_amount', 'facilities', 'room_details',
            'rules_conditions', 'contact_preference',
            # Service-specific
            'skills', 'experience', 'delivery_time',
            'availability_hours', 'portfolio_url', 'previous_work_desc',
            # Food-specific
            'ingredients', 'portion_size', 'delivery_area',
            'food_delivery_time', 'daily_availability',
            'hygiene_certification', 'combo_packages',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_primary_image_url(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return img.image_url if img else None


class AdminAllProductsListView(APIView):
    """
    GET /api/v1/admin/marketplace/

    List ALL marketplace products (all statuses) with search, status, ad_type filters.
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from django.db.models import Q

        qs = (
            MarketplaceProduct.objects
            .filter(deleted_at__isnull=True)
            .select_related('university', 'category', 'user')
            .prefetch_related('images')
            .order_by('-updated_at')
        )

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(user__full_name__icontains=search) |
                Q(user__email__icontains=search)
            )

        status_filter = request.query_params.get('status', '')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)

        ad_type = request.query_params.get('ad_type', '')
        if ad_type and ad_type != 'all':
            qs = qs.filter(post_type=ad_type)

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = AdminMarketplaceListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AdminMarketplaceListSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})


# =============================================================================
# PRODUCT APPROVAL
# =============================================================================

class AdminPendingListView(APIView):
    """
    GET /api/v1/admin/marketplace/pending/

    List all pending marketplace listings awaiting approval.
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        products = (
            MarketplaceProduct.objects
            .filter(status='pending', deleted_at__isnull=True)
            .select_related('university', 'category', 'user')
            .prefetch_related('images')
            .order_by('-updated_at')
        )
        serializer = MarketplaceProductOwnerSerializer(products, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class AdminProductDetailView(APIView):
    """
    GET /api/v1/admin/marketplace/{id}/
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request, pk):
        try:
            product = MarketplaceProduct.objects.select_related(
                'university', 'category', 'user',
            ).prefetch_related('images').get(pk=pk, deleted_at__isnull=True)
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False, 'message': 'Product not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = MarketplaceProductDetailSerializer(
            product, context={'request': request},
        )
        return Response({
            'success': True,
            'message': 'Request successful.',
            'data': serializer.data,
        })


class AdminApproveView(APIView):
    """POST /api/v1/admin/marketplace/{id}/approve/"""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request, pk):
        try:
            product = MarketplaceProduct.objects.get(
                pk=pk, status='pending', deleted_at__isnull=True,
            )
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found or not pending.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        product.status = 'active'
        product.reviewed_by = request.user
        product.save(update_fields=['status', 'reviewed_by'])

        return Response({
            'success': True,
            'message': 'Listing approved and now active.',
        })


class AdminRejectView(APIView):
    """POST /api/v1/admin/marketplace/{id}/reject/"""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request, pk):
        try:
            product = MarketplaceProduct.objects.get(
                pk=pk, status='pending', deleted_at__isnull=True,
            )
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found or not pending.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({
                'success': False,
                'message': 'Rejection reason is required.',
                'code': 'MISSING_FIELD',
            }, status=status.HTTP_400_BAD_REQUEST)

        product.status = 'rejected'
        product.rejection_reason = reason
        product.reviewed_by = request.user
        product.save(update_fields=['status', 'rejection_reason', 'reviewed_by'])

        return Response({
            'success': True,
            'message': 'Listing rejected.',
        })


# =============================================================================
# REPORTS
# =============================================================================

class AdminReportsListView(APIView):
    """
    GET /api/v1/admin/marketplace/reports/
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        reports = (
            MarketplaceReport.objects
            .filter(status='pending', deleted_at__isnull=True)
            .select_related('product', 'reporter')
            .order_by('created_at')
        )
        from .interaction_serializers import MarketplaceReportSerializer
        serializer = MarketplaceReportSerializer(reports, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class AdminReportActionView(APIView):
    """
    POST /api/v1/admin/marketplace/reports/{id}/action/
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request, pk):
        try:
            report = MarketplaceReport.objects.get(
                pk=pk, status='pending', deleted_at__isnull=True,
            )
        except MarketplaceReport.DoesNotExist:
            return Response({
                'success': False, 'message': 'Report not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminReportActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report.status = serializer.validated_data['status']
        report.admin_note = serializer.validated_data.get('admin_note', '')
        report.reviewed_by = request.user
        report.save(update_fields=['status', 'admin_note', 'reviewed_by'])

        # If actioned, hide the product
        if report.status == 'actioned':
            product = report.product
            product.status = 'hidden'
            product.is_hidden_by_user = True
            product.save(update_fields=['status', 'is_hidden_by_user'])

        return Response({
            'success': True,
            'message': f'Report marked as {report.status}.',
        })


class AdminReviewView(APIView):
    """POST /api/v1/admin/marketplace/{id}/review/ — combined approve/reject."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request, pk):
        action = request.data.get('action', '').strip()
        if action not in ('approve', 'reject'):
            return Response({
                'success': False,
                'message': "Action must be 'approve' or 'reject'.",
                'code': 'INVALID_ACTION',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = MarketplaceProduct.objects.get(pk=pk, deleted_at__isnull=True)
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False, 'message': 'Product not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            product.status = 'active'
            product.reviewed_by = request.user
            product.save(update_fields=['status', 'reviewed_by'])
            return Response({'success': True, 'message': 'Listing approved.'})

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({
                'success': False, 'message': 'Rejection reason is required.',
                'code': 'MISSING_FIELD',
            }, status=status.HTTP_400_BAD_REQUEST)
        product.status = 'rejected'
        product.rejection_reason = reason
        product.reviewed_by = request.user
        product.save(update_fields=['status', 'rejection_reason', 'reviewed_by'])
        return Response({'success': True, 'message': 'Listing rejected.'})


class AdminReportedListView(APIView):
    """GET /api/v1/admin/marketplace/reported/ — alias for reports list."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        reports = MarketplaceReport.objects.filter(
            status='pending', deleted_at__isnull=True,
        ).select_related('product', 'reporter')[:50]
        data = [
            {
                'id': str(r.id),
                'product': {'id': str(r.product.id), 'title': r.product.title},
                'reporter': {'id': str(r.reporter.id), 'name': r.reporter.full_name},
                'reason': r.reason,
                'details': r.details,
                'created_at': r.created_at.isoformat(),
            }
            for r in reports
        ]
        return Response({'success': True, 'data': data})


class AdminReportResolveView(APIView):
    """POST /api/v1/admin/marketplace/reports/{id}/resolve/ — resolve a report."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request, pk):
        try:
            report = MarketplaceReport.objects.get(pk=pk, deleted_at__isnull=True)
        except MarketplaceReport.DoesNotExist:
            return Response({
                'success': False, 'message': 'Report not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', 'dismissed')
        report.status = 'actioned' if action == 'action' else 'dismissed'
        report.admin_note = request.data.get('note', '')
        report.reviewed_by = request.user
        report.save(update_fields=['status', 'admin_note', 'reviewed_by'])

        if report.status == 'actioned':
            product = report.product
            product.status = 'hidden'
            product.save(update_fields=['status'])

        return Response({'success': True, 'message': f'Report {report.status}.'})
