"""
Order Views.

Buyer: checkout, list, detail, cancel, tracking.
Seller: store orders list, confirm, pack, ship.
Admin: all orders, force status update.
"""

from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.mall.models import Cart
from apps.orders.models import InvalidStatusTransitionError, Order
from apps.orders.services.checkout import (
    CheckoutError,
    InsufficientStockError,
    process_checkout,
)
from core.pagination import CampusHatPagination
from core.permissions import IsApprovedSeller
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

class CheckoutView(APIView):
    """POST /api/v1/orders/checkout/ — atomic checkout."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

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


class BuyerOrderListView(APIView):
    """GET /api/v1/orders/ — buyer's own orders."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(
            buyer=request.user,
        ).select_related('store').order_by('-created_at')

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(orders, request)
        if page is not None:
            serializer = OrderListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = OrderListSerializer(orders, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class BuyerOrderDetailView(APIView):
    """GET /api/v1/orders/{id}/ — order detail with items."""

    permission_classes = [IsAuthenticated]

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


class BuyerCancelOrderView(APIView):
    """PATCH /api/v1/orders/{id}/cancel/ — cancel order (only if placed)."""

    permission_classes = [IsAuthenticated]

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


class OrderTrackingView(APIView):
    """GET /api/v1/orders/{id}/tracking/ — delivery info."""

    permission_classes = [IsAuthenticated]

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

class SellerOrderListView(APIView):
    """GET /api/v1/seller/orders/ — seller's store orders."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

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

        serializer = SellerOrderListSerializer(orders, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class SellerOrderDetailView(APIView):
    """GET /api/v1/seller/orders/{id}/ — seller order detail."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

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


class SellerConfirmOrderView(APIView):
    """PATCH /api/v1/seller/orders/{id}/confirm/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

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


class SellerPackOrderView(APIView):
    """PATCH /api/v1/seller/orders/{id}/pack/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

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


class SellerShipOrderView(APIView):
    """PATCH /api/v1/seller/orders/{id}/ship/ — requires tracking_code."""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

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
    """GET /api/v1/admin/orders/ — all orders."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        orders = Order.objects.select_related(
            'buyer', 'store',
        ).order_by('-created_at')

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

    permission_classes = [IsAuthenticated, IsAdminUser]

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

    permission_classes = [IsAuthenticated, IsAdminUser]

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
