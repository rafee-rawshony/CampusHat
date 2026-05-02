"""
Address Serializers.

Full CRUD and compact list serializers for user addresses.
"""

from rest_framework import serializers

from .models import UserAddress


class UserAddressSerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for user addresses.

    Automatically sets the user to the authenticated user on create.
    """

    class Meta:
        model = UserAddress
        fields = [
            'id', 'label',
            'recipient_name', 'recipient_phone',
            'address_line1', 'address_line2', 'landmark',
            'campus_building', 'room_number',
            'division', 'district', 'city', 'area', 'postal_code',
            'additional_notes',
            'is_default', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Set user from request context on create."""
        validated_data['user'] = self.context['request'].user
        # If this is the user's first address, mark it as default
        user = validated_data['user']
        has_existing = UserAddress.objects.filter(
            user=user, deleted_at__isnull=True,
        ).exists()
        if not has_existing:
            validated_data['is_default'] = True
        return super().create(validated_data)


class UserAddressListSerializer(serializers.ModelSerializer):
    """Compact list serializer for addresses."""

    class Meta:
        model = UserAddress
        fields = [
            'id', 'label',
            'recipient_name', 'recipient_phone',
            'address_line1', 'landmark',
            'division', 'district', 'city', 'area',
            'postal_code', 'is_default',
        ]
        read_only_fields = fields
