"""
University Serializers.

Provides list, detail, and create/update serializers for the University model,
plus serializers for the InstitutionRequest "request to add" flow.
"""

from rest_framework import serializers

from .models import InstitutionRequest, University


class UniversityListSerializer(serializers.ModelSerializer):
    """
    Serializer for university list views — includes all editable fields
    so the admin edit drawer can pre-populate without a separate detail fetch.
    Includes student_count (users with role='student') and created_at.
    """

    student_count = serializers.SerializerMethodField()

    def get_student_count(self, obj):
        return obj.users.filter(role='student').count()

    class Meta:
        model = University
        fields = [
            'id', 'name', 'short_name', 'slug', 'system_id',
            'division', 'district', 'postal_code', 'full_address',
            'email_domain', 'short_description', 'logo_url', 'is_active',
            'student_count', 'created_at',
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
            'email_domain',
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


class InstitutionRequestCreateSerializer(serializers.ModelSerializer):
    """
    Public serializer used to submit a new institution request.
    Trims long inputs and rejects obvious duplicates of existing universities.
    """

    class Meta:
        model = InstitutionRequest
        fields = [
            'name', 'short_name', 'division', 'district',
            'full_address', 'website', 'requester_email', 'note',
        ]

    def validate_name(self, value):
        clean = value.strip()
        if not clean:
            raise serializers.ValidationError('Institution name is required.')
        # Reject if a non-deleted University already exists with the same name
        if University.objects.filter(name__iexact=clean).exists():
            raise serializers.ValidationError(
                'An institution with this name already exists. '
                'Please pick it from the dropdown.'
            )
        # Reject duplicate pending requests for the same institution
        if InstitutionRequest.objects.filter(
            name__iexact=clean,
            status=InstitutionRequest.STATUS_PENDING,
        ).exists():
            raise serializers.ValidationError(
                'A request for this institution is already pending review.'
            )
        return clean


class InstitutionRequestListSerializer(serializers.ModelSerializer):
    """
    Admin-facing serializer for listing pending/approved/rejected requests.
    """

    reviewed_by_email = serializers.CharField(
        source='reviewed_by.email', read_only=True, default=None,
    )
    created_university_id = serializers.PrimaryKeyRelatedField(
        source='created_university', read_only=True,
    )

    class Meta:
        model = InstitutionRequest
        fields = [
            'id', 'name', 'short_name', 'division', 'district',
            'full_address', 'website', 'requester_email', 'note',
            'status', 'review_note', 'reviewed_by_email', 'reviewed_at',
            'created_university_id', 'created_at',
        ]
        read_only_fields = fields


class InstitutionRequestApproveSerializer(serializers.Serializer):
    """
    Inputs the admin provides when approving a request — these become
    the fields of the new University record. `short_name` and
    `postal_code` are required (the public submission may have skipped them).
    """

    short_name = serializers.CharField(max_length=30)
    postal_code = serializers.CharField(max_length=10)
    full_address = serializers.CharField(required=False, allow_blank=True)
    email_domain = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True,
    )

    def validate_short_name(self, value):
        clean = value.strip().upper()
        if University.objects.filter(short_name__iexact=clean).exists():
            raise serializers.ValidationError(
                'A university with this short_name already exists.'
            )
        return clean


class InstitutionRequestRejectSerializer(serializers.Serializer):
    """Admin provides a reason when rejecting a request."""

    review_note = serializers.CharField(max_length=500)
