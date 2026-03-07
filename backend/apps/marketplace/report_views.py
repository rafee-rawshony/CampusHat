"""
Report Views for the Marketplace.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .interaction_serializers import MarketplaceReportSerializer
from .models import MarketplaceProduct


class CreateReportView(APIView):
    """POST /api/v1/marketplace/listings/{id}/report/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        try:
            product = MarketplaceProduct.objects.get(
                pk=product_id, deleted_at__isnull=True,
            )
        except MarketplaceProduct.DoesNotExist:
            return Response({
                'success': False, 'message': 'Product not found.', 'code': 'NOT_FOUND',
            }, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['product'] = product.id
        serializer = MarketplaceReportSerializer(
            data=data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Report submitted.',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)
