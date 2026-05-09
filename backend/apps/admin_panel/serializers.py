"""Admin panel serializers."""

from rest_framework import serializers
from .models import (
    AdminActionLog, Notification, Permission,
    Role, RolePermission, UserRole,
)


# ── Role & Permission ────────────────────────────────────────────

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'codename', 'module', 'description']
        read_only_fields = ['id']


class RolePermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer(read_only=True)

    class Meta:
        model = RolePermission
        fields = ['id', 'permission', 'granted_at']
        read_only_fields = ['id', 'granted_at']


class RoleSerializer(serializers.ModelSerializer):
    role_permissions = RolePermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'role_permissions', 'created_at']
        read_only_fields = ['id', 'created_at']


class RoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['name', 'description']


class UserRoleSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    assigned_by_email = serializers.CharField(
        source='assigned_by.email', read_only=True, default=None,
    )

    class Meta:
        model = UserRole
        fields = ['id', 'user', 'role', 'role_name', 'assigned_by_email', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']


# ── Admin Action Log ─────────────────────────────────────────────

class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin_user.email', read_only=True, default=None)

    class Meta:
        model = AdminActionLog
        fields = [
            'id', 'admin_user', 'admin_email', 'action', 'module',
            'resource_type', 'resource_id', 'description',
            'ip_address', 'created_at',
        ]
        read_only_fields = fields


# ── Notification ─────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'action_url', 'is_read', 'read_at', 'created_at',
        ]
        read_only_fields = fields


class BroadcastNotificationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    target_role = serializers.CharField(
        max_length=20, required=False, allow_blank=True,
        help_text='Filter users by role field. Blank = all users.',
    )
    action_url = serializers.CharField(max_length=500, required=False, allow_blank=True)


# ── User Management ──────────────────────────────────────────────

class AdminUserListSerializer(serializers.Serializer):
    """Lightweight user listing for admin."""
    id = serializers.UUIDField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    is_email_verified = serializers.BooleanField()
    university = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()

    def get_university(self, obj):
        if not obj.university_id or not obj.university:
            return None
        return {
            'id': str(obj.university.id),
            'name': obj.university.name,
            'short_name': obj.university.short_name,
        }


class AdminUserDetailSerializer(serializers.Serializer):
    """Full user detail for admin."""
    id = serializers.UUIDField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    phone = serializers.CharField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    is_email_verified = serializers.BooleanField()
    university_name = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    last_login = serializers.DateTimeField()
    user_roles = serializers.SerializerMethodField()

    def get_university_name(self, obj):
        return getattr(obj.university, 'name', None) if obj.university_id else None

    def get_user_roles(self, obj):
        return UserRoleSerializer(
            obj.user_roles.select_related('role', 'assigned_by'), many=True,
        ).data
