"""
Order Views.

Buyer: checkout, list, detail, cancel, tracking.
Seller: store orders list, confirm, pack, ship.
Admin: all orders, force status update.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers

from apps.mall.models import Cart
from apps.orders.models import InvalidStatusTransitionError, Order
from apps.orders.services.checkout import (
    CheckoutError,
    InsufficientStockError,
    process_checkout,
)
from core.pagination import CampusHatPagination
from core.permissions import IsAdminOrModerator, IsApprovedSeller, IsNormalUserOrAbove
from core.wallet_engine import InsufficientBalanceError

from .serializers import (
    AdminOrderSerializer,
    AdminStatusUpdateSerializer,
    CheckoutSerializer,
    InvoiceSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    SellerOrderDetailSerializer,
    SellerOrderListSerializer,
)


# =============================================================================
# BUYER VIEWS
# =============================================================================

class CheckoutView(GenericAPIView):
    """POST /api/v1/orders/checkout/ — atomic checkout."""

    permission_classes = [IsNormalUserOrAbove]
    serializer_class = CheckoutSerializer

    def post(self, request):
        # Checkout gate — Mall purchases require name, phone, birthday,
        # gender, AND a saved delivery address. Defined in User.is_checkout_ready.
        if not request.user.is_checkout_ready:
            return Response(
                {
                    'success': False,
                    'message': 'Please complete your profile (name, phone, birthday, gender) and add a delivery address before checking out.',
                    'code': 'PROFILE_INCOMPLETE',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Address is required for Mall delivery — we don't accept "no address" checkouts.
        if not serializer.validated_data.get('delivery_address_id'):
            return Response(
                {
                    'success': False,
                    'message': 'A delivery address is required to checkout.',
                    'code': 'ADDRESS_REQUIRED',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Cart not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = process_checkout(
                user=request.user,
                cart=cart,
                delivery_address_id=serializer.validated_data.get(
                    'delivery_address_id',
                ),
                payment_method=serializer.validated_data['payment_method'],
                buyer_note=serializer.validated_data.get('buyer_note', ''),
            )
        except CheckoutError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except InsufficientStockError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_409_CONFLICT,
            )
        except InsufficientBalanceError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        return Response({
            'success': True,
            'message': 'Order placed successfully.',
            'data': OrderDetailSerializer(order).data,
        }, status=status.HTTP_201_CREATED)


class BuyerOrderListView(GenericAPIView):
    """GET /api/v1/orders/ — buyer's own orders."""

    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get(self, request):
        orders = Order.objects.filter(
            buyer=request.user,
        ).select_related('store').prefetch_related('items').order_by('-created_at')

        # Optional status filter — Daraz-style tabs send ?status=to_pay,to_ship,etc.
        # We map UI tab names to actual order_status / payment_status combinations.
        status_filter = request.query_params.get('status', '').lower().strip()
        if status_filter == 'to_pay':
            orders = orders.filter(payment_status='pending').exclude(order_status='cancelled')
        elif status_filter == 'to_ship':
            orders = orders.filter(
                payment_status='paid', order_status__in=['placed', 'confirmed', 'packed'],
            )
        elif status_filter == 'to_receive':
            orders = orders.filter(order_status='shipped')
        elif status_filter == 'completed':
            orders = orders.filter(order_status='delivered')
        elif status_filter == 'cancelled':
            orders = orders.filter(order_status='cancelled')
        elif status_filter == 'refunded':
            orders = orders.filter(payment_status__in=['refunded', 'partially_refunded'])

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(orders, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = self.get_serializer(orders, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class BuyerOrderDetailView(GenericAPIView):
    """GET /api/v1/orders/{id}/ — order detail with items."""

    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related(
                'items', 'items__product', 'items__variant',
                'status_history', 'payments',
            ).select_related('store').get(
                id=order_id, buyer=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': OrderDetailSerializer(order).data,
        })


class BuyerCancelOrderView(GenericAPIView):
    """PATCH /api/v1/orders/{id}/cancel/ — cancel order (only if placed)."""

    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer

    @extend_schema(
        request=inline_serializer(
            name='BuyerCancelOrderRequest',
            fields={'reason': serializers.CharField(required=False)}
        )
    )
    def patch(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, buyer=request.user)
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        reason = request.data.get('reason', '')

        try:
            order.transition_status(
                'cancelled',
                changed_by=request.user,
                role='buyer',
                note=reason,
            )
            order.cancellation_reason = reason
            order.save(update_fields=['cancellation_reason'])
        except InvalidStatusTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Order cancelled successfully.',
            'data': OrderDetailSerializer(order).data,
        })


class OrderTrackingView(GenericAPIView):
    """GET /api/v1/orders/{id}/tracking/ — delivery info."""

    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related(
                'status_history',
            ).get(id=order_id, buyer=request.user)
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        from .serializers import OrderStatusHistorySerializer
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': {
                'order_number': order.order_number,
                'order_status': order.order_status,
                'tracking_code': order.tracking_code,
                'history': OrderStatusHistorySerializer(
                    order.status_history.all(), many=True,
                ).data,
            },
        })


# =============================================================================
# SELLER VIEWS
# =============================================================================

class SellerOrderCountsView(APIView):
    """GET /api/v1/seller/orders/counts/ — order status counts for tab badges."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        try:
            store = request.user.seller_profile.store
        except Exception:
            return Response(
                {'success': False, 'message': 'Store not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        from django.db.models import Count, Q
        qs = Order.objects.filter(store=store)
        counts = qs.aggregate(
            all=Count('id'),
            placed=Count('id', filter=Q(status='placed')),
            confirmed=Count('id', filter=Q(status='confirmed')),
            packed=Count('id', filter=Q(status='packed')),
            shipped=Count('id', filter=Q(status='shipped')),
            delivered=Count('id', filter=Q(status='delivered')),
            cancelled=Count('id', filter=Q(status='cancelled')),
        )
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': counts,
        })


class SellerOrderListView(GenericAPIView):
    """GET /api/v1/seller/orders/ — seller's store orders."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerOrderListSerializer

    def get(self, request):
        try:
            store = request.user.seller_profile.store
        except Exception:
            return Response(
                {'success': False, 'message': 'Store not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        orders = Order.objects.filter(
            store=store,
        ).select_related('buyer').order_by('-created_at')

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(orders, request)
        if page is not None:
            serializer = SellerOrderListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = self.get_serializer(orders, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class SellerOrderDetailView(GenericAPIView):
    """GET /api/v1/seller/orders/{id}/ — seller order detail."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerOrderDetailSerializer

    def get(self, request, order_id):
        try:
            store = request.user.seller_profile.store
            order = Order.objects.prefetch_related(
                'items', 'items__product', 'items__variant',
                'status_history',
            ).get(id=order_id, store=store)
        except (Order.DoesNotExist, Exception):
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': SellerOrderDetailSerializer(order).data,
        })


class SellerConfirmOrderView(GenericAPIView):
    """PATCH /api/v1/seller/orders/{id}/confirm/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerOrderDetailSerializer

    @extend_schema(
        request=inline_serializer(
            name='SellerConfirmOrderRequest',
            fields={'note': serializers.CharField(required=False)}
        )
    )
    def patch(self, request, order_id):
        return self._transition(request, order_id, 'confirmed')

    def _transition(self, request, order_id, target_status):
        try:
            store = request.user.seller_profile.store
            order = Order.objects.get(id=order_id, store=store)
        except (Order.DoesNotExist, Exception):
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            note = request.data.get('note', '')
            order.transition_status(
                target_status,
                changed_by=request.user,
                role='seller',
                note=note,
            )
        except InvalidStatusTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': f'Order status updated to {target_status}.',
            'data': SellerOrderDetailSerializer(order).data,
        })


class SellerPackOrderView(GenericAPIView):
    """PATCH /api/v1/seller/orders/{id}/pack/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerOrderDetailSerializer

    @extend_schema(
        request=inline_serializer(
            name='SellerPackOrderRequest',
            fields={'note': serializers.CharField(required=False)}
        )
    )
    def patch(self, request, order_id):
        try:
            store = request.user.seller_profile.store
            order = Order.objects.get(id=order_id, store=store)
        except (Order.DoesNotExist, Exception):
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            order.transition_status(
                'packed',
                changed_by=request.user,
                role='seller',
                note=request.data.get('note', ''),
            )
        except InvalidStatusTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Order packed.',
            'data': SellerOrderDetailSerializer(order).data,
        })


class SellerShipOrderView(GenericAPIView):
    """PATCH /api/v1/seller/orders/{id}/ship/ — requires tracking_code."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]
    serializer_class = SellerOrderDetailSerializer

    @extend_schema(
        request=inline_serializer(
            name='SellerShipOrderRequest',
            fields={
                'tracking_code': serializers.CharField(required=False),
                'note': serializers.CharField(required=False)
            }
        )
    )
    def patch(self, request, order_id):
        try:
            store = request.user.seller_profile.store
            order = Order.objects.get(id=order_id, store=store)
        except (Order.DoesNotExist, Exception):
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        tracking_code = request.data.get('tracking_code', '')
        if tracking_code:
            order.tracking_code = tracking_code
            order.save(update_fields=['tracking_code', 'updated_at'])

        try:
            order.transition_status(
                'shipped',
                changed_by=request.user,
                role='seller',
                note=request.data.get('note', ''),
            )
        except InvalidStatusTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Order shipped.',
            'data': SellerOrderDetailSerializer(order).data,
        })


# =============================================================================
# ADMIN VIEWS
# =============================================================================

class AdminOrderListView(APIView):
    """GET /api/v1/admin/orders/ — all orders with search + status filter."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from django.db.models import Q

        orders = Order.objects.select_related('buyer', 'store').order_by('-created_at')

        status_filter = request.query_params.get('status', '')
        if status_filter and status_filter != 'all':
            orders = orders.filter(order_status=status_filter)

        search = request.query_params.get('search', '').strip()
        if search:
            orders = orders.filter(
                Q(order_number__icontains=search) |
                Q(buyer__full_name__icontains=search) |
                Q(buyer__email__icontains=search)
            )

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(orders, request)
        if page is not None:
            serializer = AdminOrderSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AdminOrderSerializer(orders, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class AdminOrderDetailView(APIView):
    """GET /api/v1/admin/orders/{id}/"""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related(
                'items', 'status_history', 'payments',
            ).select_related('buyer', 'store').get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': AdminOrderSerializer(order).data,
        })


class AdminForceStatusView(APIView):
    """PATCH /api/v1/admin/orders/{id}/status/ — force status update."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        note = serializer.validated_data.get('note', '')

        try:
            order.transition_status(
                new_status,
                changed_by=request.user,
                role='admin',
                note=note,
            )
        except InvalidStatusTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': f'Order status updated to {new_status}.',
            'data': AdminOrderSerializer(order).data,
        })
