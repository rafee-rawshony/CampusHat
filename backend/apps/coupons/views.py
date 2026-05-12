"""
Coupon and Flash Sale Views.

Public: validate coupon, active flash sales.
Seller: CRUD coupons, manage flash sales.
Admin: platform-wide coupons and flash sales.
"""

from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView

from core.pagination import CampusHatPagination
from core.permissions import IsApprovedSeller

from .models import Coupon, FlashSale, FlashSaleProduct
from .serializers import (
    CouponCreateSerializer,
    CouponSerializer,
    CouponValidateSerializer,
    FlashSaleAddProductsSerializer,
    FlashSaleCreateSerializer,
    FlashSaleDetailSerializer,
    FlashSaleListSerializer,
)

FLASH_SALE_PREFETCH = [
    'products',
    'products__product',
    'products__product__images',
    'products__product__category',
    'products__product__store',
]


def _refetch_sale(sale_id):
    return FlashSale.objects.select_related('store').prefetch_related(
        *FLASH_SALE_PREFETCH,
    ).get(id=sale_id)


# ═══════════════════════════════════════════════════════════════════
# COUPON VALIDATION
# ═══════════════════════════════════════════════════════════════════

class ActiveCouponsListView(APIView):
    """GET /api/v1/coupons/active/"""

    permission_classes = []

    def get(self, request):
        from django.utils import timezone
        now = timezone.now()
        coupons = Coupon.objects.filter(
            is_active=True, valid_from__lte=now, expires_at__gte=now,
        ).select_related('store').order_by('-created_at')

        return Response({
            'success': True,
            'data': CouponSerializer(coupons, many=True).data,
        })


class CouponValidateView(APIView):
    """GET /api/v1/coupons/validate/?code=XXX&cart_total=YYY"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CouponValidateSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code'].upper()
        cart_total = serializer.validated_data['cart_total']

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({
                'success': False, 'message': 'Coupon not found.',
                'data': {'is_valid': False, 'discount_amount': 0, 'error': 'Invalid code.'},
            }, status=status.HTTP_404_NOT_FOUND)

        is_valid, discount, error = coupon.validate_for_user(
            request.user, cart_total,
        )

        return Response({
            'success': True,
            'data': {
                'is_valid': is_valid,
                'discount_amount': discount,
                'error': error,
                'coupon': CouponSerializer(coupon).data if is_valid else None,
            },
        })


# ═══════════════════════════════════════════════════════════════════
# SELLER COUPON CRUD
# ═══════════════════════════════════════════════════════════════════

class SellerCouponListView(GenericAPIView):
    """GET/POST /api/v1/seller/coupons/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = CouponSerializer

    def get(self, request):
        try:
            store = request.user.seller_profile.store
        except Exception:
            return Response({'success': False, 'message': 'Store not found.'}, status=404)

        coupons = Coupon.objects.filter(store=store).order_by('-created_at')
        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(coupons, request)
        if page is not None:
            return paginator.get_paginated_response(CouponSerializer(page, many=True).data)
        return Response({'success': True, 'data': CouponSerializer(coupons, many=True).data})

    def post(self, request):
        try:
            store = request.user.seller_profile.store
        except Exception:
            return Response({'success': False, 'message': 'Store not found.'}, status=404)

        serializer = CouponCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.save(store=store, created_by=request.user)
        return Response({
            'success': True, 'message': 'Coupon created.',
            'data': CouponSerializer(coupon).data,
        }, status=status.HTTP_201_CREATED)


class SellerCouponDetailView(GenericAPIView):
    """PATCH/DELETE /api/v1/seller/coupons/{id}/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = CouponCreateSerializer

    def patch(self, request, coupon_id):
        try:
            store = request.user.seller_profile.store
            coupon = Coupon.objects.get(id=coupon_id, store=store)
        except (Coupon.DoesNotExist, Exception):
            return Response({'success': False, 'message': 'Coupon not found.'}, status=404)

        serializer = self.get_serializer(coupon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 'message': 'Coupon updated.',
            'data': CouponSerializer(coupon).data,
        })

    def delete(self, request, coupon_id):
        try:
            store = request.user.seller_profile.store
            coupon = Coupon.objects.get(id=coupon_id, store=store)
        except (Coupon.DoesNotExist, Exception):
            return Response({'success': False, 'message': 'Coupon not found.'}, status=404)

        coupon.soft_delete()
        return Response({'success': True, 'message': 'Coupon deleted.'})


# ═══════════════════════════════════════════════════════════════════
# FLASH SALES — PUBLIC
# ═══════════════════════════════════════════════════════════════════

class ActiveFlashSalesView(APIView):
    """GET /api/v1/flash-sales/active/ — public."""

    permission_classes = []

    def get(self, request):
        from django.utils import timezone
        now = timezone.now()
        sales = FlashSale.objects.filter(
            is_active=True, starts_at__lte=now, ends_at__gte=now,
        ).select_related('store').prefetch_related(
            *FLASH_SALE_PREFETCH,
        ).order_by('-starts_at')

        return Response({
            'success': True, 'data': FlashSaleDetailSerializer(sales, many=True).data,
        })


class FlashSaleDetailView(APIView):
    """GET /api/v1/flash-sales/{id}/ — public, with products."""

    permission_classes = []

    def get(self, request, flash_sale_id):
        try:
            sale = FlashSale.objects.prefetch_related(
                *FLASH_SALE_PREFETCH,
            ).select_related('store').get(id=flash_sale_id)
        except FlashSale.DoesNotExist:
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        return Response({
            'success': True, 'data': FlashSaleDetailSerializer(sale).data,
        })


# ═══════════════════════════════════════════════════════════════════
# FLASH SALES — SELLER
# ═══════════════════════════════════════════════════════════════════

class SellerFlashSaleListView(GenericAPIView):
    """GET /api/v1/seller/flash-sales/ — list flash sales for seller's store."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        try:
            store = request.user.seller_profile.store
        except Exception:
            return Response({'success': False, 'message': 'Store not found.'}, status=404)

        sales = FlashSale.objects.filter(
            store=store,
        ).select_related('store').prefetch_related(
            *FLASH_SALE_PREFETCH,
        ).order_by('-created_at')

        return Response({
            'success': True,
            'data': FlashSaleDetailSerializer(sales, many=True).data,
        })


class SellerFlashSaleUpdateView(GenericAPIView):
    """PATCH /api/v1/seller/flash-sales/{id}/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = FlashSaleCreateSerializer

    def patch(self, request, flash_sale_id):
        try:
            store = request.user.seller_profile.store
            sale = FlashSale.objects.get(id=flash_sale_id, store=store)
        except (FlashSale.DoesNotExist, Exception):
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        serializer = self.get_serializer(sale, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        sale = _refetch_sale(sale.id)
        return Response({
            'success': True, 'message': 'Flash sale updated.',
            'data': FlashSaleDetailSerializer(sale).data,
        })


class SellerFlashSaleAddProductsView(GenericAPIView):
    """POST /api/v1/seller/flash-sales/{id}/add-products/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = FlashSaleAddProductsSerializer

    def post(self, request, flash_sale_id):
        try:
            store = request.user.seller_profile.store
            sale = FlashSale.objects.get(id=flash_sale_id, store=store)
        except (FlashSale.DoesNotExist, Exception):
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        products_data = serializer.validated_data.get('products', [])
        product_ids = serializer.validated_data.get('product_ids', [])
        override_price = serializer.validated_data.get('override_price')

        created = 0
        if products_data:
            for item in products_data:
                _, was_created = FlashSaleProduct.objects.update_or_create(
                    flash_sale=sale, product_id=item['product_id'],
                    defaults={
                        'override_price': item.get('flash_price') or override_price,
                        'quantity_limit': item.get('quantity_limit'),
                    },
                )
                if was_created:
                    created += 1
        elif product_ids:
            for pid in product_ids:
                _, was_created = FlashSaleProduct.objects.get_or_create(
                    flash_sale=sale, product_id=pid,
                    defaults={'override_price': override_price},
                )
                if was_created:
                    created += 1

        sale = _refetch_sale(sale.id)
        return Response({
            'success': True,
            'message': f'{created} products added to flash sale.',
            'data': FlashSaleDetailSerializer(sale).data,
        })


# ═══════════════════════════════════════════════════════════════════
# ADMIN COUPON MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

class AdminCouponListView(APIView):
    """GET/POST /api/v1/admin/coupons/ — platform-wide."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        coupons = Coupon.objects.all().order_by('-created_at')
        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(coupons, request)
        if page is not None:
            return paginator.get_paginated_response(CouponSerializer(page, many=True).data)
        return Response({'success': True, 'data': CouponSerializer(coupons, many=True).data})

    def post(self, request):
        serializer = CouponCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.save(store=None, created_by=request.user)
        return Response({
            'success': True, 'message': 'Platform coupon created.',
            'data': CouponSerializer(coupon).data,
        }, status=status.HTTP_201_CREATED)


class AdminCouponDetailView(APIView):
    """PATCH/DELETE /api/v1/admin/coupons/{id}/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, coupon_id):
        try:
            coupon = Coupon.objects.get(id=coupon_id)
        except Coupon.DoesNotExist:
            return Response({'success': False, 'message': 'Coupon not found.'}, status=404)

        serializer = CouponCreateSerializer(coupon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 'message': 'Coupon updated.',
            'data': CouponSerializer(coupon).data,
        })

    def delete(self, request, coupon_id):
        try:
            coupon = Coupon.objects.get(id=coupon_id)
        except Coupon.DoesNotExist:
            return Response({'success': False, 'message': 'Coupon not found.'}, status=404)

        coupon.soft_delete()
        return Response({'success': True, 'message': 'Coupon deleted.'})


class AdminFlashSaleListView(APIView):
    """GET/POST /api/v1/admin/flash-sales/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        sales = FlashSale.objects.select_related('store').prefetch_related(
            *FLASH_SALE_PREFETCH,
        ).order_by('-created_at')
        return Response({
            'success': True, 'data': FlashSaleDetailSerializer(sales, many=True).data,
        })

    def post(self, request):
        serializer = FlashSaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        store_id = request.data.get('store')
        if store_id:
            sale = serializer.save(store_id=store_id)
        else:
            return Response({
                'success': False, 'message': 'store field is required.',
            }, status=status.HTTP_400_BAD_REQUEST)
        sale = _refetch_sale(sale.id)

        try:
            from apps.admin_panel.notification_utils import send_notification
            seller_user = sale.store.seller.user
            send_notification(
                user=seller_user,
                notification_type='promotion',
                title='New Flash Sale Created',
                message=f'A flash sale "{sale.title}" has been created for your store. You can now add products to it.',
                action_url='/seller/promotions/flash-sales',
            )
        except Exception:
            pass

        return Response({
            'success': True, 'message': 'Flash sale created.',
            'data': FlashSaleDetailSerializer(sale).data,
        }, status=status.HTTP_201_CREATED)


class AdminFlashSaleDetailView(APIView):
    """PATCH/DELETE /api/v1/admin/flash-sales/{flash_sale_id}/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, flash_sale_id):
        try:
            sale = FlashSale.objects.get(id=flash_sale_id)
        except FlashSale.DoesNotExist:
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        serializer = FlashSaleCreateSerializer(sale, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        sale = _refetch_sale(sale.id)
        return Response({
            'success': True, 'message': 'Flash sale updated.',
            'data': FlashSaleDetailSerializer(sale).data,
        })

    def delete(self, request, flash_sale_id):
        try:
            sale = FlashSale.objects.get(id=flash_sale_id)
        except FlashSale.DoesNotExist:
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        sale.soft_delete()
        return Response({'success': True, 'message': 'Flash sale deleted.'})


class AdminFlashSaleAddProductsView(APIView):
    """POST /api/v1/admin/flash-sales/{flash_sale_id}/add-products/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, flash_sale_id):
        try:
            sale = FlashSale.objects.get(id=flash_sale_id)
        except FlashSale.DoesNotExist:
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        serializer = FlashSaleAddProductsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        products_data = serializer.validated_data.get('products', [])
        product_ids = serializer.validated_data.get('product_ids', [])
        override_price = serializer.validated_data.get('override_price')

        created = 0
        if products_data:
            for item in products_data:
                _, was_created = FlashSaleProduct.objects.update_or_create(
                    flash_sale=sale, product_id=item['product_id'],
                    defaults={
                        'override_price': item.get('flash_price') or override_price,
                        'quantity_limit': item.get('quantity_limit'),
                    },
                )
                if was_created:
                    created += 1
        elif product_ids:
            for pid in product_ids:
                _, was_created = FlashSaleProduct.objects.get_or_create(
                    flash_sale=sale, product_id=pid,
                    defaults={'override_price': override_price},
                )
                if was_created:
                    created += 1

        sale = _refetch_sale(sale.id)
        return Response({
            'success': True,
            'message': f'{created} products added to flash sale.',
            'data': FlashSaleDetailSerializer(sale).data,
        })
