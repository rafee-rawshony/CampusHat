"""
Delivery Views.

Public tracking, admin status update with tracking events.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order

from .models import Delivery, DeliveryTrackingEvent
from .serializers import AdminDeliveryUpdateSerializer, DeliverySerializer


class PublicTrackingView(APIView):
    """GET /api/v1/delivery/track/{tracking_code}/ — public."""

    permission_classes = []

    def get(self, request, tracking_code):
        try:
            delivery = Delivery.objects.prefetch_related(
                'tracking_events',
            ).select_related('partner').get(tracking_code=tracking_code)
        except Delivery.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Tracking code not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'success': True,
            'data': DeliverySerializer(delivery).data,
        })


class AdminDeliveryUpdateView(APIView):
    """POST /api/v1/admin/delivery/{id}/update-status/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, delivery_id):
        try:
            delivery = Delivery.objects.select_related('order').get(id=delivery_id)
        except Delivery.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Delivery not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminDeliveryUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        event_time = serializer.validated_data.get('event_time', timezone.now())

        # Create tracking event
        DeliveryTrackingEvent.objects.create(
            delivery=delivery,
            status_label=new_status.replace('_', ' ').title(),
            location_description=serializer.validated_data.get('location_description', ''),
            note=serializer.validated_data.get('note', ''),
            event_time=event_time,
        )

        # Update delivery status
        delivery.status = new_status
        if new_status == 'delivered':
            delivery.delivered_at = timezone.now()
            # Transition order status
            order = delivery.order
            try:
                order.transition_status(
                    'delivered', changed_by=request.user, role='admin',
                    note='Delivery confirmed.',
                )
            except Exception:
                pass  # Order may already be delivered

        delivery.save(update_fields=['status', 'delivered_at', 'updated_at'])

        return Response({
            'success': True,
            'message': f'Delivery status updated to {new_status}.',
            'data': DeliverySerializer(delivery).data,
        })
