"""
Review Views for the Marketplace.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsVerifiedStudent

from .interaction_serializers import MarketplaceReviewSerializer
from .models import MarketplaceProduct, MarketplaceReview


class CreateReviewView(APIView):
    """POST /api/v1/marketplace/listings/{id}/reviews/"""

    permission_classes = [IsAuthenticated, IsVerifiedStudent]

    def post(self, request, product_id):
        try:
            product = MarketplaceProduct.objects.get(
                pk=product_id, deleted_at__isnull=True,
            )
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False, 'message': 'Product not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        if product.user == request.user:
            return Response({
                'success': False,
                'message': 'You cannot review your own listing.',
                'code': 'SELF_REVIEW',
            }, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['product'] = product.id
        serializer = MarketplaceReviewSerializer(
            data=data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Review submitted.',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class ListReviewsView(APIView):
    """GET /api/v1/marketplace/listings/{id}/reviews/"""

    permission_classes = []

    def get(self, request, product_id):
        reviews = MarketplaceReview.objects.filter(
            product_id=product_id, deleted_at__isnull=True,
        ).select_related('reviewer')
        serializer = MarketplaceReviewSerializer(reviews, many=True)
        return Response({
            'success': True,
            'message': 'Data retrieved successfully.',
            'data': serializer.data,
        })
