"""
CampusHat Custom User Model & Email Verification Token.

Implements a fully custom User extending AbstractBaseUser with:
- Email-based authentication (no username)
- Role system: student, faculty, seller, moderator, admin
- University scoping via FK
- Soft delete support
- Email verification via time-limited tokens
"""

import secrets

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
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
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('seller', 'Seller'),
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
        help_text='Full name of the user.',
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
        default='student',
        db_index=True,
        help_text='User role on the platform.',
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
        """Check if user is a student with approved verification."""
        return self.role == 'student' and self.is_email_verified

    @property
    def is_approved_seller(self):
        """Check if user has an approved seller profile."""
        seller_profile = getattr(self, 'seller_profile', None)
        if seller_profile is None:
            return False
        return getattr(seller_profile, 'is_approved', False)

    # ── Soft Delete ─────────────────────────────────────────────────

    def soft_delete(self):
        """Mark this user as soft-deleted."""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active'])

    def restore(self):
        """Restore a soft-deleted user."""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active'])


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
