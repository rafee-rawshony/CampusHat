"""
Refund Views.

Buyer: request refund, view own refunds.
Admin: list pending, approve, reject, process.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.orders.models import Order
from core.pagination import CampusHatPagination

from .models import Refund
from .serializers import (
    AdminRefundActionSerializer,
    RefundDetailSerializer,
    RefundListSerializer,
    RefundRequestSerializer,
)
from .services.process_refund import process_approved_refund


class RefundRequestView(GenericAPIView):
    """POST /api/v1/refunds/request/ — buyer requests a refund."""

    permission_classes = [IsAuthenticated]
    serializer_class = RefundRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.select_related('store__seller').get(
                id=serializer.validated_data['order_id'],
                buyer=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.order_status != 'delivered':
            return Response(
                {'success': False, 'message': 'Can only refund delivered orders.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Refund.objects.filter(order=order).exclude(
            status__in=['rejected'],
        ).exists():
            return Response(
                {'success': False, 'message': 'A refund request already exists.'},
                status=status.HTTP_409_CONFLICT,
            )

        refund = Refund.objects.create(
            order=order,
            requested_by=request.user,
            reason=serializer.validated_data['reason'],
            refund_amount=order.total_amount,
            commission_reversal_amount=order.platform_commission,
            seller_deduction_amount=order.seller_net_amount,
        )

        return Response({
            'success': True,
            'message': 'Refund request submitted.',
            'data': RefundDetailSerializer(refund).data,
        }, status=status.HTTP_201_CREATED)


class BuyerRefundListView(GenericAPIView):
    """GET /api/v1/refunds/my-refunds/"""

    permission_classes = [IsAuthenticated]
    serializer_class = RefundListSerializer

    def get(self, request):
        refunds = Refund.objects.filter(
            requested_by=request.user,
        ).select_related('order').order_by('-created_at')

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(refunds, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({
            'success': True, 'data': self.get_serializer(refunds, many=True).data,
        })


class RefundDetailView(GenericAPIView):
    """GET /api/v1/refunds/{id}/"""

    permission_classes = [IsAuthenticated]
    serializer_class = RefundDetailSerializer

    def get(self, request, refund_id):
        try:
            refund = Refund.objects.select_related(
                'order', 'reviewed_by',
            ).get(id=refund_id, requested_by=request.user)
        except Refund.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Refund not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({
            'success': True, 'data': RefundDetailSerializer(refund).data,
        })


# ── Seller Views ─────────────────────────────────────────────────────

class SellerRefundListView(GenericAPIView):
    """
    GET /api/v1/seller/refunds/

    Lists every refund request raised against this seller's orders. The
    seller can't approve / reject (admin-only) but they need to see
    pending requests to prepare their side of the dispute.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = RefundListSerializer

    def get(self, request):
        store = None
        try:
            store = request.user.seller_profile.store
        except Exception:
            pass
        if not store:
            return Response({
                'success': True, 'message': 'No store found.', 'data': [],
            })

        # Optional ?status=pending|approved|rejected|processed filter.
        refunds = Refund.objects.filter(
            order__store=store,
        ).select_related('order', 'requested_by').order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            refunds = refunds.filter(status=status_filter)

        # Build a richer payload with order number + buyer email + first item name.
        data = []
        for r in refunds:
            order = r.order
            first_item = order.items.first() if hasattr(order, 'items') else None
            data.append({
                'id': str(r.id),
                'order_id': str(order.id),
                'order_number': order.order_number,
                'buyer_email': order.buyer.email if order.buyer_id else None,
                'product_name': first_item.product_name_snapshot if first_item else None,
                'reason': r.reason,
                'evidence_urls': r.evidence_urls or [],
                'refund_amount': str(r.refund_amount),
                'seller_deduction_amount': str(r.seller_deduction_amount),
                'status': r.status,
                'rejection_reason': r.rejection_reason,
                'approved_at': r.approved_at,
                'processed_at': r.processed_at,
                'created_at': r.created_at,
            })
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': data,
        })


# ── Admin Views ──────────────────────────────────────────────────────

class AdminPendingRefundsView(GenericAPIView):
    """GET /api/v1/admin/refunds/pending/"""

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = RefundDetailSerializer

    def get(self, request):
        refunds = Refund.objects.filter(
            status__in=['pending', 'under_review'],
        ).select_related('order', 'requested_by').order_by('-created_at')

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(refunds, request)
        if page is not None:
            return paginator.get_paginated_response(
                RefundDetailSerializer(page, many=True).data,
            )
        return Response({
            'success': True, 'data': RefundDetailSerializer(refunds, many=True).data,
        })


class AdminRefundDetailView(GenericAPIView):
    """GET /api/v1/admin/refunds/{id}/"""

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = RefundDetailSerializer

    def get(self, request, refund_id):
        try:
            refund = Refund.objects.select_related(
                'order', 'requested_by', 'reviewed_by',
            ).get(id=refund_id)
        except Refund.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Refund not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({
            'success': True, 'data': RefundDetailSerializer(refund).data,
        })


class AdminApproveRefundView(APIView):
    """POST /api/v1/admin/refunds/{id}/approve/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(request=None)
    def post(self, request, refund_id):
        try:
            refund = Refund.objects.get(id=refund_id)
        except Refund.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Refund not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if refund.status not in ('pending', 'under_review'):
            return Response(
                {'success': False, 'message': f'Cannot approve — status is {refund.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refund.status = 'approved'
        refund.approved_at = timezone.now()
        refund.reviewed_by = request.user
        refund.save(update_fields=['status', 'approved_at', 'reviewed_by', 'updated_at'])

        return Response({
            'success': True, 'message': 'Refund approved.',
            'data': RefundDetailSerializer(refund).data,
        })


class AdminRejectRefundView(APIView):
    """POST /api/v1/admin/refunds/{id}/reject/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(request=AdminRefundActionSerializer)
    def post(self, request, refund_id):
        try:
            refund = Refund.objects.get(id=refund_id)
        except Refund.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Refund not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminRefundActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refund.status = 'rejected'
        refund.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        refund.reviewed_by = request.user
        refund.save(update_fields=['status', 'rejection_reason', 'reviewed_by', 'updated_at'])

        return Response({
            'success': True, 'message': 'Refund rejected.',
            'data': RefundDetailSerializer(refund).data,
        })


class AdminProcessRefundView(APIView):
    """POST /api/v1/admin/refunds/{id}/process/ — atomic wallet reversal."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(request=None)
    def post(self, request, refund_id):
        try:
            refund = Refund.objects.select_related(
                'order', 'order__buyer', 'order__store__seller__user',
            ).get(id=refund_id)
        except Refund.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Refund not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            process_approved_refund(refund, request.user)
        except ValueError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Refund processing failed: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        refund.refresh_from_db()
        return Response({
            'success': True, 'message': 'Refund processed. Wallets updated.',
            'data': RefundDetailSerializer(refund).data,
        })
