"""
Mall Views.

Category management, product CRUD, reviews, variants, and cart operations.
"""

from decimal import Decimal

from django.db import IntegrityError, models, transaction
from django.db.models import F
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ViewSet

from core.permissions import IsAdminOnly, IsApprovedSeller, IsNormalUserOrAbove

from .filters import StoreProductFilter
from .models import (
    Banner,
    Brand,
    Cart,
    CartItem,
    MallCategory,
    ProductReview,
    ProductVariant,
    StoreProduct,
    StoreProductImage,
    Wishlist,
    ProductQuestion,
)
from .serializers import (
    AddToCartSerializer,
    CartItemSerializer,
    CartSerializer,
    CartSummarySerializer,
    MallCategoryCreateUpdateSerializer,
    MallCategoryDetailSerializer,
    MallCategorySerializer,
    MallCategoryTreeSerializer,
    ProductReviewCreateSerializer,
    ProductReviewSerializer,
    ProductVariantCreateUpdateSerializer,
    ProductVariantSerializer,
    SellerResponseSerializer,
    StoreProductCreateUpdateSerializer,
    StoreProductDetailSerializer,
    StoreProductListSerializer,
    UpdateCartItemSerializer,
    ProductQuestionSerializer,
    ProductQuestionCreateSerializer,
    SellerAnswerQuestionSerializer,
)


# =============================================================================
# CATEGORY VIEWS
# =============================================================================

class MallCategoryViewSet(ViewSet):
    """
    Mall category endpoints.

    Public: flat list, tree, detail by slug.
    Admin: create, update, delete.
    """

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'reorder'):
            return [IsAuthenticated(), IsAdminOnly()]
        return [AllowAny()]

    def list(self, request):
        """GET /api/v1/mall/categories/ — flat list of all active categories."""
        categories = MallCategory.objects.filter(deleted_at__isnull=True)
        is_admin = (
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'admin'
        )
        if not is_admin:
            categories = categories.filter(is_active=True)
        else:
            is_active = request.query_params.get('is_active')
            if is_active in ('true', 'false'):
                categories = categories.filter(is_active=is_active == 'true')

        categories = categories.order_by('level', 'sort_order', 'name')

        serializer = MallCategorySerializer(categories, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })

    @action(detail=False, methods=['get'], url_path='tree')
    def tree(self, request):
        """GET /api/v1/mall/categories/tree/ — nested tree structure."""
        is_admin = (
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'admin'
        )
        if is_admin:
            categories = list(
                MallCategory.objects.filter(deleted_at__isnull=True)
                .select_related('parent')
                .order_by('level', 'sort_order', 'name')
            )
            cat_map = {}
            tree_data = []
            for cat in categories:
                cat_map[cat.pk] = {
                    'id': str(cat.id),
                    'name': cat.name,
                    'slug': cat.slug,
                    'level': cat.level,
                    'parent': str(cat.parent_id) if cat.parent_id else None,
                    'parent_id': str(cat.parent_id) if cat.parent_id else None,
                    'parent_name': cat.parent.name if cat.parent_id else None,
                    'icon_url': cat.icon_url,
                    'icon': cat.icon_url,
                    'sort_order': cat.sort_order,
                    'display_order': cat.sort_order,
                    'is_active': cat.is_active,
                    'product_count': cat.products.filter(
                        is_active=True, deleted_at__isnull=True,
                    ).count(),
                    'children': [],
                }
            for cat in categories:
                node = cat_map[cat.pk]
                if cat.parent_id and cat.parent_id in cat_map:
                    cat_map[cat.parent_id]['children'].append(node)
                else:
                    tree_data.append(node)
        else:
            tree_data = MallCategory.get_full_tree()
        serializer = MallCategoryTreeSerializer(tree_data, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })

    def retrieve(self, request, pk=None):
        """GET /api/v1/mall/categories/{slug}/ — detail with children."""
        try:
            category = MallCategory.objects.get(
                slug=pk, is_active=True, deleted_at__isnull=True,
            )
        except MallCategory.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = MallCategoryDetailSerializer(category)
        return Response({
            'success': True,
            'message': 'Request successful.',
            'data': serializer.data,
        })

    def create(self, request):
        """POST /api/v1/mall/categories/ — admin only."""
        serializer = MallCategoryCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except IntegrityError:
            return Response({
                'success': False,
                'message': 'Validation failed.',
                'errors': {'slug': ['This slug is already used.']},
                'code': 'VALIDATION_ERROR',
            }, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'success': True,
            'message': 'Category created.',
            'data': MallCategorySerializer(serializer.instance).data,
        }, status=status.HTTP_201_CREATED)

    def _get_category_for_write(self, pk):
        filters = {'deleted_at__isnull': True}
        try:
            return MallCategory.objects.get(id=pk, **filters)
        except (MallCategory.DoesNotExist, ValueError):
            return MallCategory.objects.get(slug=pk, **filters)

    def update(self, request, pk=None):
        """PATCH /api/v1/mall/categories/{slug}/ — admin only."""
        try:
            category = self._get_category_for_write(pk)
        except MallCategory.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = MallCategoryCreateUpdateSerializer(
            category, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except IntegrityError:
            return Response({
                'success': False,
                'message': 'Validation failed.',
                'errors': {'slug': ['This slug is already used.']},
                'code': 'VALIDATION_ERROR',
            }, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'success': True,
            'message': 'Category updated.',
            'data': MallCategorySerializer(serializer.instance).data,
        })

    def partial_update(self, request, pk=None):
        return self.update(request, pk=pk)

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """POST /api/v1/mall/categories/reorder/ — admin reorder siblings."""
        ordered_ids = request.data.get('category_ids') or request.data.get('ordered_ids')
        parent_id = request.data.get('parent_id', None)

        if not isinstance(ordered_ids, list) or not ordered_ids:
            return Response({
                'success': False,
                'message': 'category_ids must be a non-empty list.',
                'code': 'VALIDATION_ERROR',
            }, status=status.HTTP_400_BAD_REQUEST)

        if len(ordered_ids) != len(set(ordered_ids)):
            return Response({
                'success': False,
                'message': 'category_ids cannot contain duplicates.',
                'code': 'VALIDATION_ERROR',
            }, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        if parent_id not in (None, '', 'null', 'none'):
            try:
                parent = MallCategory.objects.get(
                    id=parent_id,
                    deleted_at__isnull=True,
                )
            except (MallCategory.DoesNotExist, ValueError):
                return Response({
                    'success': False,
                    'message': 'Parent category not found.',
                    'code': 'NOT_FOUND',
                }, status=status.HTTP_404_NOT_FOUND)

        categories = list(
            MallCategory.objects.filter(
                id__in=ordered_ids,
                deleted_at__isnull=True,
            )
        )
        if len(categories) != len(ordered_ids):
            return Response({
                'success': False,
                'message': 'One or more categories were not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        expected_parent_id = parent.pk if parent else None
        invalid_sibling = next(
            (
                cat for cat in categories
                if cat.parent_id != expected_parent_id
            ),
            None,
        )
        if invalid_sibling:
            return Response({
                'success': False,
                'message': 'Only categories under the same parent can be reordered together.',
                'code': 'VALIDATION_ERROR',
            }, status=status.HTTP_400_BAD_REQUEST)

        category_by_id = {str(cat.id): cat for cat in categories}
        with transaction.atomic():
            for index, cat_id in enumerate(ordered_ids, start=1):
                category = category_by_id[str(cat_id)]
                category.sort_order = index * 10
            MallCategory.objects.bulk_update(categories, ['sort_order'])

        return Response({
            'success': True,
            'message': 'Category order updated.',
        })

    def _soft_delete_category_tree(self, category):
        children = MallCategory.objects.filter(
            parent=category,
            deleted_at__isnull=True,
        )
        for child in children:
            self._soft_delete_category_tree(child)
        category.soft_delete(cascade=False)

    def destroy(self, request, pk=None):
        """DELETE /api/v1/mall/categories/{slug}/ — admin soft delete."""
        try:
            category = self._get_category_for_write(pk)
        except MallCategory.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        self._soft_delete_category_tree(category)
        return Response({
            'success': True,
            'message': 'Category deleted.',
        })


# =============================================================================
# PRODUCT VIEWS
# =============================================================================

class StoreProductViewSet(ViewSet):
    """
    Mall product endpoints.

    Public: listing (filtered), detail.
    Seller: create, update, soft-delete.
    """
    lookup_field = 'pk'
    lookup_value_regex = '[^/]+'

    def _get_product_by_identifier(self, identifier, public=False):
        qs = StoreProduct.objects.filter(deleted_at__isnull=True)
        if public:
            qs = qs.filter(
                is_active=True,
                store__status='active',
                store__deleted_at__isnull=True,
            )
        qs = qs.select_related('store__seller', 'category', 'brand').prefetch_related(
            'images', 'variants',
        )

        # Try slug first (most common from frontend)
        try:
            return qs.get(slug=identifier)
        except StoreProduct.DoesNotExist:
            pass

        # Fallback: try as UUID
        try:
            from uuid import UUID as UUIDType
            uuid_val = UUIDType(str(identifier))
            return qs.get(id=uuid_val)
        except (ValueError, TypeError, StoreProduct.DoesNotExist):
            pass

        raise StoreProduct.DoesNotExist

    def get_permissions(self):
        if self.action in ('create',):
            return [IsAuthenticated(), IsApprovedSeller()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def list(self, request):
        """GET /api/v1/mall/products/ — public listing with filters. Admin sees all."""
        is_admin = request.user.is_authenticated and getattr(request.user, 'role', None) in ('admin', 'moderator')
        if is_admin:
            qs = StoreProduct.objects.filter(
                deleted_at__isnull=True,
            ).select_related('store', 'category').prefetch_related('images')
        else:
            qs = StoreProduct.objects.filter(
                is_active=True,
                deleted_at__isnull=True,
                store__status='active',
                store__deleted_at__isnull=True,
            ).select_related('store', 'category').prefetch_related('images')

        # Apply filters
        f = StoreProductFilter(request.query_params, queryset=qs)
        qs = f.qs

        # Ordering
        ordering = request.query_params.get('ordering', '-created_at')
        ordering_aliases = {
            'price': 'base_price',
            '-price': '-base_price',
        }
        ordering = ordering_aliases.get(ordering, ordering)
        allowed = ['-created_at', 'created_at', 'base_price', '-base_price',
                    '-sold_count', '-rating_avg']
        if ordering in allowed:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        # Pagination (use DRF default)
        from core.pagination import CampusHatPagination
        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = StoreProductListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = StoreProductListSerializer(qs, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })

    def retrieve(self, request, pk=None):
        """GET /api/v1/mall/products/{slug}/ — public detail."""
        try:
            product = self._get_product_by_identifier(pk, public=True)
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        StoreProduct.objects.filter(pk=product.pk).update(
            view_count=F('view_count') + 1
        )

        serializer = StoreProductDetailSerializer(product)
        return Response({
            'success': True,
            'message': 'Request successful.',
            'data': serializer.data,
        })

    def create(self, request):
        """POST /api/v1/mall/products/ — approved seller only."""
        seller = request.user.seller_profile
        store = getattr(seller, 'store', None)
        if not store or store.status != 'active':
            return Response({
                'success': False,
                'message': 'You must have an active store to create products.',
                'code': 'STORE_NOT_ACTIVE',
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = StoreProductCreateUpdateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response({
            'success': True,
            'message': 'Product created successfully.',
            'data': StoreProductDetailSerializer(product).data,
        }, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        """PATCH /api/v1/mall/products/{slug}/ — store owner only."""
        try:
            product = self._get_product_by_identifier(pk)
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        # Ownership check
        if product.store.seller.user != request.user:
            return Response({
                'success': False,
                'message': 'You can only edit your own products.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = StoreProductCreateUpdateSerializer(
            product, data=request.data, partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response({
            'success': True,
            'message': 'Product updated.',
            'data': StoreProductDetailSerializer(product).data,
        })

    def destroy(self, request, pk=None):
        """DELETE /api/v1/mall/products/{slug}/ — store owner soft delete."""
        try:
            product = self._get_product_by_identifier(pk)
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if product.store.seller.user != request.user:
            return Response({
                'success': False,
                'message': 'You can only delete your own products.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        product.soft_delete()
        return Response({
            'success': True,
            'message': 'Product deleted.',
        })


# =============================================================================
# BRAND LIST
# =============================================================================

@method_decorator(cache_page(300), name='dispatch')
class BrandListView(APIView):
    """GET /api/v1/mall/products/brands/ — list all active brands. Cached 5 min."""

    permission_classes = [AllowAny]

    def get(self, request):
        brands = Brand.objects.filter(is_active=True).order_by('name')
        data = [
            {'id': str(b.id), 'name': b.name, 'slug': b.slug, 'logo_url': b.logo_url}
            for b in brands
        ]
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': data,
        })


@method_decorator(cache_page(300), name='dispatch')
class BannerListView(APIView):
    """GET /api/v1/mall/banners/ — active hero carousel banners. Cached 5 min."""

    permission_classes = [AllowAny]

    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by('ordering', '-created_at')
        data = [
            {
                'id': str(b.id),
                'title': b.title,
                'subtitle': b.subtitle,
                'image_url': b.image_url or (b.image.url if b.image else None),
                'link_url': b.link_url,
                'badge_text': b.badge_text,
                'cta_text': b.cta_text,
            }
            for b in banners
        ]
        return Response({'success': True, 'data': data})


# =============================================================================
# SELLER PRODUCT MANAGEMENT
# =============================================================================

class SellerProductListView(APIView):
    """GET /api/v1/seller/products/ — list all products for the logged-in seller."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        seller = request.user.seller_profile
        store = getattr(seller, 'store', None)
        if not store:
            return Response({
                'success': True,
                'message': 'No store found.',
                'data': [],
            })

        products = StoreProduct.objects.filter(
            store=store, deleted_at__isnull=True,
        ).select_related('category').prefetch_related('images').order_by('-created_at')

        serializer = StoreProductListSerializer(products, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class SellerBulkProductUploadView(APIView):
    """
    POST /api/v1/seller/products/bulk-upload/

    Accepts a CSV file and creates products in bulk for the seller's store.
    Expected CSV columns: name, description, base_price, discount_price,
    stock_quantity, sku, category_slug, tags (comma-separated).
    """

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    parser_classes = [MultiPartParser, JSONParser]

    def get(self, request):
        """Return a sample CSV template."""
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="product_upload_template.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'name', 'description', 'base_price', 'discount_price',
            'stock_quantity', 'sku', 'category_slug', 'tags',
        ])
        writer.writerow([
            'Example Product', 'A great product description', '999.00', '899.00',
            '50', 'SKU-001', 'electronics', 'laptop,gaming',
        ])
        return response

    def post(self, request):
        import csv
        import io
        from django.utils.text import slugify

        seller = request.user.seller_profile
        store = getattr(seller, 'store', None)
        if not store:
            return Response({
                'success': False,
                'message': 'No store found. Create a store first.',
            }, status=status.HTTP_400_BAD_REQUEST)

        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({
                'success': False,
                'message': 'No CSV file uploaded. Field name: "file".',
            }, status=status.HTTP_400_BAD_REQUEST)

        if not csv_file.name.endswith('.csv'):
            return Response({
                'success': False,
                'message': 'Only .csv files are accepted.',
            }, status=status.HTTP_400_BAD_REQUEST)

        if csv_file.size > 5 * 1024 * 1024:  # 5 MB limit
            return Response({
                'success': False,
                'message': 'File too large. Maximum 5MB.',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = csv_file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(decoded))
        except Exception:
            return Response({
                'success': False,
                'message': 'Could not parse CSV file. Ensure UTF-8 encoding.',
            }, status=status.HTTP_400_BAD_REQUEST)

        required_fields = {'name', 'description', 'base_price', 'stock_quantity'}
        if not required_fields.issubset(set(reader.fieldnames or [])):
            return Response({
                'success': False,
                'message': f'Missing required columns: {required_fields - set(reader.fieldnames or [])}',
            }, status=status.HTTP_400_BAD_REQUEST)

        created = []
        errors = []

        for row_num, row in enumerate(reader, start=2):
            name = (row.get('name') or '').strip()
            if not name:
                errors.append({'row': row_num, 'error': 'Name is required.'})
                continue

            try:
                base_price = Decimal(row['base_price'].strip())
                if base_price <= 0:
                    raise ValueError()
            except (ValueError, Exception):
                errors.append({'row': row_num, 'error': f'Invalid base_price for "{name}".'})
                continue

            try:
                stock = int(row['stock_quantity'].strip())
                if stock < 0:
                    raise ValueError()
            except (ValueError, Exception):
                errors.append({'row': row_num, 'error': f'Invalid stock_quantity for "{name}".'})
                continue

            # Build slug — ensure uniqueness
            base_slug = slugify(name)[:300]
            slug = base_slug
            counter = 1
            while StoreProduct.objects.filter(slug=slug).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1

            # Optional fields
            discount_price = None
            if row.get('discount_price', '').strip():
                try:
                    discount_price = Decimal(row['discount_price'].strip())
                except Exception:
                    pass

            category = None
            cat_slug = (row.get('category_slug') or '').strip()
            if cat_slug:
                category = MallCategory.objects.filter(
                    slug=cat_slug, is_active=True, deleted_at__isnull=True,
                ).first()

            tags = []
            tags_str = (row.get('tags') or '').strip()
            if tags_str:
                tags = [t.strip() for t in tags_str.split(',') if t.strip()]

            sku = (row.get('sku') or '').strip() or None
            if sku and StoreProduct.objects.filter(sku=sku).exists():
                sku = None  # Skip duplicate SKU silently

            product = StoreProduct(
                store=store,
                name=name,
                slug=slug,
                description=(row.get('description') or '').strip(),
                base_price=base_price,
                discount_price=discount_price,
                stock_quantity=stock,
                sku=sku,
                category=category,
                tags=tags,
                is_active=True,
            )
            created.append(product)

            # Limit to 200 products per upload
            if len(created) >= 200:
                errors.append({'row': row_num, 'error': 'Maximum 200 products per upload reached.'})
                break

        if created:
            StoreProduct.objects.bulk_create(created)

        return Response({
            'success': True,
            'message': f'Successfully created {len(created)} products.',
            'data': {
                'created_count': len(created),
                'error_count': len(errors),
                'errors': errors[:20],  # Return first 20 errors
            },
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# =============================================================================
# PRODUCT REVIEW VIEWS
# =============================================================================

class ProductReviewListView(APIView):
    """GET /api/v1/mall/products/{slug}/reviews/"""

    permission_classes = [AllowAny]

    def get(self, request, product_slug):
        try:
            product = StoreProduct.objects.get(
                slug=product_slug, deleted_at__isnull=True,
            )
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        reviews = ProductReview.objects.filter(
            product=product, is_visible=True, deleted_at__isnull=True,
        ).select_related('reviewer').order_by('-created_at')

        serializer = ProductReviewSerializer(reviews, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class ProductReviewCreateView(APIView):
    """POST /api/v1/mall/products/{slug}/reviews/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, product_slug):
        try:
            product = StoreProduct.objects.get(
                slug=product_slug, deleted_at__isnull=True,
            )
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        # Check for existing review
        if ProductReview.objects.filter(
            product=product, reviewer=request.user, deleted_at__isnull=True,
        ).exists():
            return Response({
                'success': False,
                'message': 'You have already reviewed this product.',
                'code': 'DUPLICATE',
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProductReviewCreateSerializer(
            data=request.data,
            context={'request': request, 'product': product},
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response({
            'success': True,
            'message': 'Review submitted.',
            'data': ProductReviewSerializer(review).data,
        }, status=status.HTTP_201_CREATED)


class SellerReviewResponseView(APIView):
    """PATCH /api/v1/mall/products/{slug}/reviews/{id}/seller-response/"""

    permission_classes = [IsAuthenticated]

    def patch(self, request, product_slug, review_id):
        try:
            review = ProductReview.objects.select_related(
                'product__store__seller',
            ).get(
                id=review_id,
                product__slug=product_slug,
                deleted_at__isnull=True,
            )
        except ProductReview.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Review not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        # Only store owner can respond
        if review.product.store.seller.user != request.user:
            return Response({
                'success': False,
                'message': 'Only the store owner can respond to reviews.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = SellerResponseSerializer(
            review, data=request.data,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Seller response added.',
            'data': ProductReviewSerializer(review).data,
        })


class MyReviewsListView(APIView):
    """
    GET /api/v1/mall/reviews/my/

    Lists every review the authenticated user has written.
    Used by the dashboard "My Reviews" section.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = ProductReview.objects.filter(
            reviewer=request.user, deleted_at__isnull=True,
        ).select_related('product', 'product__store').order_by('-created_at')

        # Build a richer payload than ProductReviewSerializer — we want
        # product image and store name on each row for the dashboard card.
        data = []
        for r in reviews:
            product = r.product
            image_url = getattr(product, 'main_image_url', None)
            data.append({
                'id': str(r.id),
                'product_id': str(product.id),
                'product_slug': product.slug,
                'product_name': getattr(product, 'name', '') or product.slug,
                'product_image_url': image_url,
                'store_name': getattr(product.store, 'store_name', ''),
                'rating': r.rating,
                'comment': r.comment,
                'seller_response': r.seller_response,
                'is_visible': r.is_visible,
                'created_at': r.created_at,
                'updated_at': r.updated_at,
            })
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': data,
        })


class MyReviewDetailView(APIView):
    """
    PATCH  /api/v1/mall/reviews/my/{id}/  — edit own review
    DELETE /api/v1/mall/reviews/my/{id}/  — soft-delete own review
    """

    permission_classes = [IsAuthenticated]

    def _get_review(self, request, review_id):
        # Fetched scoped to the requester so a stranger can't touch it.
        try:
            return ProductReview.objects.get(
                id=review_id, reviewer=request.user, deleted_at__isnull=True,
            )
        except ProductReview.DoesNotExist:
            return None

    def patch(self, request, review_id):
        review = self._get_review(request, review_id)
        if not review:
            return Response({
                'success': False, 'message': 'Review not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        # Only rating + comment are editable by the buyer.
        rating = request.data.get('rating')
        comment = request.data.get('comment')
        if rating is not None:
            try:
                rating_int = int(rating)
                if rating_int < 1 or rating_int > 5:
                    raise ValueError
                review.rating = rating_int
            except (TypeError, ValueError):
                return Response({
                    'success': False, 'message': 'Rating must be an integer 1–5.',
                }, status=status.HTTP_400_BAD_REQUEST)
        if comment is not None:
            review.comment = comment
        review.save(update_fields=['rating', 'comment', 'updated_at'])
        return Response({
            'success': True,
            'message': 'Review updated.',
            'data': ProductReviewSerializer(review).data,
        })

    def delete(self, request, review_id):
        review = self._get_review(request, review_id)
        if not review:
            return Response({
                'success': False, 'message': 'Review not found.',
            }, status=status.HTTP_404_NOT_FOUND)
        review.soft_delete() if hasattr(review, 'soft_delete') else None
        if not hasattr(review, 'soft_delete'):
            from django.utils import timezone
            review.deleted_at = timezone.now()
            review.save(update_fields=['deleted_at'])
        return Response({
            'success': True, 'message': 'Review deleted.',
        })


class SellerReviewsListView(APIView):
    """
    GET /api/v1/seller/reviews/

    Lists every review left on this seller's products. Used by the
    Seller Centre "Reviews" page so they can read feedback and reply.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Find the seller's store, fast-fail if they don't have one.
        store = None
        try:
            store = request.user.seller_profile.store
        except Exception:
            pass
        if not store:
            return Response({
                'success': True, 'message': 'No store found.', 'data': [],
            })

        reviews = (
            ProductReview.objects
            .filter(product__store=store, deleted_at__isnull=True)
            .select_related('product', 'reviewer')
            .order_by('-created_at')
        )

        # Optional ?rating=1..5 filter for the Daraz star tabs.
        rating_filter = request.query_params.get('rating')
        if rating_filter and rating_filter.isdigit():
            reviews = reviews.filter(rating=int(rating_filter))

        # Optional ?has_reply=true|false to triage which need a response.
        reply_filter = request.query_params.get('has_reply')
        if reply_filter == 'true':
            reviews = reviews.exclude(seller_response__isnull=True).exclude(seller_response='')
        elif reply_filter == 'false':
            reviews = reviews.filter(
                models.Q(seller_response__isnull=True) | models.Q(seller_response=''),
            )

        data = []
        for r in reviews:
            product = r.product
            image_url = (
                product.images.filter(is_primary=True).values_list('image_url', flat=True).first()
                or product.images.order_by('sort_order').values_list('image_url', flat=True).first()
            )
            reviewer = r.reviewer
            data.append({
                'id': str(r.id),
                'product_id': str(product.id),
                'product_slug': product.slug,
                'product_name': product.name,
                'product_image_url': image_url,
                'reviewer_name': getattr(reviewer, 'full_name', '') or reviewer.email,
                'reviewer_avatar': getattr(reviewer, 'profile_picture', None),
                'rating': r.rating,
                'comment': r.comment,
                'seller_response': r.seller_response,
                'seller_responded_at': r.seller_responded_at,
                'is_visible': r.is_visible,
                'created_at': r.created_at,
            })

        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': data,
        })


class SellerReplyToReviewView(APIView):
    """
    POST /api/v1/seller/reviews/{review_id}/reply/

    Sets / updates the seller_response on a review the seller owns.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        try:
            store = request.user.seller_profile.store
        except Exception:
            return Response(
                {'success': False, 'message': 'No store found.', 'code': 'NO_STORE'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            review = ProductReview.objects.select_related('product__store').get(
                id=review_id, deleted_at__isnull=True,
            )
        except ProductReview.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Review not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Ownership check — sellers can only reply to reviews on their own products.
        if review.product.store_id != store.id:
            return Response(
                {'success': False, 'message': 'You can only reply to reviews on your own products.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        reply = (request.data.get('reply') or '').strip()
        if not reply:
            return Response(
                {'success': False, 'message': 'Reply text is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone
        review.seller_response = reply
        review.seller_responded_at = timezone.now()
        review.save(update_fields=['seller_response', 'seller_responded_at', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Reply posted.',
            'data': {
                'id': str(review.id),
                'seller_response': review.seller_response,
                'seller_responded_at': review.seller_responded_at,
            },
        })


# =============================================================================
# PRODUCT VARIANT VIEWS
# =============================================================================

class ProductVariantListCreateView(APIView):
    """
    GET  /api/v1/mall/products/{slug}/variants/
    POST /api/v1/mall/products/{slug}/variants/
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, product_slug):
        try:
            product = StoreProduct.objects.get(
                slug=product_slug, deleted_at__isnull=True,
            )
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        variants = ProductVariant.objects.filter(
            product=product, is_active=True, deleted_at__isnull=True,
        )
        serializer = ProductVariantSerializer(variants, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })

    def post(self, request, product_slug):
        try:
            product = StoreProduct.objects.get(
                slug=product_slug, deleted_at__isnull=True,
            )
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if product.store.seller.user != request.user:
            return Response({
                'success': False,
                'message': 'You can only manage variants of your own products.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductVariantCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.save(product=product)

        # Ensure has_variants is True
        if not product.has_variants:
            product.has_variants = True
            product.save(update_fields=['has_variants'])

        return Response({
            'success': True,
            'message': 'Variant created.',
            'data': ProductVariantSerializer(variant).data,
        }, status=status.HTTP_201_CREATED)


class ProductVariantDetailView(APIView):
    """
    PATCH  /api/v1/mall/products/{slug}/variants/{id}/
    DELETE /api/v1/mall/products/{slug}/variants/{id}/
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, product_slug, variant_id):
        try:
            variant = ProductVariant.objects.select_related(
                'product__store__seller',
            ).get(
                id=variant_id,
                product__slug=product_slug,
                deleted_at__isnull=True,
            )
        except ProductVariant.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Variant not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if variant.product.store.seller.user != request.user:
            return Response({
                'success': False,
                'message': 'Forbidden.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductVariantCreateUpdateSerializer(
            variant, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Variant updated.',
            'data': ProductVariantSerializer(variant).data,
        })

    def delete(self, request, product_slug, variant_id):
        try:
            variant = ProductVariant.objects.select_related(
                'product__store__seller',
            ).get(
                id=variant_id,
                product__slug=product_slug,
                deleted_at__isnull=True,
            )
        except ProductVariant.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Variant not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if variant.product.store.seller.user != request.user:
            return Response({
                'success': False,
                'message': 'Forbidden.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        variant.soft_delete()
        return Response({
            'success': True,
            'message': 'Variant deleted.',
        })


# =============================================================================
# CART VIEWS
# =============================================================================

class CartView(APIView):
    """GET /api/v1/cart/ — get or create cart for authenticated user."""

    permission_classes = [IsNormalUserOrAbove]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response({
            'success': True,
            'message': 'Request successful.',
            'data': serializer.data,
        })


class CartAddItemView(APIView):
    """POST /api/v1/cart/add/ — add item (or increment quantity)."""

    permission_classes = [IsNormalUserOrAbove]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)

        with transaction.atomic():
            serializer = AddToCartSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            product = data['product']
            variant = data.get('variant')
            quantity = data['quantity']

            # Determine price snapshot
            if variant:
                price = variant.effective_price
            else:
                price = product.current_price

            # Check if item already in cart
            existing = CartItem.objects.filter(
                cart=cart, product=product, variant=variant,
            ).first()

            if existing:
                existing.quantity += quantity
                # Validate stock
                stock = variant.stock_quantity if variant else product.stock_quantity
                if existing.quantity > stock:
                    return Response({
                        'success': False,
                        'message': f'Only {stock} in stock.',
                        'code': 'INSUFFICIENT_STOCK',
                    }, status=status.HTTP_400_BAD_REQUEST)
                existing.save(update_fields=['quantity'])
            else:
                CartItem.objects.create(
                    cart=cart,
                    product=product,
                    variant=variant,
                    quantity=quantity,
                    unit_price_snapshot=price,
                )

        serializer = CartSerializer(cart)
        return Response({
            'success': True,
            'message': 'Item added to cart.',
            'data': serializer.data,
        })


class CartUpdateItemView(APIView):
    """PATCH /api/v1/cart/update/{item_id}/ — change quantity."""

    permission_classes = [IsNormalUserOrAbove]

    def patch(self, request, item_id):
        cart, _ = Cart.objects.get_or_create(user=request.user)

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Cart item not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCartItemSerializer(
            data=request.data,
            context={'cart_item': item},
        )
        serializer.is_valid(raise_exception=True)
        item.quantity = serializer.validated_data['quantity']
        item.save(update_fields=['quantity'])

        return Response({
            'success': True,
            'message': 'Cart updated.',
            'data': CartSerializer(cart).data,
        })


class CartRemoveItemView(APIView):
    """DELETE /api/v1/cart/remove/{item_id}/"""

    permission_classes = [IsNormalUserOrAbove]

    def delete(self, request, item_id):
        cart, _ = Cart.objects.get_or_create(user=request.user)

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Cart item not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        item.delete()
        return Response({
            'success': True,
            'message': 'Item removed from cart.',
            'data': CartSerializer(cart).data,
        })


class CartClearView(APIView):
    """DELETE /api/v1/cart/clear/"""

    permission_classes = [IsNormalUserOrAbove]

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        cart.coupon_code = None
        cart.save(update_fields=['coupon_code'])
        return Response({
            'success': True,
            'message': 'Cart cleared.',
            'data': CartSerializer(cart).data,
        })


class CartApplyCouponView(APIView):
    """POST /api/v1/cart/apply-coupon/"""

    permission_classes = [IsNormalUserOrAbove]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        coupon_code = request.data.get('coupon_code', '').strip()

        if not coupon_code:
            return Response({
                'success': False,
                'message': 'Coupon code is required.',
                'code': 'VALIDATION_ERROR',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Placeholder — full coupon validation in Phase 08
        cart.coupon_code = coupon_code
        cart.save(update_fields=['coupon_code'])

        return Response({
            'success': True,
            'message': 'Coupon applied.',
            'data': CartSerializer(cart).data,
        })


class CartRemoveCouponView(APIView):
    """DELETE /api/v1/cart/remove-coupon/"""

    permission_classes = [IsNormalUserOrAbove]

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.coupon_code = None
        cart.save(update_fields=['coupon_code'])
        return Response({
            'success': True,
            'message': 'Coupon removed.',
            'data': CartSerializer(cart).data,
        })


class CartSummaryView(APIView):
    """GET /api/v1/cart/summary/ — totals breakdown."""

    permission_classes = [IsNormalUserOrAbove]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        items = cart.items.all()

        subtotal = sum(
            item.unit_price_snapshot * item.quantity
            for item in items
        )

        # Placeholder discount logic (full in Phase 08)
        discount = Decimal('0.00')

        # Placeholder delivery fee logic
        delivery_fee = Decimal('0.00')
        if subtotal > 0:
            delivery_fee = Decimal('60.00')  # Base delivery fee in BDT

        total = subtotal - discount + delivery_fee

        data = {
            'subtotal': subtotal,
            'discount': discount,
            'delivery_fee': delivery_fee,
            'total': total,
            'item_count': items.count(),
        }
        serializer = CartSummarySerializer(data)
        return Response({
            'success': True,
            'message': 'Request successful.',
            'data': serializer.data,
        })


# =============================================================================
# WISHLIST
# =============================================================================

class WishlistView(APIView):
    """GET /api/v1/wishlist/ — list user's wishlist."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(
            user=request.user,
        ).select_related('product__store').order_by('-created_at')

        from .serializers import StoreProductListSerializer
        products = [item.product for item in items if item.product.is_active]
        serializer = StoreProductListSerializer(products, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
        })


class WishlistToggleView(APIView):
    """POST /api/v1/wishlist/toggle/ — add or remove from wishlist."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({
                'success': False,
                'message': 'product_id is required.',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = StoreProduct.objects.get(
                id=product_id, is_active=True, deleted_at__isnull=True,
            )
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        existing = Wishlist.objects.filter(
            user=request.user, product=product,
        ).first()

        if existing:
            existing.delete()
            return Response({
                'success': True,
                'message': 'Removed from wishlist.',
                'data': {'is_wishlisted': False},
            })

        Wishlist.objects.create(user=request.user, product=product)
        return Response({
            'success': True,
            'message': 'Added to wishlist.',
            'data': {'is_wishlisted': True},
        }, status=status.HTTP_201_CREATED)


# =============================================================================
# PRODUCT Q&A VIEWS
# =============================================================================

class ProductQuestionListView(APIView):
    """GET: List questions for a product. POST: Ask a question."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = StoreProduct.objects.filter(
            slug=slug, is_active=True, deleted_at__isnull=True,
        ).first()
        if not product:
            return Response({'success': False, 'message': 'Product not found.'}, status=404)

        questions = ProductQuestion.objects.filter(
            product=product, is_visible=True, deleted_at__isnull=True,
        ).select_related('asker', 'answered_by')

        serializer = ProductQuestionSerializer(questions, many=True)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request, slug):
        if not request.user.is_authenticated:
            return Response({'success': False, 'message': 'Login required.'}, status=401)

        product = StoreProduct.objects.filter(
            slug=slug, is_active=True, deleted_at__isnull=True,
        ).first()
        if not product:
            return Response({'success': False, 'message': 'Product not found.'}, status=404)

        serializer = ProductQuestionCreateSerializer(
            data=request.data,
            context={'request': request, 'product': product},
        )
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return Response({
            'success': True,
            'message': 'Question submitted successfully.',
            'data': ProductQuestionSerializer(question).data,
        }, status=201)


class AdminMallProductToggleView(APIView):
    """PATCH /api/v1/mall/products/<uuid:pk>/admin-toggle/ — admin toggle product active status."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from core.permissions import IsAdminOrModerator
        perm = IsAdminOrModerator()
        if not perm.has_permission(request, self):
            return Response({'success': False, 'message': 'Admin access required.'}, status=403)

        try:
            product = StoreProduct.objects.get(pk=pk, deleted_at__isnull=True)
        except StoreProduct.DoesNotExist:
            return Response({'success': False, 'message': 'Product not found.'}, status=404)

        product.is_active = not product.is_active
        product.save(update_fields=['is_active'])
        return Response({
            'success': True,
            'message': f'Product {"activated" if product.is_active else "deactivated"}.',
            'data': {'is_active': product.is_active},
        })


class SellerAnswerQuestionView(APIView):
    """PATCH: Seller answers a question on their product."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, slug, question_id):
        question = ProductQuestion.objects.filter(
            id=question_id,
            product__slug=slug,
            deleted_at__isnull=True,
        ).select_related('product__store__owner').first()

        if not question:
            return Response({'success': False, 'message': 'Question not found.'}, status=404)

        # Only store owner can answer
        if question.product.store.owner != request.user:
            return Response({'success': False, 'message': 'Only the store owner can answer.'}, status=403)

        serializer = SellerAnswerQuestionSerializer(
            question, data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        updated_question = serializer.save()
        return Response({
            'success': True,
            'message': 'Answer saved.',
            'data': ProductQuestionSerializer(updated_question).data,
        })

