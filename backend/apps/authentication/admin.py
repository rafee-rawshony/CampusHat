"""
Authentication Admin Configuration.

Custom admin interfaces for User, EmailVerificationToken,
UserVerification, UserSession, and UserAddress models.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    EmailVerificationToken,
    User,
    UserAddress,
    UserSession,
    UserVerification,
)


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


# =============================================================================
# PHASE 03: VERIFICATION, SESSION, ADDRESS
# =============================================================================

@admin.register(UserVerification)
class UserVerificationAdmin(admin.ModelAdmin):
    """Admin for user verification records."""

    list_display = (
        'user', 'verification_type', 'status',
        'attempt_number', 'is_duplicate_document',
        'verification_tier', 'reviewed_by', 'valid_until', 'created_at',
    )
    list_filter = (
        'status', 'verification_type', 'verification_tier',
        'is_duplicate_document',
    )
    search_fields = (
        'user__email', 'user__full_name', 'student_id_number',
        'document_hash', 'submission_ip',
    )
    readonly_fields = (
        'id', 'created_at', 'updated_at',
        'document_hash', 'cert_hash', 'is_duplicate_document',
        'submission_ip', 'attempt_number',
    )
    raw_id_fields = ('user', 'reviewed_by')
    ordering = ('-created_at',)

    fieldsets = (
        ('Identity', {
            'fields': (
                'id', 'user', 'verification_type', 'student_id_number',
            ),
        }),
        ('Documents', {
            'fields': (
                'submitted_document_url', 'enrollment_cert_url',
                'document_hash', 'cert_hash',
            ),
        }),
        ('Review', {
            'fields': (
                'status', 'verification_tier', 'reviewed_by',
                'rejection_reason', 'valid_until',
            ),
        }),
        ('Security & Audit', {
            'fields': (
                'is_duplicate_document', 'submission_ip', 'attempt_number',
            ),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
        }),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """Admin for user sessions."""

    list_display = (
        'user', 'device_info_short', 'ip_address',
        'revoked', 'expires_at', 'created_at',
    )
    list_filter = ('revoked',)
    search_fields = ('user__email', 'ip_address')
    readonly_fields = ('id', 'token_hash', 'created_at', 'updated_at')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)

    def device_info_short(self, obj):
        info = obj.device_info or ''
        return f'{info[:60]}...' if len(info) > 60 else info
    device_info_short.short_description = 'Device'


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    """Admin for user addresses."""

    list_display = (
        'user', 'label', 'district', 'city',
        'postal_code', 'is_default', 'created_at',
    )
    list_filter = ('is_default', 'district')
    search_fields = ('user__email', 'label', 'city', 'district')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)

