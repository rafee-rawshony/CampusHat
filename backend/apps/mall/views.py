"""
Mall Views.

Category management, product CRUD, reviews, variants, and cart operations.
"""

from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ViewSet

from core.permissions import IsAdminOrModerator, IsApprovedSeller

from .filters import StoreProductFilter
from .models import (
    Cart,
    CartItem,
    MallCategory,
    ProductReview,
    ProductVariant,
    StoreProduct,
    StoreProductImage,
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
        if self.action in ('create', 'update', 'destroy'):
            return [IsAuthenticated(), IsAdminOrModerator()]
        return [AllowAny()]

    def list(self, request):
        """GET /api/v1/mall/categories/ — flat list of all active categories."""
        categories = MallCategory.objects.filter(
            is_active=True, deleted_at__isnull=True,
        ).order_by('level', 'sort_order', 'name')

        serializer = MallCategorySerializer(categories, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })

    @action(detail=False, methods=['get'], url_path='tree')
    def tree(self, request):
        """GET /api/v1/mall/categories/tree/ — nested tree structure."""
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
        serializer.save()
        return Response({
            'success': True,
            'message': 'Category created.',
            'data': MallCategorySerializer(serializer.instance).data,
        }, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        """PATCH /api/v1/mall/categories/{slug}/ — admin only."""
        try:
            category = MallCategory.objects.get(
                slug=pk, deleted_at__isnull=True,
            )
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
        serializer.save()
        return Response({
            'success': True,
            'message': 'Category updated.',
            'data': MallCategorySerializer(serializer.instance).data,
        })

    def destroy(self, request, pk=None):
        """DELETE /api/v1/mall/categories/{slug}/ — admin soft delete."""
        try:
            category = MallCategory.objects.get(
                slug=pk, deleted_at__isnull=True,
            )
        except MallCategory.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Category not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        category.soft_delete()
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

    def get_permissions(self):
        if self.action in ('create',):
            return [IsAuthenticated(), IsApprovedSeller()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def list(self, request):
        """GET /api/v1/mall/products/ — public listing with filters."""
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
            product = StoreProduct.objects.select_related(
                'store', 'category',
            ).prefetch_related(
                'images', 'variants',
            ).get(
                slug=pk,
                is_active=True,
                deleted_at__isnull=True,
                store__status='active',
                store__deleted_at__isnull=True,
            )
        except StoreProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

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
            product = StoreProduct.objects.get(
                slug=pk, deleted_at__isnull=True,
            )
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
            product = StoreProduct.objects.get(
                slug=pk, deleted_at__isnull=True,
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
                'message': 'You can only delete your own products.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        product.soft_delete()
        return Response({
            'success': True,
            'message': 'Product deleted.',
        })


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

    permission_classes = [IsAuthenticated]

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

    permission_classes = [IsAuthenticated]

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

    permission_classes = [IsAuthenticated]

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

    permission_classes = [IsAuthenticated]

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

    permission_classes = [IsAuthenticated]

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

    permission_classes = [IsAuthenticated]

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

    permission_classes = [IsAuthenticated]

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

    permission_classes = [IsAuthenticated]

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
