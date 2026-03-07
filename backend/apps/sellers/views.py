"""
Seller Views.

Seller registration, profile, dashboard, store management, payouts.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsApprovedSeller

from .models import SellerProfile, Store, SellerPayoutRequest
from .serializers import (
    SellerRegistrationSerializer, SellerProfileSerializer,
    StoreCreateSerializer, StoreUpdateSerializer, StoreDetailSerializer,
    StoreListSerializer, SellerPayoutRequestSerializer,
    SellerDashboardSerializer, SellerBadgeSerializer,
)


# =============================================================================
# SELLER REGISTRATION & PROFILE
# =============================================================================

class SellerRegisterView(APIView):
    """POST /api/v1/sellers/register/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if SellerProfile.objects.filter(
            user=request.user, deleted_at__isnull=True,
            status__in=['pending', 'approved'],
        ).exists():
            return Response({
                'success': False,
                'message': 'You already have an active seller application.',
                'code': 'DUPLICATE',
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = SellerRegistrationSerializer(
            data=request.data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        seller = serializer.save()

        # Queue admin notification
        try:
            from .tasks import notify_admin_new_seller_application
            notify_admin_new_seller_application.delay(str(seller.id))
        except Exception:
            pass

        return Response({
            'success': True,
            'message': 'Seller application submitted for review.',
            'data': SellerProfileSerializer(seller).data,
        }, status=status.HTTP_201_CREATED)


class SellerMyProfileView(APIView):
    """GET/PATCH /api/v1/sellers/my-profile/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            seller = SellerProfile.objects.get(
                user=request.user, deleted_at__isnull=True,
            )
        except SellerProfile.DoesNotExist:
            return Response({
                'success': False, 'message': 'No seller profile found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True, 'message': 'Request successful.',
            'data': SellerProfileSerializer(seller).data,
        })

    def patch(self, request):
        try:
            seller = SellerProfile.objects.get(
                user=request.user, deleted_at__isnull=True,
            )
        except SellerProfile.DoesNotExist:
            return Response({
                'success': False, 'message': 'No seller profile found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        allowed = ['business_name', 'business_phone', 'business_email']
        for field in allowed:
            if field in request.data:
                setattr(seller, field, request.data[field])
        seller.save()
        return Response({
            'success': True, 'message': 'Profile updated.',
            'data': SellerProfileSerializer(seller).data,
        })


class SellerDashboardView(APIView):
    """GET /api/v1/sellers/my-dashboard/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        seller = request.user.seller_profile
        store = getattr(seller, 'store', None)
        badges = store.badges.filter(is_active=True) if store else []
        pending_payouts = SellerPayoutRequest.objects.filter(
            seller=seller, status='pending', deleted_at__isnull=True,
        ).count()

        data = {
            'business_name': seller.business_name,
            'status': seller.status,
            'commission_rate': seller.commission_rate,
            'is_student_seller': seller.is_student_seller,
            'store_name': store.name if store else None,
            'store_status': store.status if store else None,
            'total_sales_count': store.total_sales_count if store else 0,
            'rating_avg': store.rating_avg if store else 0,
            'review_count': store.review_count if store else 0,
            'badges': SellerBadgeSerializer(badges, many=True).data,
            'pending_payouts': pending_payouts,
        }
        return Response({
            'success': True, 'message': 'Request successful.',
            'data': data,
        })


# =============================================================================
# STORE MANAGEMENT
# =============================================================================

class StoreCreateView(APIView):
    """POST /api/v1/stores/create/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def post(self, request):
        seller = request.user.seller_profile
        if Store.objects.filter(seller=seller, deleted_at__isnull=True).exists():
            return Response({
                'success': False,
                'message': 'You already have a store.',
                'code': 'DUPLICATE',
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = StoreCreateSerializer(
            data=request.data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        store = serializer.save()
        return Response({
            'success': True,
            'message': 'Store created as draft. Submit for review when ready.',
            'data': StoreDetailSerializer(store).data,
        }, status=status.HTTP_201_CREATED)


class MyStoreView(APIView):
    """GET /api/v1/stores/my-store/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        try:
            store = Store.objects.get(
                seller=request.user.seller_profile, deleted_at__isnull=True,
            )
        except Store.DoesNotExist:
            return Response({
                'success': False, 'message': 'No store found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True, 'message': 'Request successful.',
            'data': StoreDetailSerializer(store).data,
        })


class StoreUpdateView(APIView):
    """PATCH /api/v1/stores/my-store/update/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def patch(self, request):
        try:
            store = Store.objects.get(
                seller=request.user.seller_profile, deleted_at__isnull=True,
            )
        except Store.DoesNotExist:
            return Response({
                'success': False, 'message': 'No store found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = StoreUpdateSerializer(store, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 'message': 'Store updated.',
            'data': StoreDetailSerializer(store).data,
        })


class StoreSubmitForReviewView(APIView):
    """POST /api/v1/stores/my-store/submit-for-review/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def post(self, request):
        try:
            store = Store.objects.get(
                seller=request.user.seller_profile, deleted_at__isnull=True,
            )
        except Store.DoesNotExist:
            return Response({
                'success': False, 'message': 'No store found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if store.status not in ('draft', 'rejected'):
            return Response({
                'success': False,
                'message': 'Only draft or rejected stores can be submitted.',
                'code': 'INVALID_STATUS',
            }, status=status.HTTP_400_BAD_REQUEST)

        store.status = 'under_review'
        store.save(update_fields=['status'])
        return Response({
            'success': True, 'message': 'Store submitted for review.',
        })


class PublicStoreDetailView(APIView):
    """GET /api/v1/stores/{slug}/"""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            store = Store.objects.select_related(
                'seller', 'university',
            ).get(slug=slug, status='active', deleted_at__isnull=True)
        except Store.DoesNotExist:
            return Response({
                'success': False, 'message': 'Store not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True, 'message': 'Request successful.',
            'data': StoreDetailSerializer(store).data,
        })


class PublicStoreListView(APIView):
    """GET /api/v1/stores/"""

    permission_classes = [AllowAny]

    def get(self, request):
        qs = Store.objects.filter(
            status='active', deleted_at__isnull=True,
        ).select_related('university')

        # Filters
        uni_slug = request.query_params.get('university_slug')
        if uni_slug:
            qs = qs.filter(university__slug=uni_slug)
        cat = request.query_params.get('store_category')
        if cat:
            qs = qs.filter(store_category__icontains=cat)

        serializer = StoreListSerializer(qs, many=True)
        return Response({
            'success': True, 'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


# =============================================================================
# PAYOUTS
# =============================================================================

class PayoutRequestView(APIView):
    """POST /api/v1/sellers/payouts/request/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def post(self, request):
        serializer = SellerPayoutRequestSerializer(
            data=request.data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 'message': 'Payout request submitted.',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class PayoutListView(APIView):
    """GET /api/v1/sellers/payouts/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        payouts = SellerPayoutRequest.objects.filter(
            seller=request.user.seller_profile, deleted_at__isnull=True,
        ).order_by('-created_at')
        serializer = SellerPayoutRequestSerializer(payouts, many=True)
        return Response({
            'success': True, 'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })
