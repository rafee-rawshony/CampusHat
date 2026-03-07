"""
University Serializers.

Provides list, detail, and create/update serializers for the University model.
"""

from rest_framework import serializers

from .models import University


class UniversityListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for university list views.
    Returns only essential fields for browsing.
    """

    class Meta:
        model = University
        fields = [
            'id', 'name', 'short_name', 'slug', 'system_id',
            'division', 'district', 'logo_url', 'is_active',
        ]
        read_only_fields = fields


class UniversityDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer with all university fields for detail views.
    """

    class Meta:
        model = University
        fields = [
            'id', 'name', 'short_name', 'slug', 'system_id',
            'division', 'district', 'postal_code', 'full_address',
            'short_description', 'logo_url', 'is_active',
            'sso_enabled', 'sso_provider', 'sso_domain',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'system_id', 'created_at', 'updated_at']


class UniversityCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for admin create/update operations.
    slug and system_id are auto-generated.
    """

    class Meta:
        model = University
        fields = [
            'name', 'short_name', 'division', 'district',
            'postal_code', 'full_address', 'short_description',
            'logo_url', 'is_active',
            'sso_enabled', 'sso_provider', 'sso_domain',
        ]

    def validate_short_name(self, value):
        """Ensure short_name is uppercase."""
        return value.upper()
