"""
CampusHat Custom User Model & Related Auth Models.

Implements a fully custom User extending AbstractBaseUser with:
- Email-based authentication (no username)
- Role system: student, faculty, seller, moderator, admin
- University scoping via FK
- Soft delete support
- Email verification via time-limited tokens
- User verification system (Phase 03)
- User session tracking (Phase 03)
- User addresses (Phase 03)
"""

import hashlib
import secrets

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models, transaction
from django.utils import timezone

from core.models import TimestampMixin, UUIDMixin


# =============================================================================
# CUSTOM USER MANAGER
# =============================================================================

class UserManager(BaseUserManager):
    """
    Custom manager for the User model.

    Provides create_user() and create_superuser() methods that work
    with email as the identifier instead of username.
    """

    def create_user(self, email, full_name, university=None, password=None, **extra_fields):
        """
        Create and return a regular user with an email and password.
        """
        if not email:
            raise ValueError('Users must have an email address.')
        if not full_name:
            raise ValueError('Users must have a full name.')

        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)

        user = self.model(
            email=email,
            full_name=full_name,
            university=university,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        """
        Create and return a superuser with admin role and all permissions.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_email_verified', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(
            email=email,
            full_name=full_name,
            password=password,
            **extra_fields,
        )


# =============================================================================
# CUSTOM USER MODEL
# =============================================================================

class User(AbstractBaseUser, PermissionsMixin, UUIDMixin, TimestampMixin):
    """
    Custom User model for CampusHat.

    Uses email as the unique identifier for authentication instead of
    a username. Every user is scoped to a university and assigned a role.
    """

    ROLE_CHOICES = [
        ('normal_user', 'Normal User'),
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('seller', 'Seller'),
        ('seller_mod', 'Seller Moderator'),
        ('marketplace_mod', 'Marketplace Moderator'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
    ]

    university = models.ForeignKey(
        'universities.University',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        db_index=True,
        help_text='University this user belongs to.',
    )
    email = models.EmailField(
        max_length=255,
        unique=True,
        help_text='Email address used for login.',
    )
    phone = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text='Phone number.',
    )
    full_name = models.CharField(
        max_length=200,
        help_text='Full name of the user (auto-synced from first_name + last_name when both are set).',
    )
    first_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='First name (Daraz-style profile).',
    )
    last_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Last name (Daraz-style profile).',
    )
    birthday = models.DateField(
        blank=True,
        null=True,
        help_text='Date of birth (optional).',
    )
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        blank=True,
        null=True,
        help_text='Gender (optional).',
    )
    profile_picture = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL to the user profile picture.',
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='normal_user',
        db_index=True,
        help_text='System role determining access rights.',
    )
    is_email_verified = models.BooleanField(
        default=False,
        help_text='Whether the user has verified their email.',
    )
    is_phone_verified = models.BooleanField(
        default=False,
        help_text='Whether the user has verified their phone.',
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Whether this account is active.',
    )
    is_staff = models.BooleanField(
        default=False,
        help_text='Whether the user can access the admin site.',
    )
    reputation_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text='User reputation score.',
    )
    last_login = models.DateTimeField(
        blank=True,
        null=True,
        help_text='Last login timestamp.',
    )
    deleted_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        help_text='Soft deletion timestamp. NULL means active.',
    )

    objects = UserManager()
    all_objects = models.Manager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'auth_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email'], name='idx_user_email'),
            models.Index(
                fields=['university', 'role', 'is_active'],
                name='idx_user_univ_role_active',
            ),
        ]

    def __str__(self):
        return f'{self.full_name} ({self.email})'

    # ── Properties ──────────────────────────────────────────────────

    @property
    def display_name(self):
        """Return the full name as the display name."""
        return self.full_name

    @property
    def is_verified_student(self):
        """Check if user has an approved student_id or faculty_id verification."""
        return self.role in ('student', 'faculty') and (
            self.verifications.filter(
                verification_type__in=['student_id', 'faculty_id'],
                status='approved',
            ).exists()
        )

    @property
    def is_approved_seller(self):
        """Check if user has an approved seller profile."""
        seller_profile = getattr(self, 'seller_profile', None)
        if seller_profile is None:
            return False
        return getattr(seller_profile, 'is_approved', False)

    @property
    def is_profile_complete(self):
        """
        Profile is complete when the user has filled out their basic
        identity fields AND has at least one saved delivery address.
        Required for buying products from the Mall.
        """
        has_basics = bool(
            self.first_name
            and self.last_name
            and self.phone
            and self.birthday
            and self.gender
        )
        if not has_basics:
            return False
        return self.addresses.filter(deleted_at__isnull=True).exists()

    @property
    def profile_completion_percent(self):
        """Return % completion (0-100) of profile fields. Helps drive UI nudges."""
        fields = [
            bool(self.first_name),
            bool(self.last_name),
            bool(self.phone),
            bool(self.birthday),
            bool(self.gender),
            bool(self.profile_picture),
            self.addresses.filter(deleted_at__isnull=True).exists(),
        ]
        filled = sum(1 for f in fields if f)
        return int((filled / len(fields)) * 100)

    # ── Soft Delete ─────────────────────────────────────────────────

    def soft_delete(self):
        """Mark this user as soft-deleted."""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active'])
        self._cascade_soft_delete()

    def restore(self):
        """Restore a soft-deleted user."""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active'])

    def _cascade_soft_delete(self):
        from apps.marketplace.models import MarketplaceProduct
        from apps.authentication.models import UserSession

        # Hide all active marketplace ads by this user
        MarketplaceProduct.objects.filter(
            user=self,
            status='active',
            deleted_at__isnull=True
        ).update(
            status='hidden',
            is_hidden_by_user=True
        )
        # Revoke all sessions (force logout)
        UserSession.objects.filter(
            user=self, revoked=False
        ).update(revoked=True)


# =============================================================================
# EMAIL VERIFICATION TOKEN
# =============================================================================

class EmailVerificationToken(UUIDMixin):
    """
    Time-limited token for email verification.

    Generated during registration and sent to the user via email.
    Tokens expire after 24 hours and can only be used once.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='verification_tokens',
        help_text='User this token belongs to.',
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        help_text='Secure random token string.',
    )
    expires_at = models.DateTimeField(
        help_text='Expiration time for this token.',
    )
    is_used = models.BooleanField(
        default=False,
        help_text='Whether this token has been consumed.',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When this token was created.',
    )

    class Meta:
        db_table = 'auth_email_verification_tokens'
        verbose_name = 'Email Verification Token'
        verbose_name_plural = 'Email Verification Tokens'
        ordering = ['-created_at']

    def __str__(self):
        return f'Token for {self.user.email} (used={self.is_used})'

    @property
    def is_expired(self):
        """Check whether the token has passed its expiration time."""
        return timezone.now() >= self.expires_at

    @property
    def is_valid(self):
        """Check whether the token can still be used."""
        return not self.is_used and not self.is_expired

    @classmethod
    def create_for_user(cls, user):
        """
        Generate a new verification token for the given user.

        Invalidates any previous unused tokens for the same user.
        Returns the newly created token instance.
        """
        # Invalidate existing unused tokens
        cls.objects.filter(user=user, is_used=False).update(is_used=True)

        token = cls.objects.create(
            user=user,
            token=secrets.token_urlsafe(48),
            expires_at=timezone.now() + timezone.timedelta(hours=24),
        )
        return token


# =============================================================================
# OTP CODE (Passwordless Login)
# =============================================================================

class OTPCode(UUIDMixin):
    """
    Short-lived one-time passcode for passwordless login.

    OTP codes are 6-digit numeric, stored as SHA-256 hashes (never plaintext),
    valid for 10 minutes, and limited to 5 verification attempts. Sending a
    new code invalidates previous unused codes for the same identifier.
    """

    PURPOSE_CHOICES = [
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
    ]

    MAX_ATTEMPTS = 5
    EXPIRY_MINUTES = 10

    identifier = models.CharField(
        max_length=255,
        db_index=True,
        help_text='Email address or phone number this OTP was sent to.',
    )
    code_hash = models.CharField(
        max_length=64,
        help_text='SHA-256 hash of the 6-digit OTP (plaintext is never stored).',
    )
    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        default='login',
        help_text='Why this OTP was issued.',
    )
    expires_at = models.DateTimeField(
        db_index=True,
        help_text='When this OTP expires.',
    )
    used = models.BooleanField(
        default=False,
        help_text='Whether this OTP has been consumed.',
    )
    attempts = models.PositiveSmallIntegerField(
        default=0,
        help_text='Number of failed verification attempts on this code.',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When this OTP was created.',
    )

    class Meta:
        db_table = 'auth_otp_codes'
        verbose_name = 'OTP Code'
        verbose_name_plural = 'OTP Codes'
        ordering = ['-created_at']
        indexes = [
            models.Index(
                fields=['identifier', 'used'],
                name='idx_otp_identifier_used',
            ),
        ]

    def __str__(self):
        return f'OTP for {self.identifier} (used={self.used})'

    @property
    def is_expired(self):
        """True if the OTP has passed its expiry time."""
        return timezone.now() >= self.expires_at

    @property
    def is_valid(self):
        """True only if the OTP can still be consumed."""
        return (
            not self.used
            and not self.is_expired
            and self.attempts < self.MAX_ATTEMPTS
        )


# =============================================================================
# USER VERIFICATION (Phase 03)
# =============================================================================

class UserVerification(UUIDMixin, TimestampMixin):
    """
    Tracks identity verification for users.

    Supports multiple verification types (student_id, faculty_id, email, phone).
    Each type follows a status workflow: pending → approved | rejected | expired.
    Rejected verifications can be resubmitted (pending again).
    """

    VERIFICATION_TYPE_CHOICES = [
        ('student_id', 'Student ID'),
        ('faculty_id', 'Faculty ID'),
        ('email', 'Email'),
        ('phone', 'Phone'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    TIER_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='verifications',
        db_index=True,
        help_text='User requesting verification.',
    )
    verification_type = models.CharField(
        max_length=20,
        choices=VERIFICATION_TYPE_CHOICES,
        help_text='Type of verification being submitted.',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text='Current verification status.',
    )
    submitted_document_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text='S3 private bucket path for the submitted document.',
    )
    student_id_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Student or faculty ID number.',
    )
    enrollment_cert_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text='S3 private bucket path for enrollment certificate.',
    )
    verification_tier = models.CharField(
        max_length=10,
        choices=TIER_CHOICES,
        default='bronze',
        help_text='Verification tier level.',
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_verifications',
        help_text='Admin who reviewed this verification.',
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text='Reason for rejection, shown to the user.',
    )
    valid_until = models.DateField(
        blank=True,
        null=True,
        help_text='Expiration date for this verification (annual renewal).',
    )
    deleted_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        help_text='Soft deletion timestamp.',
    )

    class Meta:
        db_table = 'auth_user_verifications'
        verbose_name = 'User Verification'
        verbose_name_plural = 'User Verifications'
        ordering = ['-created_at']
        unique_together = [('user', 'verification_type')]
        indexes = [
            models.Index(
                fields=['user', 'status'],
                name='idx_verification_user_status',
            ),
            models.Index(
                fields=['user', 'verification_type'],
                name='idx_verification_user_type',
            ),
        ]

    def __str__(self):
        return f'{self.user.email} — {self.verification_type} ({self.status})'

    @property
    def is_expired(self):
        """Check if verification has passed its valid_until date."""
        if self.valid_until is None:
            return False
        return timezone.now().date() > self.valid_until

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])


# =============================================================================
# USER SESSION (Phase 03)
# =============================================================================

class UserSession(UUIDMixin, TimestampMixin):
    """
    Tracks active JWT sessions for a user.

    Stores a SHA-256 hash of the JWT token so sessions can be individually
    revoked without storing the raw token. Supports force-logout via
    revoke_all_for_user().
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sessions',
        db_index=True,
        help_text='User who owns this session.',
    )
    token_hash = models.CharField(
        max_length=255,
        unique=True,
        help_text='SHA-256 hash of the JWT access token.',
    )
    device_info = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        help_text='User-Agent or device description.',
    )
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text='IP address the session was created from.',
    )
    expires_at = models.DateTimeField(
        db_index=True,
        help_text='When this session token expires.',
    )
    revoked = models.BooleanField(
        default=False,
        help_text='Whether this session has been revoked.',
    )

    class Meta:
        db_table = 'auth_user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-created_at']

    def __str__(self):
        status = 'revoked' if self.revoked else 'active'
        return f'Session for {self.user.email} ({status})'

    @classmethod
    def create_from_request(cls, user, token, request):
        """
        Create a new session record from a login request.

        Args:
            user: The authenticated User instance.
            token: The raw JWT access token string.
            request: The DRF request object.

        Returns:
            The created UserSession instance.
        """
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        device_info = request.META.get('HTTP_USER_AGENT', '')[:300]
        ip_address = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR')
        )
        # Default expiry: 15 minutes from now (same as access token)
        from django.conf import settings as django_settings
        from datetime import timedelta
        access_lifetime = getattr(
            django_settings, 'SIMPLE_JWT', {}
        ).get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=15))
        expires_at = timezone.now() + access_lifetime

        return cls.objects.create(
            user=user,
            token_hash=token_hash,
            device_info=device_info,
            ip_address=ip_address,
            expires_at=expires_at,
        )

    @classmethod
    def revoke_all_for_user(cls, user_id):
        """Revoke all active sessions for a given user (force logout)."""
        return cls.objects.filter(
            user_id=user_id,
            revoked=False,
        ).update(revoked=True)


# =============================================================================
# USER ADDRESS (Phase 03)
# =============================================================================

class UserAddress(UUIDMixin, TimestampMixin):
    """
    Stores user addresses for delivery or identification.

    Supports multiple addresses per user with a single default.
    Setting is_default=True atomically unsets any other default address.
    """

    LABEL_CHOICES = [
        ('home', 'Home'),
        ('hostel', 'Hostel'),
        ('office', 'Office'),
        ('campus', 'Campus'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='addresses',
        db_index=True,
        help_text='User who owns this address.',
    )
    label = models.CharField(
        max_length=20,
        choices=LABEL_CHOICES,
        default='home',
        help_text='Label for this address.',
    )
    recipient_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Name of the person receiving deliveries at this address.",
    )
    recipient_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Recipient phone number for delivery contact.',
    )
    address_line1 = models.TextField(
        help_text='Primary address line (street, road, house number).',
    )
    address_line2 = models.TextField(
        blank=True,
        null=True,
        help_text='Secondary address line (optional).',
    )
    landmark = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='Nearby landmark for easier delivery (optional).',
    )
    campus_building = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Campus building name (if applicable).',
    )
    room_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Room number (if applicable).',
    )
    division = models.CharField(
        max_length=80,
        blank=True,
        null=True,
        help_text='Division name (e.g. Dhaka, Chittagong).',
    )
    district = models.CharField(
        max_length=80,
        help_text='District name.',
    )
    city = models.CharField(
        max_length=100,
        help_text='City / Region.',
    )
    area = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Area / Upazila / Thana.',
    )
    postal_code = models.CharField(
        max_length=10,
        help_text='Postal code.',
    )
    additional_notes = models.TextField(
        blank=True,
        null=True,
        help_text='Additional delivery instructions (optional).',
    )
    is_default = models.BooleanField(
        default=False,
        help_text='Whether this is the default address.',
    )
    deleted_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        help_text='Soft deletion timestamp.',
    )

    class Meta:
        db_table = 'auth_user_addresses'
        verbose_name = 'User Address'
        verbose_name_plural = 'User Addresses'
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f'{self.label} — {self.user.email}'

    def save(self, *args, **kwargs):
        """Override save to ensure only one default address per user."""
        if self.is_default:
            with transaction.atomic():
                UserAddress.objects.filter(
                    user=self.user,
                    is_default=True,
                ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])

