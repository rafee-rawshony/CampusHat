"""
Product Views for the Marketplace.

Public browse, verified-user create, owner actions (hide/unhide/repost/mark-sold),
and my-listings.
"""

from django.db.models import F
from django.utils import timezone
from datetime import timedelta

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from core.permissions import (
    IsVerifiedForMarketplace, IsMarketplacePostOwner
)

from .filters import MarketplaceProductFilter
from .models import (
    MarketplaceCategory,
    MarketplaceProduct,
    SELL_RENT_DURATIONS,
    SERVICE_FOOD_DURATIONS,
)
from .product_serializers import (
    MarketplaceCategoryFlatSerializer,
    MarketplaceCategorySerializer,
    MarketplaceProductCreateSerializer,
    MarketplaceProductDetailSerializer,
    MarketplaceProductListSerializer,
    MarketplaceProductOwnerSerializer,
    MarketplaceProductOwnerUpdateSerializer,  # NEW
)


# =============================================================================
# CATEGORIES
# =============================================================================

class CategoryListView(APIView):
    """
    GET /api/v1/marketplace/categories/
    GET /api/v1/marketplace/categories/?ad_type=sell
    GET /api/v1/marketplace/categories/?ad_type=sell&parent=<uuid>

    Public list of active categories with children.
    Query params:
      - ad_type: filter by main category type (sell, rent, service, food)
      - parent: filter by parent ID to get subcategories
      - flat: if 'true', returns flat list without nested children
    """

    permission_classes = [AllowAny]

    def get(self, request):
        ad_type = request.query_params.get('ad_type')
        parent_id = request.query_params.get('parent')
        flat_mode = request.query_params.get('flat') == 'true'

        qs = MarketplaceCategory.objects.filter(
            is_active=True,
            deleted_at__isnull=True,
        )

        if ad_type:
            qs = qs.filter(ad_type=ad_type)

        if parent_id:
            qs = qs.filter(parent_id=parent_id)
        else:
            qs = qs.filter(parent__isnull=True)

        qs = qs.order_by('sort_order', 'name')

        if flat_mode:
            serializer = MarketplaceCategoryFlatSerializer(qs, many=True)
        else:
            serializer = MarketplaceCategorySerializer(qs, many=True)

        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


# =============================================================================
# LISTINGS VIEWSET
# =============================================================================

class MarketplaceListingViewSet(ModelViewSet):
    """
    ViewSet for marketplace product listings.

    list:      GET    /listings/           (public, active only)
    retrieve:  GET    /listings/{id}/      (public, increments view_count)
    create:    POST   /listings/           (IsVerifiedStudent)
    update:    PATCH  /listings/{id}/      (owner only)
    hide:      POST   /listings/{id}/hide/
    unhide:    POST   /listings/{id}/unhide/
    repost:    POST   /listings/{id}/repost/
    mark_sold: POST   /listings/{id}/mark-sold/
    """

    http_method_names = ['get', 'post', 'patch']
    filterset_class = MarketplaceProductFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'price', 'view_count']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        elif self.action == 'create':
            return [IsAuthenticated(), IsVerifiedForMarketplace()]
        elif self.action in ('partial_update', 'update'):
            return [IsAuthenticated(), IsVerifiedForMarketplace(), IsMarketplacePostOwner()]
        elif self.action in ('hide', 'unhide', 'repost', 'mark_sold'):
            return [IsAuthenticated(), IsVerifiedForMarketplace(), IsMarketplacePostOwner()]
        return [IsAuthenticated()]

    def get_object(self):
        """
        Override get_object for owner and detail actions.

        Owner actions (edit/hide/unhide/repost/mark-sold) need to find products
        in any status. Retrieve also checks all non-deleted listings so owners
        can view and edit their rejected/expired/pending ads.
        """
        if self.action in ('retrieve', 'partial_update', 'update', 'hide', 'unhide', 'repost', 'mark_sold'):
            pk = self.kwargs.get('pk')
            try:
                obj = MarketplaceProduct.objects.select_related(
                    'university', 'category', 'user'
                ).prefetch_related('images').get(
                    pk=pk, deleted_at__isnull=True,
                )
                self.check_object_permissions(self.request, obj)
                return obj
            except MarketplaceProduct.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound('Listing not found.')
        return super().get_object()

    def get_serializer_class(self):
        if self.action == 'create':
            return MarketplaceProductCreateSerializer
        if self.action in ('update', 'partial_update'):
            return MarketplaceProductOwnerUpdateSerializer
        if self.action == 'list':
            return MarketplaceProductListSerializer
        if self.action == 'retrieve':
            return MarketplaceProductDetailSerializer
        return MarketplaceProductListSerializer

    def get_queryset(self):
        """Only active, non-expired, non-hidden products for public."""
        return (
            MarketplaceProduct.objects
            .filter(
                status='active',
                expires_at__gt=timezone.now(),
                is_hidden_by_user=False,
                deleted_at__isnull=True,
            )
            .select_related('university', 'category', 'user')
            .prefetch_related('images')
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Atomic view_count increment
        MarketplaceProduct.objects.filter(pk=instance.pk).update(
            view_count=F('view_count') + 1
        )
        instance.refresh_from_db()
        serializer = self.get_serializer(instance, context={'request': request})
        return Response({
            'success': True,
            'message': 'Request successful.',
            'data': serializer.data,
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        output = MarketplaceProductOwnerSerializer(product).data
        return Response({
            'success': True,
            'message': 'Listing created and submitted for approval.',
            'data': output,
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Disable full PUT — PATCH only."""
        return Response(
            {'error': 'Use PATCH for updates. Full PUT is not supported.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()  # triggers IsMarketplacePostOwner check
        serializer = self.get_serializer(
            instance, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        message = ('Ad updated and re-submitted for review.'
                   if updated.status == 'pending'
                   else 'Ad updated successfully.')
        return Response({
            'success': True, 'message': message,
            'data': MarketplaceProductOwnerSerializer(updated).data
        }, status=200)

    # -----------------------------------------------------------------
    # CUSTOM ACTIONS
    # -----------------------------------------------------------------

    @action(detail=True, methods=['post'], url_path='hide')
    def hide(self, request, pk=None):
        """POST /listings/{id}/hide/ — owner hides their post."""
        product = self.get_object()
        if product.user != request.user:
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)
        product.is_hidden_by_user = True
        product.status = 'hidden'
        product.save(update_fields=['is_hidden_by_user', 'status'])
        return Response({
            'success': True,
            'message': 'Listing hidden successfully.',
        })

    @action(detail=True, methods=['post'], url_path='unhide')
    def unhide(self, request, pk=None):
        """POST /listings/{id}/unhide/"""
        product = self.get_object()
        if product.user != request.user:
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)
        if product.expires_at and product.expires_at < timezone.now():
            return Response({
                'success': False,
                'message': 'Cannot unhide an expired listing. Use repost instead.',
                'code': 'EXPIRED',
            }, status=status.HTTP_400_BAD_REQUEST)
        product.is_hidden_by_user = False
        product.status = 'active'
        product.save(update_fields=['is_hidden_by_user', 'status'])
        return Response({
            'success': True,
            'message': 'Listing unhidden successfully.',
        })

    @action(detail=True, methods=['post'], url_path='repost')
    def repost(self, request, pk=None):
        """POST /listings/{id}/repost/ — repost expired/hidden listing."""
        product = self.get_object()
        if product.user != request.user:
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)
        if product.status not in ('expired', 'hidden'):
            return Response({
                'success': False,
                'message': 'Only expired or hidden listings can be reposted.',
                'code': 'INVALID_STATUS',
            }, status=status.HTTP_400_BAD_REQUEST)

        duration = request.data.get('duration_days')
        if duration is None:
            return Response({
                'success': False,
                'message': 'duration_days is required.',
                'code': 'MISSING_FIELD',
            }, status=status.HTTP_400_BAD_REQUEST)
        duration = int(duration)

        # Validate duration
        if product.post_type in ('sell', 'rent') and duration not in SELL_RENT_DURATIONS:
            return Response({
                'success': False,
                'message': f'For {product.post_type}, duration must be one of {SELL_RENT_DURATIONS}.',
            }, status=status.HTTP_400_BAD_REQUEST)
        if product.post_type in ('service', 'food') and duration not in SERVICE_FOOD_DURATIONS:
            return Response({
                'success': False,
                'message': f'For {product.post_type}, duration must be one of {SERVICE_FOOD_DURATIONS}.',
            }, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        product.duration_days = duration
        product.expires_at = now + timedelta(days=duration)
        product.status = 'pending'
        product.is_auto_expired = False
        product.is_hidden_by_user = False
        product.repost_count = F('repost_count') + 1
        product.save(update_fields=[
            'duration_days', 'expires_at', 'status',
            'is_auto_expired', 'is_hidden_by_user', 'repost_count',
        ])
        product.refresh_from_db()

        output = MarketplaceProductOwnerSerializer(product).data
        return Response({
            'success': True,
            'message': 'Listing reposted and submitted for approval.',
            'data': output,
        })

    @action(detail=True, methods=['post'], url_path='mark-sold')
    def mark_sold(self, request, pk=None):
        """POST /listings/{id}/mark-sold/"""
        product = self.get_object()
        if product.user != request.user:
            return Response({
                'success': False, 'message': 'Forbidden.', 'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)
        product.status = 'sold'
        product.save(update_fields=['status'])
        return Response({
            'success': True,
            'message': 'Listing marked as sold.',
        })


# =============================================================================
# MY LISTINGS
# =============================================================================

class MyListingsView(APIView):
    """
    GET /api/v1/marketplace/my-listings/

    Return the authenticated user's listings (all statuses).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = (
            MarketplaceProduct.objects
            .filter(user=request.user, deleted_at__isnull=True)
            .select_related('university', 'category')
            .prefetch_related('images')
            .order_by('-created_at')
        )
        serializer = MarketplaceProductOwnerSerializer(products, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })
