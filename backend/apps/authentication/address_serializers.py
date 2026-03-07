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
            'id', 'label', 'address_line1', 'address_line2',
            'campus_building', 'room_number',
            'district', 'city', 'postal_code',
            'is_default', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Set user from request context on create."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UserAddressListSerializer(serializers.ModelSerializer):
    """Compact list serializer for addresses."""

    class Meta:
        model = UserAddress
        fields = [
            'id', 'label', 'district', 'city',
            'postal_code', 'is_default',
        ]
        read_only_fields = fields
