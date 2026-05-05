"""
Verification Serializers.

Handles document upload, verification status display, and admin review
for the user verification system.
"""

import boto3
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserVerification
from core.validators import validate_document_file

User = get_user_model()


class SubmitVerificationSerializer(serializers.Serializer):
    """
    Serializer for submitting a new verification request.

    Accepts document files (image uploads) and stores them in S3
    private bucket. Validates that Only one pending/approved verification
    exists per type per user.
    """

    verification_type = serializers.ChoiceField(
        choices=UserVerification.VERIFICATION_TYPE_CHOICES,
    )
    student_id_number = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
    )
    university_email = serializers.EmailField(
        required=False,
        allow_blank=True,
        help_text='University email to associate with the user account.',
    )
    # university_id is collected in the form but the user already has it from registration;
    # we accept it here so the frontend does not get a 400 for extra fields.
    university_id = serializers.UUIDField(required=False)
    submitted_document = serializers.FileField(
        required=True,
        validators=[validate_document_file],
        help_text='Main identity document (student ID, faculty ID, etc.).',
    )
    enrollment_cert = serializers.FileField(
        required=False,
        validators=[validate_document_file],
        help_text='Enrollment certificate (optional, for seller verification).',
    )

    def validate(self, attrs):
        """Ensure no pending or approved verification of the same type exists."""
        user = self.context['request'].user
        vtype = attrs['verification_type']

        existing = UserVerification.objects.filter(
            user=user,
            verification_type=vtype,
            status__in=['pending', 'approved'],
        ).first()

        if existing:
            if existing.status == 'pending':
                raise serializers.ValidationError(
                    'You already have a pending verification of this type.'
                )
            if existing.status == 'approved':
                raise serializers.ValidationError(
                    'You already have an approved verification of this type.'
                )

        return attrs

    def _upload_to_s3(self, file_obj, user_id, doc_type):
        """Upload a file to the S3 private bucket and return the key."""
        try:
            aws_key = getattr(settings, 'AWS_ACCESS_KEY_ID', '')
            if not aws_key:
                raise ValueError("S3 not configured")

            s3_client = boto3.client(
                's3',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', ''),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', ''),
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'ap-southeast-1'),
            )
            bucket = getattr(settings, 'AWS_PRIVATE_BUCKET_NAME', 'campushat-private')
            ext = file_obj.name.rsplit('.', 1)[-1] if '.' in file_obj.name else 'jpg'
            key = f'verifications/{user_id}/{doc_type}/{uuid.uuid4().hex}.{ext}'

            s3_client.upload_fileobj(
                file_obj,
                bucket,
                key,
                ExtraArgs={'ContentType': file_obj.content_type},
            )
            return key
        except Exception:
            # In development, store locally if S3 is not configured
            import os
            upload_dir = os.path.join(
                settings.BASE_DIR, 'mediafiles', 'verifications',
                str(user_id), doc_type,
            )
            os.makedirs(upload_dir, exist_ok=True)
            file_name = f'{uuid.uuid4().hex}.{file_obj.name.rsplit(".", 1)[-1]}'
            file_path = os.path.join(upload_dir, file_name)
            with open(file_path, 'wb+') as dest:
                for chunk in file_obj.chunks():
                    dest.write(chunk)
            return f'verifications/{user_id}/{doc_type}/{file_name}'

    def create(self, validated_data):
        """Upload documents and create verification record."""
        user = self.context['request'].user
        doc_file = validated_data.pop('submitted_document')
        cert_file = validated_data.pop('enrollment_cert', None)
        university_email = validated_data.pop('university_email', None)
        validated_data.pop('university_id', None)  # already set on user

        # Save university email onto the user profile if provided and not already set
        if university_email and not user.university_email:
            user.university_email = university_email
            user.save(update_fields=['university_email'])

        # Upload main document
        doc_url = self._upload_to_s3(doc_file, str(user.id), 'document')

        # Upload enrollment cert if provided
        cert_url = None
        if cert_file:
            cert_url = self._upload_to_s3(cert_file, str(user.id), 'enrollment')

        # Delete any rejected verification of same type (allow resubmit)
        UserVerification.objects.filter(
            user=user,
            verification_type=validated_data['verification_type'],
            status='rejected',
        ).delete()

        verification = UserVerification.objects.create(
            user=user,
            verification_type=validated_data['verification_type'],
            student_id_number=validated_data.get('student_id_number', ''),
            submitted_document_url=doc_url,
            enrollment_cert_url=cert_url,
            status='pending',
        )
        return verification


class VerificationUserSerializer(serializers.ModelSerializer):
    """Minimal user info returned inside each verification record."""

    university_short_code = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'profile_picture', 'university_email', 'university_short_code']

    def get_university_short_code(self, obj):
        if obj.university:
            return obj.university.short_name
        return None


class VerificationStatusSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for displaying verification status.

    Includes a presigned URL for the admin to view documents.
    Non-admin users do NOT receive the presigned URL.
    """

    user = VerificationUserSerializer(read_only=True)
    admin_presigned_url = serializers.SerializerMethodField()
    enrollment_cert_presigned_url = serializers.SerializerMethodField()
    # Aliases that the admin UI expects
    id_document = serializers.SerializerMethodField()
    id_document_type = serializers.SerializerMethodField()
    university_email = serializers.SerializerMethodField()

    class Meta:
        model = UserVerification
        fields = [
            'id', 'user', 'verification_type', 'status',
            'student_id_number', 'verification_tier',
            'rejection_reason', 'valid_until',
            'reviewed_by', 'created_at', 'updated_at',
            'admin_presigned_url', 'enrollment_cert_presigned_url',
            'id_document', 'id_document_type', 'university_email',
        ]
        read_only_fields = fields

    def _is_admin(self):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return getattr(request.user, 'role', None) in ('admin', 'moderator')
        return False

    def _generate_presigned_url(self, key):
        """Generate a presigned URL for an S3 object (15-min expiry)."""
        if not key:
            return None
        try:
            aws_key = getattr(settings, 'AWS_ACCESS_KEY_ID', '')
            if not aws_key:
                raise ValueError("S3 not configured")

            s3_client = boto3.client(
                's3',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', ''),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', ''),
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'ap-southeast-1'),
            )
            bucket = getattr(settings, 'AWS_PRIVATE_BUCKET_NAME', 'campushat-private')
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': key},
                ExpiresIn=900,  # 15 minutes
            )
            return url
        except Exception:
            # In development, return local path
            return f'/mediafiles/{key}'

    def get_admin_presigned_url(self, obj):
        """Only provide presigned URL to admin/moderator users."""
        if self._is_admin():
            return self._generate_presigned_url(obj.submitted_document_url)
        return None

    def get_enrollment_cert_presigned_url(self, obj):
        """Only provide enrollment cert URL to admin/moderator users."""
        if self._is_admin():
            return self._generate_presigned_url(obj.enrollment_cert_url)
        return None

    def get_id_document(self, obj):
        """Alias for admin_presigned_url — used by the admin review UI."""
        if self._is_admin():
            return self._generate_presigned_url(obj.submitted_document_url)
        return None

    def get_id_document_type(self, obj):
        """Derive document type from the stored file path extension."""
        if obj.submitted_document_url:
            ext = obj.submitted_document_url.rsplit('.', 1)[-1].lower()
            return 'pdf' if ext == 'pdf' else 'image'
        return None

    def get_university_email(self, obj):
        """Return the submitting user's university email."""
        return obj.user.university_email if obj.user else None


class AdminReviewSerializer(serializers.Serializer):
    """
    Serializer for admin to review (approve/reject) a verification.

    Validates that rejection_reason is required when rejecting.
    Sets reviewed_by to the current admin user on save.
    """

    status = serializers.ChoiceField(
        choices=[('approved', 'Approved'), ('rejected', 'Rejected')],
    )
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    verification_tier = serializers.ChoiceField(
        choices=UserVerification.TIER_CHOICES,
        required=False,
        default='bronze',
    )

    def validate(self, attrs):
        """Require rejection_reason when status is rejected."""
        if attrs['status'] == 'rejected':
            reason = attrs.get('rejection_reason', '').strip()
            if not reason:
                raise serializers.ValidationError({
                    'rejection_reason': 'Rejection reason is required when rejecting.',
                })
        return attrs

    def update(self, instance, validated_data):
        """Apply the admin's review decision."""
        instance.status = validated_data['status']
        instance.reviewed_by = self.context['request'].user

        if validated_data['status'] == 'approved':
            instance.verification_tier = validated_data.get(
                'verification_tier', 'bronze'
            )
            instance.rejection_reason = None
            # Set valid for 1 year
            from django.utils import timezone
            from datetime import timedelta
            instance.valid_until = (timezone.now() + timedelta(days=365)).date()
        else:
            instance.rejection_reason = validated_data.get('rejection_reason', '')

        instance.save()
        return instance
