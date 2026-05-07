"""Admin panel Django admin configuration."""
from django.contrib import admin
from .models import (
    AdminActionLog, Notification, Permission,
    Role, RolePermission, UserRole,
)


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 0


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    inlines = [RolePermissionInline]


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('codename', 'module', 'description')
    list_filter = ('module',)
    search_fields = ('codename',)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_by', 'assigned_at')
    list_filter = ('role',)


@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = ('admin_user', 'action', 'module', 'resource_type', 'created_at')
    list_filter = ('module', 'action')
    readonly_fields = ('admin_user', 'action', 'module', 'resource_type',
                       'resource_id', 'description', 'ip_address', 'created_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('title', 'message')
