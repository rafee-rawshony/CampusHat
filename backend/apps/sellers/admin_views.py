"""
Admin Views for the Seller System.

Seller approval, store approval, badge management, payout management.
"""

from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from core.permissions import IsAdminOrModerator, IsSellerModerator

from .models import SellerBadge, SellerPayoutRequest, SellerProfile, Store
from .serializers import (
    SellerProfileAdminSerializer, StoreDetailSerializer,
    SellerPayoutRequestSerializer, SellerBadgeSerializer,
)


# =============================================================================
# SELLER APPROVAL
# =============================================================================

class AdminSellerPendingView(GenericAPIView):
    """GET /api/v1/admin/sellers/pending/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]
    serializer_class = SellerProfileAdminSerializer

    def get(self, request):
        sellers = SellerProfile.objects.filter(
            status='pending', deleted_at__isnull=True,
        ).select_related('user').order_by('created_at')
        serializer = SellerProfileAdminSerializer(sellers, many=True)
        return Response({
            'success': True, 'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class AdminSellerDetailView(GenericAPIView):
    """GET /api/v1/admin/sellers/{id}/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]
    serializer_class = SellerProfileAdminSerializer

    def get(self, request, pk):
        try:
            seller = SellerProfile.objects.select_related('user').get(
                pk=pk, deleted_at__isnull=True,
            )
        except SellerProfile.DoesNotExist:
            return Response({
                'success': False, 'message': 'Seller not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'success': True, 'message': 'Request successful.',
            'data': SellerProfileAdminSerializer(seller).data,
        })


class AdminSellerApproveView(APIView):
    """POST /api/v1/admin/sellers/{id}/approve/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            seller = SellerProfile.objects.get(
                pk=pk, status='pending', deleted_at__isnull=True,
            )
        except SellerProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Seller not found or not pending.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        seller.status = 'approved'
        seller.approved_by = request.user
        seller.save(update_fields=['status', 'approved_by'])

        return Response({
            'success': True, 'message': 'Seller approved.',
        })


class AdminSellerRejectView(APIView):
    """POST /api/v1/admin/sellers/{id}/reject/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            seller = SellerProfile.objects.get(
                pk=pk, status='pending', deleted_at__isnull=True,
            )
        except SellerProfile.DoesNotExist:
            return Response({
                'success': False, 'message': 'Seller not found or not pending.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({
                'success': False, 'message': 'Rejection reason is required.',
                'code': 'MISSING_FIELD',
            }, status=status.HTTP_400_BAD_REQUEST)

        seller.status = 'rejected'
        seller.rejection_reason = reason
        seller.save(update_fields=['status', 'rejection_reason'])
        return Response({'success': True, 'message': 'Seller rejected.'})


class AdminSellerSuspendView(APIView):
    """POST /api/v1/admin/sellers/{id}/suspend/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            seller = SellerProfile.objects.get(
                pk=pk, status='approved', deleted_at__isnull=True,
            )
        except SellerProfile.DoesNotExist:
            return Response({
                'success': False, 'message': 'Seller not found or not approved.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        seller.status = 'suspended'
        seller.save(update_fields=['status'])
        return Response({'success': True, 'message': 'Seller suspended.'})


# =============================================================================
# STORE APPROVAL
# =============================================================================

class AdminStorePendingView(GenericAPIView):
    """GET /api/v1/admin/stores/pending/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]
    serializer_class = StoreDetailSerializer

    def get(self, request):
        stores = Store.objects.filter(
            status='under_review', deleted_at__isnull=True,
        ).select_related('seller', 'university').order_by('created_at')
        serializer = StoreDetailSerializer(stores, many=True)
        return Response({
            'success': True, 'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class AdminStoreDetailView(GenericAPIView):
    """GET /api/v1/admin/stores/{id}/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]
    serializer_class = StoreDetailSerializer

    def get(self, request, pk):
        try:
            store = Store.objects.select_related(
                'seller', 'university',
            ).get(pk=pk, deleted_at__isnull=True)
        except Store.DoesNotExist:
            return Response({
                'success': False, 'message': 'Store not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'success': True, 'message': 'Request successful.',
            'data': StoreDetailSerializer(store).data,
        })


class AdminStoreApproveView(APIView):
    """POST /api/v1/admin/stores/{id}/approve/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            store = Store.objects.select_related('seller__user__university').get(
                pk=pk, status='under_review', deleted_at__isnull=True,
            )
        except Store.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Store not found or not under review.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        store.status = 'active'
        store.approved_by = request.user
        store.save(update_fields=['status', 'approved_by'])

        # Award student seller badge if applicable
        if store.seller.is_student_seller:
            SellerBadge.award_student_seller_badge(store)

        return Response({'success': True, 'message': 'Store approved and now active.'})


class AdminStoreRejectView(APIView):
    """POST /api/v1/admin/stores/{id}/reject/"""
    permission_classes = [IsAuthenticated, IsSellerModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            store = Store.objects.get(
                pk=pk, status='under_review', deleted_at__isnull=True,
            )
        except Store.DoesNotExist:
            return Response({
                'success': False, 'message': 'Store not found or not under review.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({
                'success': False, 'message': 'Rejection reason is required.',
                'code': 'MISSING_FIELD',
            }, status=status.HTTP_400_BAD_REQUEST)

        store.status = 'rejected'
        store.rejection_reason = reason
        store.save(update_fields=['status', 'rejection_reason'])
        return Response({'success': True, 'message': 'Store rejected.'})


# =============================================================================
# BADGE MANAGEMENT
# =============================================================================

class AdminAwardBadgeView(APIView):
    """POST /api/v1/admin/stores/{id}/badges/award/"""
    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            store = Store.objects.get(pk=pk, deleted_at__isnull=True)
        except Store.DoesNotExist:
            return Response({
                'success': False, 'message': 'Store not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        badge_type = request.data.get('badge_type', '').strip()
        valid_types = [c[0] for c in SellerBadge._meta.get_field('badge_type').choices]
        if badge_type not in valid_types:
            return Response({
                'success': False,
                'message': f'Invalid badge type. Must be one of: {valid_types}',
                'code': 'INVALID_TYPE',
            }, status=status.HTTP_400_BAD_REQUEST)

        label = request.data.get('display_label', '').strip()
        if not label:
            label = dict(SellerBadge._meta.get_field('badge_type').choices).get(badge_type, badge_type)

        badge = SellerBadge.objects.create(
            store=store,
            badge_type=badge_type,
            display_label=label,
            awarded_by=request.user,
            awarded_at=timezone.now(),
        )
        return Response({
            'success': True, 'message': 'Badge awarded.',
            'data': SellerBadgeSerializer(badge).data,
        }, status=status.HTTP_201_CREATED)


class AdminRevokeBadgeView(APIView):
    """POST /api/v1/admin/stores/{store_id}/badges/{badge_id}/revoke/"""
    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    @extend_schema(request=None)

    def post(self, request, pk, badge_id):
        try:
            badge = SellerBadge.objects.get(
                pk=badge_id, store_id=pk, is_active=True,
            )
        except SellerBadge.DoesNotExist:
            return Response({
                'success': False, 'message': 'Badge not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        badge.is_active = False
        badge.revoked_at = timezone.now()
        badge.save(update_fields=['is_active', 'revoked_at'])
        return Response({'success': True, 'message': 'Badge revoked.'})


# =============================================================================
# PAYOUT MANAGEMENT
# =============================================================================

class AdminPayoutPendingView(GenericAPIView):
    """GET /api/v1/admin/payouts/pending/"""
    permission_classes = [IsAuthenticated, IsAdminOrModerator]
    serializer_class = SellerPayoutRequestSerializer

    def get(self, request):
        payouts = SellerPayoutRequest.objects.filter(
            status='pending', deleted_at__isnull=True,
        ).select_related('seller__user').order_by('created_at')
        serializer = SellerPayoutRequestSerializer(payouts, many=True)
        return Response({
            'success': True, 'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class AdminPayoutProcessView(APIView):
    """POST /api/v1/admin/payouts/{id}/process/"""
    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            payout = SellerPayoutRequest.objects.get(
                pk=pk, status='pending', deleted_at__isnull=True,
            )
        except SellerPayoutRequest.DoesNotExist:
            return Response({
                'success': False, 'message': 'Payout not found or not pending.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        ref = request.data.get('bank_transaction_ref', '').strip()
        payout.status = 'completed'
        payout.processed_by = request.user
        payout.bank_transaction_ref = ref
        payout.processed_at = timezone.now()
        payout.save(update_fields=[
            'status', 'processed_by', 'bank_transaction_ref', 'processed_at',
        ])

        try:
            from .tasks import notify_payout_processed
            notify_payout_processed.delay(str(payout.id))
        except Exception:
            pass

        return Response({'success': True, 'message': 'Payout processed.'})


class AdminPayoutRejectView(APIView):
    """POST /api/v1/admin/payouts/{id}/reject/"""
    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    @extend_schema(request=None)

    def post(self, request, pk):
        try:
            payout = SellerPayoutRequest.objects.get(
                pk=pk, status='pending', deleted_at__isnull=True,
            )
        except SellerPayoutRequest.DoesNotExist:
            return Response({
                'success': False, 'message': 'Payout not found or not pending.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        note = request.data.get('note', '').strip()
        payout.status = 'rejected'
        payout.note = note
        payout.processed_by = request.user
        payout.processed_at = timezone.now()
        payout.save(update_fields=['status', 'note', 'processed_by', 'processed_at'])
        return Response({'success': True, 'message': 'Payout rejected.'})


class AdminSellerReviewView(APIView):
    """POST /api/v1/admin/sellers/{id}/review/ — combined approve/reject action."""

    permission_classes = [IsAuthenticated, IsSellerModerator]

    def post(self, request, pk):
        try:
            seller = SellerProfile.objects.get(pk=pk, deleted_at__isnull=True)
        except SellerProfile.DoesNotExist:
            return Response({
                'success': False, 'message': 'Seller not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', '').strip()
        if action not in ('approve', 'reject'):
            return Response({
                'success': False, 'message': "Action must be 'approve' or 'reject'.",
                'code': 'INVALID_ACTION',
            }, status=status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            seller.status = 'approved'
            seller.approved_by = request.user
            seller.save(update_fields=['status', 'approved_by'])
            
            # Update the user's role to seller if they are a regular user or student
            if seller.user.role in ['normal_user', 'student']:
                seller.user.role = 'seller'
                seller.user.save(update_fields=['role'])
                
            # Automatically activate their store if they have one and it's not active
            if hasattr(seller, 'store') and seller.store:
                if seller.store.status != 'active':
                    seller.store.status = 'active'
                    seller.store.save(update_fields=['status'])
                
            return Response({'success': True, 'message': 'Seller approved.'})

        reason = request.data.get('reason', '').strip()
        notes = request.data.get('notes', '').strip()
        if not reason:
            return Response({
                'success': False, 'message': 'Rejection reason is required.',
                'code': 'MISSING_FIELD',
            }, status=status.HTTP_400_BAD_REQUEST)

        full_reason = f"{reason} - {notes}" if notes else reason
        seller.status = 'rejected'
        seller.rejection_reason = full_reason
        seller.save(update_fields=['status', 'rejection_reason'])
        return Response({'success': True, 'message': 'Seller rejected.'})
