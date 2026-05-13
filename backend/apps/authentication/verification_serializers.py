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
from .verification_utils import (
    compute_file_hash,
    extract_client_ip,
    strip_image_metadata,
)
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
        """Upload a file to the S3 private bucket or store locally."""
        try:
            # 1. Determine if we should even try S3
            use_s3 = getattr(settings, 'USE_S3_STORAGE', False)
            
            # If not explicitly set, check the keys for placeholders
            if not use_s3:
                aws_key = str(getattr(settings, 'AWS_ACCESS_KEY_ID', '') or '').strip().lower()
                if aws_key and not aws_key.startswith('your-') and aws_key not in ('changeme', 'placeholder'):
                    use_s3 = True

            if not use_s3 or getattr(settings, 'DEBUG', False):
                raise ValueError("S3 not configured or in debug mode")

            # 2. Try S3 Upload
            s3_client = boto3.client(
                's3',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', ''),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', ''),
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'ap-southeast-1'),
            )
            bucket = getattr(settings, 'AWS_PRIVATE_BUCKET_NAME', 'campushat-private')
            ext = file_obj.name.rsplit('.', 1)[-1] if '.' in file_obj.name else 'jpg'
            key = f'verifications/{user_id}/{doc_type}/{uuid.uuid4().hex}.{ext}'

            # Seek to start just in case
            file_obj.seek(0)
            s3_client.upload_fileobj(
                file_obj,
                bucket,
                key,
                ExtraArgs={'ContentType': file_obj.content_type},
            )
            return key

        except Exception as e:
            # 3. Fallback to local storage
            import os
            upload_dir = os.path.join(
                str(settings.BASE_DIR), 'mediafiles', 'verifications',
                str(user_id), doc_type,
            )
            os.makedirs(upload_dir, exist_ok=True)
            
            # Get extension safely
            try:
                ext = file_obj.name.rsplit('.', 1)[-1]
            except (AttributeError, IndexError):
                ext = 'jpg'
                
            file_name = f'{uuid.uuid4().hex}.{ext}'
            file_path = os.path.join(upload_dir, file_name)
            
            # Reset file pointer if not closed
            try:
                if not file_obj.closed:
                    file_obj.seek(0)
            except Exception:
                pass

            with open(file_path, 'wb+') as dest:
                # If the file was closed by boto3 or another error, 
                # chunks() might fail. We wrap it.
                try:
                    for chunk in file_obj.chunks():
                        dest.write(chunk)
                except Exception:
                    # If file is closed, we can't do much more here without a refactor
                    # but at least we won't crash the whole request if we can help it.
                    raise
                    
            return f'verifications/{user_id}/{doc_type}/{file_name}'

    def create(self, validated_data):
        """
        Upload documents and create a verification record.

        Pipeline:
          1. Strip EXIF/ancillary metadata from image uploads (privacy +
             tampering hardening).
          2. Compute SHA-256 hash of every uploaded file (duplicate detection).
          3. Flag duplicate if another user has previously submitted the
             same document hash (independent of approval status).
          4. Increment attempt_number based on existing history.
          5. Record submission IP.
          6. Preserve rejected verifications as history (no delete).
        """
        request = self.context['request']
        user = request.user
        doc_file = validated_data.pop('submitted_document')
        cert_file = validated_data.pop('enrollment_cert', None)
        university_email = validated_data.pop('university_email', None)
        university_id = validated_data.pop('university_id', None)
        verification_type = validated_data['verification_type']

        # 1. Strip image metadata before upload + hashing so the stored
        #    file matches the hashed bytes.
        doc_file = strip_image_metadata(doc_file)
        if cert_file is not None:
            cert_file = strip_image_metadata(cert_file)

        # 2. Compute hashes (file pointer is reset by compute_file_hash).
        doc_hash = compute_file_hash(doc_file)
        cert_hash_value = compute_file_hash(cert_file) if cert_file else None

        # 3. Duplicate detection — has another user already submitted
        #    this exact document?
        is_duplicate = UserVerification.objects.filter(
            document_hash=doc_hash,
            deleted_at__isnull=True,
        ).exclude(user=user).exists()

        # Persist university metadata onto the user if it's not already set.
        update_fields = []
        if university_email and not user.university_email:
            user.university_email = university_email
            update_fields.append('university_email')
        if university_id and not user.university_id:
            user.university_id = university_id
            update_fields.append('university_id')
        if update_fields:
            user.save(update_fields=update_fields)

        # Upload the (already-cleaned) document and optional certificate.
        doc_url = self._upload_to_s3(doc_file, str(user.id), 'document')
        cert_url = None
        if cert_file:
            cert_url = self._upload_to_s3(cert_file, str(user.id), 'enrollment')

        # 4. Compute attempt_number from full submission history (kept,
        #    not deleted, so admins can see the trail).
        previous_count = UserVerification.objects.filter(
            user=user,
            verification_type=verification_type,
            deleted_at__isnull=True,
        ).count()

        verification = UserVerification.objects.create(
            user=user,
            verification_type=verification_type,
            student_id_number=validated_data.get('student_id_number', ''),
            submitted_document_url=doc_url,
            enrollment_cert_url=cert_url,
            document_hash=doc_hash,
            cert_hash=cert_hash_value,
            is_duplicate_document=is_duplicate,
            submission_ip=extract_client_ip(request),
            attempt_number=previous_count + 1,
            status='pending',
        )
        return verification


class VerificationUserSerializer(serializers.ModelSerializer):
    """Minimal user info returned inside each verification record."""

    university_short_code = serializers.SerializerMethodField()
    university_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'phone', 
            'profile_picture', 'university_email', 
            'university_short_code', 'university_name'
        ]

    def get_university_short_code(self, obj):
        if obj.university:
            return obj.university.short_name
        return None
        
    def get_university_name(self, obj):
        if obj.university:
            return obj.university.name
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
    submission_ip = serializers.SerializerMethodField()
    rejection_history = serializers.SerializerMethodField()
    duplicate_users_count = serializers.SerializerMethodField()

    class Meta:
        model = UserVerification
        fields = [
            'id', 'user', 'verification_type', 'status',
            'student_id_number', 'verification_tier',
            'rejection_reason', 'valid_until',
            'reviewed_by', 'created_at', 'updated_at',
            'admin_presigned_url', 'enrollment_cert_presigned_url',
            'id_document', 'id_document_type', 'university_email',
            'attempt_number', 'is_duplicate_document',
            'submission_ip', 'rejection_history', 'duplicate_users_count',
        ]
        read_only_fields = fields

    def _is_admin(self):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return False
        user = request.user
        if getattr(user, 'role', None) in ('admin', 'moderator'):
            return True
        from apps.admin_panel.models import RolePermission
        return RolePermission.objects.filter(
            role__user_roles__user=user,
            permission__codename='review_verifications',
        ).exists()

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
            return f'/media/{key}'

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

    def get_submission_ip(self, obj):
        """Admin-only: IP address from which the verification was submitted."""
        if self._is_admin():
            return obj.submission_ip
        return None

    def get_rejection_history(self, obj):
        """
        List previous rejected attempts (admin-only): each entry includes
        the rejection_reason and timestamp. Helps admins judge repeat
        offenders.
        """
        if not self._is_admin() or not obj.user_id:
            return []
        prior = (
            UserVerification.objects
            .filter(
                user_id=obj.user_id,
                verification_type=obj.verification_type,
                status='rejected',
                deleted_at__isnull=True,
            )
            .exclude(pk=obj.pk)
            .order_by('-created_at')
            .values('id', 'attempt_number', 'rejection_reason', 'created_at', 'reviewed_by_id')
        )
        return [
            {
                'id': str(row['id']),
                'attempt_number': row['attempt_number'],
                'rejection_reason': row['rejection_reason'],
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'reviewed_by_id': str(row['reviewed_by_id']) if row['reviewed_by_id'] else None,
            }
            for row in prior
        ]

    def get_duplicate_users_count(self, obj):
        """
        Admin-only: how many *other* users submitted a document with the
        same hash. Useful when is_duplicate_document is True.
        """
        if not self._is_admin() or not obj.document_hash:
            return 0
        return (
            UserVerification.objects
            .filter(document_hash=obj.document_hash, deleted_at__isnull=True)
            .exclude(user_id=obj.user_id)
            .values('user_id')
            .distinct()
            .count()
        )


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
