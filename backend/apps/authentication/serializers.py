"""
Authentication Serializers.

Handles user registration, login, profile management, and password changes.
All password handling uses Django's built-in hashing.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.universities.models import University

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
        help_text='UUID of the university the user belongs to.',
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

    def validate_university_id(self, value):
        """Ensure the university exists and is active."""
        try:
            university = University.objects.get(id=value, is_active=True)
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
        """Create the user with hashed password and generate a verification token."""
        university = University.objects.get(id=validated_data['university_id'])

        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            university=university,
            role='student',
        )

        # Generate email verification token
        EmailVerificationToken.create_for_user(user)

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
                {'non_field_errors': ['Please verify your email before logging in.']}
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'university': {
                    'id': str(user.university.id),
                    'name': user.university.name,
                    'short_name': user.university.short_name,
                } if user.university else None,
                'is_email_verified': user.is_email_verified,
                'profile_picture': user.profile_picture,
            },
        }


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

    university = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'profile_picture',
            'role', 'university', 'is_email_verified', 'is_phone_verified',
            'reputation_score', 'last_login', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_university(self, obj):
        if obj.university:
            return {
                'id': str(obj.university.id),
                'name': obj.university.name,
                'short_name': obj.university.short_name,
                'slug': obj.university.slug,
            }
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating own profile: name, phone, profile picture.
    """

    class Meta:
        model = User
        fields = ['full_name', 'phone', 'profile_picture']

    def validate_phone(self, value):
        """Ensure phone number is unique if provided."""
        if value:
            existing = User.objects.filter(phone=value).exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError(
                    'This phone number is already in use.'
                )
        return value


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
