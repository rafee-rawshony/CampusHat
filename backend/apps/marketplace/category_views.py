"""
Admin Category Views for the Marketplace.

CRUD operations for marketplace categories. Admin/Moderator only.
Endpoints are mounted under /api/v1/admin/marketplace/categories/.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminOrModerator

from .models import MarketplaceCategory
from .category_serializers import (
    AdminCategoryCreateSerializer,
    AdminCategoryListSerializer,
    AdminCategoryTreeSerializer,
    AdminCategoryUpdateSerializer,
    BulkReorderSerializer,
)


class AdminCategoryListView(APIView):
    """
    GET /api/v1/admin/marketplace/categories/
    POST /api/v1/admin/marketplace/categories/

    List all categories (flat or tree) and create new ones.
    Query params:
      - ad_type: filter by ad_type (sell, rent, service, food)
      - view: 'tree' for nested hierarchy, default is flat
      - parent: filter by parent ID (use 'root' for root categories only)
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        qs = MarketplaceCategory.objects.filter(
            deleted_at__isnull=True
        ).select_related('parent').prefetch_related('children', 'products')

        # Filter by ad_type
        ad_type = request.query_params.get('ad_type')
        if ad_type:
            qs = qs.filter(ad_type=ad_type)

        # Filter by parent level
        parent_filter = request.query_params.get('parent')
        if parent_filter == 'root':
            qs = qs.filter(parent__isnull=True)
        elif parent_filter:
            qs = qs.filter(parent_id=parent_filter)

        qs = qs.order_by('sort_order', 'name')

        # Tree view: only return root categories with nested children
        view_mode = request.query_params.get('view')
        if view_mode == 'tree':
            qs = qs.filter(parent__isnull=True)
            serializer = AdminCategoryTreeSerializer(qs, many=True)
        else:
            serializer = AdminCategoryListSerializer(qs, many=True)

        return Response({
            'success': True,
            'message': 'Categories retrieved successfully.',
            'data': serializer.data,
        })

    def post(self, request):
        serializer = AdminCategoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()

        output = AdminCategoryListSerializer(category).data
        return Response({
            'success': True,
            'message': 'Category created successfully.',
            'data': output,
        }, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(APIView):
    """
    GET /api/v1/admin/marketplace/categories/{id}/
    PATCH /api/v1/admin/marketplace/categories/{id}/
    DELETE /api/v1/admin/marketplace/categories/{id}/
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def _get_category(self, pk):
        try:
            return MarketplaceCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except MarketplaceCategory.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self._get_category(pk)
        if not category:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminCategoryTreeSerializer(category)
        return Response({
            'success': True,
            'message': 'Category retrieved.',
            'data': serializer.data,
        })

    def patch(self, request, pk):
        category = self._get_category(pk)
        if not category:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminCategoryUpdateSerializer(
            category, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        output = AdminCategoryListSerializer(updated).data
        return Response({
            'success': True,
            'message': 'Category updated successfully.',
            'data': output,
        })

    def delete(self, request, pk):
        category = self._get_category(pk)
        if not category:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if category has active listings
        active_count = category.products.filter(
            deleted_at__isnull=True,
            status='active',
        ).count()
        if active_count > 0:
            return Response({
                'success': False,
                'message': f'Cannot delete: {active_count} active listing(s) use this category.',
                'code': 'HAS_ACTIVE_LISTINGS',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Soft-delete children too
        category.children.filter(deleted_at__isnull=True).update(
            deleted_at=category.deleted_at
        )
        category.soft_delete()

        return Response({
            'success': True,
            'message': 'Category deleted successfully.',
        })


class AdminCategoryToggleView(APIView):
    """
    POST /api/v1/admin/marketplace/categories/{id}/toggle/

    Activate or deactivate a category.
    Also cascades to children when deactivating.
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request, pk):
        try:
            category = MarketplaceCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except MarketplaceCategory.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        new_status = not category.is_active
        category.is_active = new_status
        category.save(update_fields=['is_active'])

        # Cascade deactivation to children
        if not new_status:
            category.children.filter(
                deleted_at__isnull=True, is_active=True
            ).update(is_active=False)

        action_word = 'activated' if new_status else 'deactivated'
        return Response({
            'success': True,
            'message': f'Category {action_word} successfully.',
            'data': {'is_active': new_status},
        })


class AdminCategoryReorderView(APIView):
    """
    POST /api/v1/admin/marketplace/categories/reorder/

    Bulk update sort_order for categories.
    Payload: { "items": [{"id": "uuid", "sort_order": 1}, ...] }
    """

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def post(self, request):
        serializer = BulkReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items = serializer.validated_data['items']
        updated_count = 0

        for item in items:
            rows = MarketplaceCategory.objects.filter(
                pk=item['id'], deleted_at__isnull=True
            ).update(sort_order=item['sort_order'])
            updated_count += rows

        return Response({
            'success': True,
            'message': f'{updated_count} categories reordered.',
        })
