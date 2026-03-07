"""
Authentication Admin Configuration.

Custom admin interfaces for User and EmailVerificationToken models.
Since we use AbstractBaseUser (not AbstractUser), we define custom
fieldsets instead of inheriting from UserAdmin.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import EmailVerificationToken, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin for the User model.

    Uses email as the display/search field since there is no username.
    """

    list_display = (
        'email', 'full_name', 'role', 'university',
        'is_email_verified', 'is_active', 'is_staff', 'created_at',
    )
    list_filter = ('role', 'is_email_verified', 'is_active', 'is_staff', 'university')
    search_fields = ('email', 'full_name', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_login', 'deleted_at')

    # Override fieldsets since we don't use username/first_name/last_name
    fieldsets = (
        (None, {
            'fields': ('email', 'password'),
        }),
        ('Personal Info', {
            'fields': ('full_name', 'phone', 'profile_picture'),
        }),
        ('University & Role', {
            'fields': ('university', 'role', 'reputation_score'),
        }),
        ('Verification', {
            'fields': ('is_email_verified', 'is_phone_verified'),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Metadata', {
            'fields': ('id', 'last_login', 'created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'full_name', 'university', 'role',
                'password1', 'password2',
            ),
        }),
    )

    def get_queryset(self, request):
        """Include soft-deleted users in admin."""
        return User.all_objects.select_related('university').all()


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    """Admin interface for email verification tokens."""

    list_display = ('user', 'token_preview', 'is_used', 'is_expired', 'expires_at', 'created_at')
    list_filter = ('is_used',)
    search_fields = ('user__email', 'token')
    readonly_fields = ('id', 'token', 'created_at')
    raw_id_fields = ('user',)

    def token_preview(self, obj):
        """Show first 12 chars of the token."""
        return f'{obj.token[:12]}...' if obj.token else '-'
    token_preview.short_description = 'Token'

    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True
    is_expired.short_description = 'Expired?'
