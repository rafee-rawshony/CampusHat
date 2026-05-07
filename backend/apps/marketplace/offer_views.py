"""
Offer Views for the Marketplace.

Create an offer, list offers on a product, accept/reject/counter.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsVerifiedForMarketplace

from .interaction_serializers import MarketplaceOfferSerializer, OfferActionSerializer
from .models import MarketplaceOffer, MarketplaceProduct


class CreateOfferView(APIView):
    """
    POST /api/v1/marketplace/listings/{id}/offers/

    Create a new price offer on a negotiable listing.
    """

    permission_classes = [IsAuthenticated, IsVerifiedForMarketplace]

    def post(self, request, product_id):
        try:
            product = MarketplaceProduct.objects.get(
                pk=product_id, status='active', deleted_at__isnull=True,
            )
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found.',
                'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['product'] = product.id

        serializer = MarketplaceOfferSerializer(
            data=data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Offer submitted successfully.',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class ListOffersView(APIView):
    """
    GET /api/v1/marketplace/listings/{id}/offers/

    Seller sees all offers on their listing.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        try:
            product = MarketplaceProduct.objects.get(
                pk=product_id, deleted_at__isnull=True,
            )
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False, 'message': 'Product not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if product.user != request.user:
            return Response({
                'success': False,
                'message': 'Only the seller can view offers.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        offers = MarketplaceOffer.objects.filter(
            product=product, deleted_at__isnull=True,
        ).select_related('buyer')
        serializer = MarketplaceOfferSerializer(offers, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })


class OfferActionView(APIView):
    """
    PATCH /api/v1/marketplace/offers/{id}/accept/
    PATCH /api/v1/marketplace/offers/{id}/reject/
    PATCH /api/v1/marketplace/offers/{id}/counter/
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, action_type):
        try:
            offer = MarketplaceOffer.objects.select_related('product').get(
                pk=pk, deleted_at__isnull=True,
            )
        except MarketplaceOffer.DoesNotExist:
            return Response({
                'success': False, 'message': 'Offer not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        # Only the seller can accept/reject/counter
        if offer.product.user != request.user:
            return Response({
                'success': False,
                'message': 'Only the seller can manage offers.',
                'code': 'FORBIDDEN',
            }, status=status.HTTP_403_FORBIDDEN)

        if offer.status != 'pending':
            return Response({
                'success': False,
                'message': f'Cannot {action_type} an offer with status "{offer.status}".',
                'code': 'INVALID_STATUS',
            }, status=status.HTTP_400_BAD_REQUEST)

        if action_type == 'accept':
            offer.status = 'accepted'
            offer.save(update_fields=['status'])
            msg = 'Offer accepted.'
        elif action_type == 'reject':
            offer.status = 'rejected'
            offer.save(update_fields=['status'])
            msg = 'Offer rejected.'
        elif action_type == 'counter':
            ser = OfferActionSerializer(data=request.data)
            ser.is_valid(raise_exception=True)
            counter = ser.validated_data.get('counter_price')
            if not counter:
                return Response({
                    'success': False,
                    'message': 'counter_price is required for countering.',
                    'code': 'MISSING_FIELD',
                }, status=status.HTTP_400_BAD_REQUEST)
            offer.counter_price = counter
            offer.status = 'countered'
            offer.save(update_fields=['counter_price', 'status'])
            msg = 'Counter offer sent.'
        else:
            return Response({
                'success': False, 'message': 'Invalid action.',
                'code': 'INVALID_ACTION',
            }, status=status.HTTP_400_BAD_REQUEST)

        output = MarketplaceOfferSerializer(offer).data
        return Response({
            'success': True,
            'message': msg,
            'data': output,
        })
