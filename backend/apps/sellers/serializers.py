"""
Seller Serializers.

Handles seller registration, profile views, store management,
badges, payouts, and dashboard stats.
"""

import json
import uuid

from rest_framework import serializers

from .models import (
    SellerProfile, Store, SellerBadge, SellerPayoutRequest, StudentBenefit,
    encrypt_value,
)


from core.validators import validate_document_file

# =============================================================================
# SELLER REGISTRATION
# =============================================================================

class SellerOnboardingSerializer(serializers.Serializer):
    """
    Daraz-style multi-section seller onboarding.

    Accepts pre-uploaded image URLs (from POST /api/v1/uploads/) instead of
    multipart files, so the frontend can show inline progress + previews.
    Creates the SellerProfile AND its Store atomically.

    Required sections:
      - personal: full_name, phone, email, gender, birthday  (synced back to User)
      - store: store_name, store_type, store_phone, store_email
      - identity: identity_doc_type, document_number, document_image_url
      - terms: accepted_terms = true
    Optional:
      - profile_picture (synced to User)
      - is_student_seller + student_id_card_url
      - store logo / banner / description / address / facebook_page
      - bank or mobile banking details
    """

    # ── Personal (also synced back to User) ─────────────────────────────
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    gender = serializers.ChoiceField(choices=['male', 'female', 'other'])
    birthday = serializers.DateField()
    profile_picture = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    # ── Student verification (optional) ────────────────────────────────
    is_student_seller = serializers.BooleanField(default=False)
    student_id_card_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    # ── Store info ──────────────────────────────────────────────────────
    store_name = serializers.CharField(max_length=200)
    store_type = serializers.ChoiceField(choices=['online', 'physical', 'both'], default='online')
    store_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    store_phone = serializers.CharField(max_length=20)
    store_email = serializers.EmailField()
    store_description = serializers.CharField(required=False, allow_blank=True, default='')
    store_category = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    facebook_page = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    logo_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    banner_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    # ── Identity verification ──────────────────────────────────────────
    identity_doc_type = serializers.ChoiceField(choices=['nid', 'passport'])
    document_number = serializers.CharField(max_length=100)
    document_image_url = serializers.URLField()
    document_back_image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    # ── Payment (optional but at least one recommended) ────────────────
    mobile_banking_method = serializers.ChoiceField(
        choices=['bkash', 'nagad', 'rocket'], required=False, allow_blank=True,
    )
    mobile_banking_number = serializers.CharField(
        max_length=20, required=False, allow_blank=True,
    )
    bank_account_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True,
    )
    bank_account_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True,
    )
    bank_name = serializers.CharField(max_length=200, required=False, allow_blank=True)

    # ── Agreement ──────────────────────────────────────────────────────
    accepted_terms = serializers.BooleanField()

    # ── Validation ─────────────────────────────────────────────────────

    def validate_accepted_terms(self, value):
        if value is not True:
            raise serializers.ValidationError(
                'You must accept the Terms & Conditions to register as a seller.'
            )
        return value

    def validate(self, attrs):
        # If physical / both, store_address is required.
        if attrs.get('store_type') in ('physical', 'both') and not attrs.get('store_address'):
            raise serializers.ValidationError({
                'store_address': 'Store address is required for physical and both-mode stores.',
            })
        # If student seller, ID card image required.
        if attrs.get('is_student_seller') and not attrs.get('student_id_card_url'):
            raise serializers.ValidationError({
                'student_id_card_url': 'Student ID card image is required for student sellers.',
            })
        return attrs

    # ── Create ─────────────────────────────────────────────────────────

    def create(self, validated_data):
        from django.db import transaction
        from apps.universities.models import University
        from .models import Store

        user = self.context['request'].user

        # Sync the personal fields back to the User. This is the "edits here
        # propagate back" behaviour the spec asks for.
        with transaction.atomic():
            updated_user_fields = []
            full_name = validated_data['full_name'].strip()
            if user.full_name != full_name:
                user.full_name = full_name
                # Best-effort first_name / last_name split.
                parts = full_name.split(' ', 1)
                user.first_name = parts[0]
                user.last_name = parts[1] if len(parts) > 1 else ''
                updated_user_fields += ['full_name', 'first_name', 'last_name']

            if user.phone != validated_data['phone']:
                user.phone = validated_data['phone']
                updated_user_fields.append('phone')

            # Email is synced back ONLY if it doesn't change the login email.
            # If the user wants a different login email they go through the
            # verification flow on /account; we don't bypass that here.
            if validated_data['email'].lower() == (user.email or '').lower():
                pass  # no-op
            else:
                # Treat the new email as the seller's contact email; do not
                # change user.email silently.
                pass

            if user.gender != validated_data['gender']:
                user.gender = validated_data['gender']
                updated_user_fields.append('gender')

            if user.birthday != validated_data['birthday']:
                user.birthday = validated_data['birthday']
                updated_user_fields.append('birthday')

            if validated_data.get('profile_picture'):
                user.profile_picture = validated_data['profile_picture']
                updated_user_fields.append('profile_picture')

            if updated_user_fields:
                user.save(update_fields=list(set(updated_user_fields)))

            # Determine commission rate — student sellers get a discount.
            is_student = bool(validated_data.get('is_student_seller'))
            commission_rate = 7.00 if is_student else 10.00

            # Pick the right business_type bucket from a couple of toggles.
            business_type = 'student' if is_student else 'individual'

            seller = SellerProfile(
                user=user,
                business_name=validated_data['store_name'],
                business_type=business_type,
                business_phone=validated_data['phone'],
                business_email=validated_data['email'],
                identity_doc_type=validated_data['identity_doc_type'],
                nid_number=validated_data['document_number'],
                nid_front_url=validated_data['document_image_url'],
                nid_back_url=validated_data.get('document_back_image_url') or '',
                student_id_card_url=validated_data.get('student_id_card_url') or '',
                is_student_seller=is_student,
                commission_rate=commission_rate,
                status='pending',
                mobile_banking_method=validated_data.get('mobile_banking_method') or None,
            )

            # Encrypt mobile banking number if provided.
            mobile_number = validated_data.get('mobile_banking_number')
            if mobile_number:
                seller.set_mobile_number(mobile_number)

            # Encrypt bank account details if provided.
            bank_acc_no = validated_data.get('bank_account_number')
            if bank_acc_no:
                seller.set_bank_details({
                    'account_name': validated_data.get('bank_account_name', ''),
                    'account_number': bank_acc_no,
                    'bank_name': validated_data.get('bank_name', ''),
                })

            seller.save()

            # Store row — starts in `under_review` so admin can approve later.
            store_university = user.university or University.objects.filter(is_active=True).first()
            store = Store(
                seller=seller,
                university=store_university,
                name=validated_data['store_name'],
                description=validated_data.get('store_description') or '',
                store_category=validated_data.get('store_category') or 'general',
                store_type=validated_data['store_type'],
                store_address=validated_data.get('store_address') or '',
                facebook_page=validated_data.get('facebook_page') or None,
                logo_url=validated_data.get('logo_url') or None,
                banner_url=validated_data.get('banner_url') or None,
                business_phone=validated_data['store_phone'],
                business_email=validated_data['store_email'],
                return_policy='Standard 7-day return policy.',
                status='under_review',
            )
            store.save()

        return seller


class SellerRegistrationSerializer(serializers.ModelSerializer):
    """
    Register as a seller with document uploads.

    Uploads NID, trade license, etc. to S3/local.
    Encrypts bank and mobile details.
    """

    nid_front = serializers.FileField(write_only=True, required=True, validators=[validate_document_file])
    nid_back = serializers.FileField(write_only=True, required=True, validators=[validate_document_file])
    trade_license = serializers.FileField(write_only=True, required=False, validators=[validate_document_file])
    tin_cert = serializers.FileField(write_only=True, required=False, validators=[validate_document_file])
    vat_cert = serializers.FileField(write_only=True, required=False, validators=[validate_document_file])
    brand_auth_letter = serializers.FileField(write_only=True, required=False, validators=[validate_document_file])
    trademark_cert = serializers.FileField(write_only=True, required=False, validators=[validate_document_file])

    # Financial
    bank_account_details = serializers.JSONField(required=False)
    mobile_banking_method = serializers.CharField(required=False, allow_blank=True)
    mobile_banking_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = SellerProfile
        fields = [
            'business_name', 'business_type', 'nid_number',
            'business_phone', 'business_email',
            'nid_front', 'nid_back', 'trade_license',
            'tin_cert', 'vat_cert', 'brand_auth_letter', 'trademark_cert',
            'bank_account_details', 'mobile_banking_method',
            'mobile_banking_number',
        ]

    def validate(self, attrs):
        btype = attrs.get('business_type', '')
        if btype not in ('individual', 'student') and not attrs.get('trade_license'):
            raise serializers.ValidationError({
                'trade_license': 'Trade license is required for non-individual/student sellers.',
            })
        if btype == 'brand':
            if not attrs.get('brand_auth_letter'):
                raise serializers.ValidationError({
                    'brand_auth_letter': 'Brand authorization letter is required.',
                })
            if not attrs.get('trademark_cert'):
                raise serializers.ValidationError({
                    'trademark_cert': 'Trademark certificate is required.',
                })
        # At least one payment method
        has_bank = bool(attrs.get('bank_account_details'))
        has_mobile = bool(attrs.get('mobile_banking_method') and attrs.get('mobile_banking_number'))
        if not has_bank and not has_mobile:
            raise serializers.ValidationError(
                'At least one payment method (bank or mobile banking) is required.'
            )
        return attrs

    def _upload_file(self, file_obj, user_id, folder):
        """Upload to S3 private or local fallback."""
        import os
        from django.conf import settings as s
        ext = file_obj.name.rsplit('.', 1)[-1] if '.' in file_obj.name else 'jpg'
        fname = f'{uuid.uuid4().hex}.{ext}'
        try:
            aws_key = getattr(s, 'AWS_ACCESS_KEY_ID', '')
            if not aws_key:
                raise ValueError("S3 not configured")

            import boto3
            s3 = boto3.client('s3',
                aws_access_key_id=getattr(s, 'AWS_ACCESS_KEY_ID', ''),
                aws_secret_access_key=getattr(s, 'AWS_SECRET_ACCESS_KEY', ''),
                region_name=getattr(s, 'AWS_S3_REGION_NAME', 'ap-southeast-1'),
            )
            bucket = getattr(s, 'AWS_STORAGE_BUCKET_NAME', 'campushat-media')
            key = f'sellers/{user_id}/{folder}/{fname}'
            s3.upload_fileobj(file_obj, bucket, key,
                ExtraArgs={'ContentType': file_obj.content_type})
            return f's3://{bucket}/{key}'
        except Exception:
            upload_dir = os.path.join(s.BASE_DIR, 'mediafiles', 'sellers', str(user_id), folder)
            os.makedirs(upload_dir, exist_ok=True)
            path = os.path.join(upload_dir, fname)
            with open(path, 'wb+') as dest:
                for chunk in file_obj.chunks():
                    dest.write(chunk)
            return f'/media/sellers/{user_id}/{folder}/{fname}'

    def create(self, validated_data):
        user = self.context['request'].user
        uid = str(user.id)

        # Pop file fields
        file_map = {
            'nid_front': 'nid_front_url',
            'nid_back': 'nid_back_url',
            'trade_license': 'trade_license_url',
            'tin_cert': 'tin_cert_url',
            'vat_cert': 'vat_cert_url',
            'brand_auth_letter': 'brand_auth_letter_url',
            'trademark_cert': 'trademark_cert_url',
        }
        for field, url_field in file_map.items():
            f = validated_data.pop(field, None)
            if f:
                validated_data[url_field] = self._upload_file(f, uid, field)

        # Encrypt financial fields
        bank_details = validated_data.pop('bank_account_details', None)
        mobile_number = validated_data.pop('mobile_banking_number', None)

        validated_data['user'] = user
        validated_data['status'] = 'pending'

        # Student seller check
        from apps.authentication.models import UserVerification
        is_student = UserVerification.objects.filter(
            user=user, verification_type__in=['student_id', 'faculty_id'],
            status='approved',
        ).exists()
        validated_data['is_student_seller'] = is_student
        validated_data['commission_rate'] = 7.00 if is_student else 10.00

        seller = SellerProfile(**validated_data)
        if bank_details:
            seller.set_bank_details(bank_details)
        if mobile_number:
            seller.set_mobile_number(mobile_number)
        seller.save()
        return seller


# =============================================================================
# SELLER PROFILE (PUBLIC)
# =============================================================================

class SellerProfileSerializer(serializers.ModelSerializer):
    """Public seller profile — no document URLs."""

    class Meta:
        model = SellerProfile
        fields = [
            'id', 'business_name', 'business_type',
            'is_student_seller', 'status', 'commission_rate',
            'business_phone', 'business_email', 'created_at',
        ]
        read_only_fields = fields


# =============================================================================
# SELLER PROFILE (ADMIN)
# =============================================================================

class SellerProfileAdminSerializer(serializers.ModelSerializer):
    """Admin full view with presigned URLs for documents."""

    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    nid_number_decrypted = serializers.SerializerMethodField()
    bank_details_decrypted = serializers.SerializerMethodField()
    mobile_number_decrypted = serializers.SerializerMethodField()

    class Meta:
        model = SellerProfile
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'business_name', 'business_type', 'nid_number',
            'nid_number_decrypted',
            'nid_front_url', 'nid_back_url',
            'trade_license_url', 'tin_cert_url', 'vat_cert_url',
            'brand_auth_letter_url', 'trademark_cert_url',
            'bank_details_decrypted', 'mobile_banking_method',
            'mobile_number_decrypted',
            'business_phone', 'business_email',
            'status', 'commission_rate', 'is_student_seller',
            'rejection_reason', 'approved_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_nid_number_decrypted(self, obj):
        from .models import decrypt_value
        return decrypt_value(obj.nid_number) if obj.nid_number else None

    def get_bank_details_decrypted(self, obj):
        return obj.get_bank_details()

    def get_mobile_number_decrypted(self, obj):
        return obj.get_mobile_number()


# =============================================================================
# STORE
# =============================================================================

class StoreCreateSerializer(serializers.ModelSerializer):
    """Create a store for an approved seller."""

    logo = serializers.ImageField(write_only=True, required=False)
    banner = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Store
        fields = [
            'name', 'description', 'store_category',
            'return_policy', 'avg_dispatch_hours', 'shipping_coverage',
            'business_phone', 'business_email', 'logo', 'banner',
        ]

    def _upload(self, f, seller_id, folder):
        import os
        from django.conf import settings as s
        ext = f.name.rsplit('.', 1)[-1] if '.' in f.name else 'jpg'
        fname = f'{uuid.uuid4().hex}.{ext}'
        upload_dir = os.path.join(s.BASE_DIR, 'mediafiles', 'stores', str(seller_id), folder)
        os.makedirs(upload_dir, exist_ok=True)
        path = os.path.join(upload_dir, fname)
        with open(path, 'wb+') as dest:
            for chunk in f.chunks():
                dest.write(chunk)
        return f'/media/stores/{seller_id}/{folder}/{fname}'

    def create(self, validated_data):
        user = self.context['request'].user
        seller = user.seller_profile
        logo = validated_data.pop('logo', None)
        banner = validated_data.pop('banner', None)

        validated_data['seller'] = seller
        validated_data['university'] = user.university

        if logo:
            validated_data['logo_url'] = self._upload(logo, str(seller.id), 'logo')
        if banner:
            validated_data['banner_url'] = self._upload(banner, str(seller.id), 'banner')

        return Store.objects.create(**validated_data)


class StoreUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = [
            'name', 'description', 'store_category',
            'return_policy', 'avg_dispatch_hours', 'shipping_coverage',
            'business_phone', 'business_email',
        ]


class StoreDetailSerializer(serializers.ModelSerializer):
    """Public store detail with badges."""

    seller_name = serializers.CharField(source='seller.business_name', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)
    badges = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            'id', 'name', 'slug', 'description', 'logo_url', 'banner_url',
            'store_category', 'return_policy', 'avg_dispatch_hours',
            'shipping_coverage', 'business_phone', 'business_email',
            'status', 'rating_avg', 'review_count', 'total_sales_count',
            'follower_count', 'response_rate',
            'seller_name', 'university_name', 'badges',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_badges(self, obj):
        active = obj.badges.filter(is_active=True)
        return SellerBadgeSerializer(active, many=True).data


class StoreListSerializer(serializers.ModelSerializer):
    """Compact store serializer for search results."""

    university_name = serializers.CharField(source='university.name', read_only=True)
    badge_count = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            'id', 'name', 'slug', 'logo_url', 'store_category',
            'status', 'rating_avg', 'review_count',
            'university_name', 'badge_count',
        ]
        read_only_fields = fields

    def get_badge_count(self, obj):
        return obj.badges.filter(is_active=True).count()


# =============================================================================
# BADGES
# =============================================================================

class SellerBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerBadge
        fields = [
            'id', 'badge_type', 'display_label', 'is_active',
            'awarded_at', 'revoked_at',
        ]
        read_only_fields = fields


# =============================================================================
# PAYOUTS
# =============================================================================

class SellerPayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerPayoutRequest
        fields = [
            'id', 'amount', 'method', 'account_details_snapshot',
            'status', 'bank_transaction_ref', 'note',
            'processed_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'status', 'bank_transaction_ref',
            'processed_at', 'created_at',
        ]

    def validate(self, attrs):
        request = self.context['request']
        seller = request.user.seller_profile
        # No pending payout check
        if SellerPayoutRequest.objects.filter(
            seller=seller, status='pending', deleted_at__isnull=True,
        ).exists():
            raise serializers.ValidationError(
                'You already have a pending payout request.'
            )
        return attrs

    def create(self, validated_data):
        seller = self.context['request'].user.seller_profile
        validated_data['seller'] = seller
        # Snapshot current payment details
        if validated_data['method'] == 'bank':
            validated_data['account_details_snapshot'] = seller.get_bank_details() or {}
        else:
            validated_data['account_details_snapshot'] = {
                'method': seller.mobile_banking_method,
                'number': seller.get_mobile_number(),
            }
        return super().create(validated_data)


# =============================================================================
# DASHBOARD
# =============================================================================

class SellerDashboardSerializer(serializers.Serializer):
    """Seller dashboard stats."""

    business_name = serializers.CharField()
    status = serializers.CharField()
    commission_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    is_student_seller = serializers.BooleanField()
    store_name = serializers.CharField(allow_null=True)
    store_status = serializers.CharField(allow_null=True)
    total_sales_count = serializers.IntegerField()
    rating_avg = serializers.DecimalField(max_digits=3, decimal_places=2)
    review_count = serializers.IntegerField()
    badges = SellerBadgeSerializer(many=True)
    pending_payouts = serializers.IntegerField()
