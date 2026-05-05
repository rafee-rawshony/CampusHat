"""
University Admin Configuration.
"""

from django.contrib import admin

from .models import InstitutionRequest, University


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    """Admin interface for the University model."""

    list_display = (
        'short_name', 'name', 'system_id', 'division',
        'district', 'is_active', 'sso_enabled', 'created_at',
    )
    list_filter = ('division', 'is_active', 'sso_enabled')
    search_fields = ('name', 'short_name', 'district', 'system_id')
    prepopulated_fields = {'slug': ('short_name',)}
    readonly_fields = ('id', 'system_id', 'slug', 'created_at', 'updated_at')
    ordering = ('name',)

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'short_name', 'slug', 'system_id'),
        }),
        ('Location', {
            'fields': ('division', 'district', 'postal_code', 'full_address'),
        }),
        ('Details', {
            'fields': ('email_domain', 'short_description', 'logo_url', 'is_active'),
        }),
        ('SSO Configuration', {
            'fields': ('sso_enabled', 'sso_provider', 'sso_domain'),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(InstitutionRequest)
class InstitutionRequestAdmin(admin.ModelAdmin):
    """Admin interface for student-submitted institution add requests."""

    list_display = (
        'name', 'division', 'district', 'status',
        'requester_email', 'created_at', 'reviewed_at',
    )
    list_filter = ('status', 'division')
    search_fields = ('name', 'short_name', 'district', 'requester_email')
    readonly_fields = (
        'id', 'created_at', 'updated_at',
        'reviewed_by', 'reviewed_at', 'created_university',
    )
    ordering = ('-created_at',)

    fieldsets = (
        ('Submitted Info', {
            'fields': (
                'name', 'short_name', 'division', 'district',
                'full_address', 'website', 'requester_email', 'note',
            ),
        }),
        ('Review', {
            'fields': (
                'status', 'review_note',
                'reviewed_by', 'reviewed_at', 'created_university',
            ),
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
