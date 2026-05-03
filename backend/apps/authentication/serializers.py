"""
Authentication Serializers.

Handles user registration, login, profile management, and password changes.
All password handling uses Django's built-in hashing.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import models
from rest_framework import serializers
from apps.universities.models import University
from core.validators import validate_document_file

from .models import EmailVerificationToken, User


# =============================================================================
# REGISTRATION
# =============================================================================

class UserRegistrationSerializer(serializers.Serializer):
    """
    Validates registration data and creates a new user with hashed password.
    Generates an email verification token after successful creation.
    """

    university_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text='UUID of the university the user belongs to (optional for general users).',
    )
    email = serializers.EmailField(
        help_text='Email address for login.',
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text='Password (min 8 characters, not entirely numeric).',
    )
    full_name = serializers.CharField(
        max_length=200,
        help_text='Full name of the user.',
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text='Phone number (optional).',
    )

    def validate_university_id(self, value):
        """Ensure the university exists and is active (if provided)."""
        if not value:
            return None
        try:
            University.objects.get(id=value, is_active=True)
        except University.DoesNotExist:
            raise serializers.ValidationError(
                'University not found or is not active.'
            )
        return value

    def validate_email(self, value):
        """Ensure the email is not already registered."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'A user with this email already exists.'
            )
        return value.lower()

    def validate_password(self, value):
        """Run Django's built-in password validators."""
        validate_password(value)
        return value

    def create(self, validated_data):
        university = None
        university_id = validated_data.get('university_id')
        if university_id:
            university = University.objects.get(id=university_id)

        phone = validated_data.get('phone') or None

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            university=university,
            phone=phone,
        )
        return user


# =============================================================================
# LOGIN
# =============================================================================

class UserLoginSerializer(serializers.Serializer):
    """
    Validates login credentials and returns JWT tokens with user data.
    Checks that the user is active and has verified their email.
    """

    email = serializers.EmailField(
        help_text='Registered email address.',
    )
    password = serializers.CharField(
        write_only=True,
        help_text='Account password.',
    )

    def validate(self, attrs):
        email = attrs.get('email', '').lower()
        password = attrs.get('password')

        # Authenticate
        user = authenticate(
            request=self.context.get('request'),
            email=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                {'non_field_errors': ['Invalid email or password.']}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {'non_field_errors': ['This account has been deactivated.']}
            )

        if not user.is_email_verified:
            raise serializers.ValidationError(
                {'non_field_errors': ['Please verify your email before logging in.']},
                code='EMAIL_NOT_VERIFIED'
            )

        return {'user': user}


# =============================================================================
# PROFILE SERIALIZERS
# =============================================================================

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Read-only public profile serializer.
    Exposes minimal info visible to other users.
    """

    university_name = serializers.CharField(
        source='university.name', read_only=True, default=None,
    )
    university_short_name = serializers.CharField(
        source='university.short_name', read_only=True, default=None,
    )

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'profile_picture', 'role',
            'university_name', 'university_short_name',
            'reputation_score', 'created_at',
        ]
        read_only_fields = fields


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Full profile serializer for the authenticated user viewing their own profile.
    """

    university_id = serializers.SerializerMethodField()
    university_name = serializers.CharField(
        source='university.name', read_only=True, default=None,
    )
    verification_status = serializers.SerializerMethodField()
    verification_rejection_reason = serializers.SerializerMethodField()
    seller_application_status = serializers.SerializerMethodField()
    is_profile_complete = serializers.BooleanField(read_only=True)
    profile_completion_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'university_email',
            'full_name', 'first_name', 'last_name',
            'phone', 'birthday', 'gender', 'profile_picture',
            'role', 'university_id', 'university_name',
            'is_email_verified', 'is_phone_verified',
            'reputation_score', 'verification_status',
            'verification_rejection_reason', 'seller_application_status',
            'is_profile_complete', 'profile_completion_percent',
            'last_login', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_university_id(self, obj):
        return str(obj.university_id) if obj.university_id else None

    def get_verification_status(self, obj):
        from .models import UserVerification
        v = (
            UserVerification.objects
            .filter(user=obj, deleted_at__isnull=True)
            .order_by('-created_at')
            .values_list('status', flat=True)
            .first()
        )
        return v

    def get_verification_rejection_reason(self, obj):
        from .models import UserVerification
        v = (
            UserVerification.objects
            .filter(user=obj, deleted_at__isnull=True, status='rejected')
            .order_by('-created_at')
            .values_list('rejection_reason', flat=True)
            .first()
        )
        return v

    def get_seller_application_status(self, obj):
        from apps.sellers.models import SellerProfile
        return (
            SellerProfile.objects
            .filter(user=obj, deleted_at__isnull=True)
            .order_by('-created_at')
            .values_list('status', flat=True)
            .first()
        )


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating own profile.

    Editable fields: name (first/last/full), phone, birthday, gender,
    profile_picture, and university_email. Login email is intentionally
    NOT here — it changes through the dedicated email-change flow with
    verification (see RequestEmailChangeView).
    """

    class Meta:
        model = User
        fields = [
            'full_name', 'first_name', 'last_name',
            'phone', 'birthday', 'gender', 'profile_picture',
            'university_email',
        ]

    def validate_phone(self, value):
        """Ensure phone number is unique if provided."""
        if value:
            existing = User.objects.filter(phone=value).exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError(
                    'This phone number is already in use.'
                )
        return value

    def validate_university_email(self, value):
        """Empty string -> None. Reject duplicates and clashes with login emails."""
        if not value:
            return None
        value = value.lower().strip()
        # Cannot reuse another user's login email or university_email.
        clash = User.objects.filter(
            models.Q(email__iexact=value) | models.Q(university_email__iexact=value)
        ).exclude(id=self.instance.id)
        if clash.exists():
            raise serializers.ValidationError(
                'This email is already in use by another account.'
            )
        return value

    def update(self, instance, validated_data):
        # Keep full_name in sync with first_name + last_name when both are set.
        first = validated_data.get('first_name', instance.first_name)
        last = validated_data.get('last_name', instance.last_name)
        if first and last and 'full_name' not in validated_data:
            validated_data['full_name'] = f'{first.strip()} {last.strip()}'
        return super().update(instance, validated_data)


# =============================================================================
# EMAIL CHANGE
# =============================================================================

class RequestEmailChangeSerializer(serializers.Serializer):
    """
    Body for POST /auth/me/email/request-change/.

    The user has to re-prove identity by entering their current password
    so that a stolen access token alone can't take over the account.
    """

    new_email = serializers.EmailField()
    current_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_email(self, value):
        value = value.lower().strip()
        user = self.context['request'].user
        if value == (user.email or '').lower():
            raise serializers.ValidationError(
                'This is already your current email address.'
            )
        # Block if the new email belongs to a different account already.
        from .models import User as _User
        clash = _User.objects.filter(email__iexact=value).exclude(id=user.id)
        if clash.exists():
            raise serializers.ValidationError(
                'This email is already in use by another account.'
            )
        return value


class ConfirmEmailChangeSerializer(serializers.Serializer):
    """Body for POST /auth/me/email/confirm-change/."""

    token = serializers.CharField(max_length=128)


# =============================================================================
# PASSWORD CHANGE
# =============================================================================

class ChangePasswordSerializer(serializers.Serializer):
    """
    Validates old password and sets new one with Django validators.
    """

    old_password = serializers.CharField(
        write_only=True,
        help_text='Current password.',
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text='New password (min 8 characters).',
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context['request'].user)
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


# =============================================================================
# FORGOT / RESET PASSWORD
# =============================================================================

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text='Registered email address.')


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text='Registered email address.')
    otp = serializers.RegexField(
        regex=r'^\d{6}$',
        error_messages={'invalid': 'OTP must be 6 digits.'},
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text='New password (min 8 characters).',
    )

    def validate_new_password(self, value):
        validate_password(value)
        return value
