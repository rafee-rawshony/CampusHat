"""
Address Views.

CRUD endpoints for user addresses with default toggle support.
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .address_serializers import UserAddressListSerializer, UserAddressSerializer
from .models import UserAddress


class UserAddressViewSet(ModelViewSet):
    """
    ViewSet for user addresses.

    list:    GET    /api/v1/auth/addresses/
    create:  POST   /api/v1/auth/addresses/
    update:  PATCH  /api/v1/auth/addresses/{id}/
    destroy: DELETE /api/v1/auth/addresses/{id}/  (soft delete)
    set_default: POST /api/v1/auth/addresses/{id}/set-default/
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'list':
            return UserAddressListSerializer
        return UserAddressSerializer

    def get_queryset(self):
        """Only return the authenticated user's non-deleted addresses."""
        return UserAddress.objects.filter(
            user=self.request.user,
            deleted_at__isnull=True,
        )

    def perform_destroy(self, instance):
        """Soft-delete instead of hard delete."""
        instance.soft_delete()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                'success': True,
                'message': 'Data retrieved successfully.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                'success': True,
                'message': 'Address created successfully.',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                'success': True,
                'message': 'Address updated successfully.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {
                'success': True,
                'message': 'Address deleted successfully.',
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='set-default')
    def set_default(self, request, pk=None):
        """
        POST /api/v1/auth/addresses/{id}/set-default/

        Set the specified address as the default.
        """
        address = self.get_object()
        address.is_default = True
        address.save()  # The model's save() handles unsetting others

        serializer = UserAddressSerializer(address)
        return Response(
            {
                'success': True,
                'message': 'Default address updated successfully.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )
