"""
Seller Views.

Seller registration, profile, dashboard, store management, payouts.
"""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView

from core.permissions import IsApprovedSeller

from django.db.models import F

from .models import SellerProfile, Store, SellerPayoutRequest, StoreFollower
from .serializers import (
    SellerRegistrationSerializer, SellerProfileSerializer,
    StoreCreateSerializer, StoreUpdateSerializer, StoreDetailSerializer,
    StoreListSerializer, SellerPayoutRequestSerializer,
    SellerDashboardSerializer, SellerBadgeSerializer,
)


# =============================================================================
# SELLER REGISTRATION & PROFILE
# =============================================================================

class SellerRegisterView(GenericAPIView):
    """POST /api/v1/sellers/register/"""

    permission_classes = [IsAuthenticated]
    serializer_class = SellerRegistrationSerializer

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

        serializer = self.get_serializer(
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


class SellerMyProfileView(GenericAPIView):
    """GET/PATCH /api/v1/sellers/my-profile/"""

    permission_classes = [IsAuthenticated]
    serializer_class = SellerProfileSerializer

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


class SellerDashboardView(GenericAPIView):
    """GET /api/v1/sellers/my-dashboard/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerDashboardSerializer

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

class StoreCreateView(GenericAPIView):
    """POST /api/v1/stores/create/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = StoreCreateSerializer

    def post(self, request):
        seller = request.user.seller_profile
        if Store.objects.filter(seller=seller, deleted_at__isnull=True).exists():
            return Response({
                'success': False,
                'message': 'You already have a store.',
                'code': 'DUPLICATE',
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(
            data=request.data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        store = serializer.save()
        return Response({
            'success': True,
            'message': 'Store created as draft. Submit for review when ready.',
            'data': StoreDetailSerializer(store).data,
        }, status=status.HTTP_201_CREATED)


class MyStoreView(GenericAPIView):
    """GET /api/v1/stores/my-store/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = StoreDetailSerializer

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


class StoreUpdateView(GenericAPIView):
    """PATCH /api/v1/stores/my-store/update/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = StoreUpdateSerializer

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

        serializer = self.get_serializer(store, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 'message': 'Store updated.',
            'data': StoreDetailSerializer(store).data,
        })


class StoreSubmitForReviewView(APIView):
    """POST /api/v1/stores/my-store/submit-for-review/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    @extend_schema(request=None)
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


class PublicStoreDetailView(GenericAPIView):
    """GET /api/v1/stores/{slug}/"""

    permission_classes = [AllowAny]
    serializer_class = StoreDetailSerializer

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


class PublicStoreListView(GenericAPIView):
    """GET /api/v1/stores/"""

    permission_classes = [AllowAny]
    serializer_class = StoreListSerializer

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


class FeaturedStoresView(APIView):
    """GET /api/v1/sellers/featured/ — top stores by rating and follower count."""

    permission_classes = [AllowAny]

    def get(self, request):
        limit = int(request.query_params.get('limit', 8))
        # select_related('seller') avoids N+1 query on the seller FK
        # for each store in the loop below.
        stores = Store.objects.filter(
            status='active', deleted_at__isnull=True,
        ).select_related('seller').order_by('-rating', '-follower_count')[:limit]

        data = []
        for store in stores:
            seller = getattr(store, 'seller', None)
            data.append({
                'id': str(store.id),
                'store': {
                    'slug': store.slug,
                    'name': store.name,
                    'logo': store.logo.url if store.logo else None,
                    'banner_color': '#4C3B8A',
                    'badge_label': store.badge_label,
                },
                'rating_avg': float(store.rating),
                'follower_count': store.follower_count,
            })

        return Response({'success': True, 'data': data})


# =============================================================================
# PAYOUTS
# =============================================================================

class PayoutRequestView(GenericAPIView):
    """POST /api/v1/sellers/payouts/request/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerPayoutRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 'message': 'Payout request submitted.',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class PayoutListView(GenericAPIView):
    """GET /api/v1/sellers/payouts/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerPayoutRequestSerializer

    def get(self, request):
        payouts = SellerPayoutRequest.objects.filter(
            seller=request.user.seller_profile, deleted_at__isnull=True,
        ).order_by('-created_at')
        serializer = SellerPayoutRequestSerializer(payouts, many=True)
        return Response({
            'success': True, 'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


# =============================================================================
# STORE FOLLOW / UNFOLLOW
# =============================================================================

class StoreFollowToggleView(APIView):
    """POST /api/v1/stores/<slug>/follow/ — toggle follow/unfollow."""

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        try:
            store = Store.objects.get(slug=slug, deleted_at__isnull=True)
        except Store.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Store not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        existing = StoreFollower.objects.filter(store=store, user=request.user).first()
        if existing:
            existing.delete()
            Store.objects.filter(pk=store.pk).update(follower_count=F('follower_count') - 1)
            return Response({
                'success': True,
                'message': 'Unfollowed.',
                'data': {'is_following': False},
            })

        StoreFollower.objects.create(store=store, user=request.user)
        Store.objects.filter(pk=store.pk).update(follower_count=F('follower_count') + 1)
        return Response({
            'success': True,
            'message': 'Following.',
            'data': {'is_following': True},
        }, status=status.HTTP_201_CREATED)


class StoreFollowStatusView(APIView):
    """GET /api/v1/stores/<slug>/follow_status/ — check if user follows store."""

    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        try:
            store = Store.objects.get(slug=slug, deleted_at__isnull=True)
        except Store.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Store not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_following = StoreFollower.objects.filter(
            store=store, user=request.user
        ).exists()

        return Response({
            'success': True,
            'data': {'is_following': is_following},
        })
