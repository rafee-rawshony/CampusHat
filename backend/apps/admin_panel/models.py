"""
Admin Panel Models.

Role-based permissions, admin action logging, and notifications.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TimestampMixin, UUIDMixin


# =============================================================================
# ROLE & PERMISSION
# =============================================================================

class Role(UUIDMixin, TimestampMixin):
    """Platform role: super_admin, moderator, finance_admin, support."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.name


class Permission(UUIDMixin):
    """Granular permission codename scoped to a module."""

    codename = models.CharField(max_length=100, unique=True)
    module = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'permissions'

    def __str__(self):
        return f'{self.module}.{self.codename}'


class RolePermission(UUIDMixin):
    """Join table linking roles to permissions."""

    role = models.ForeignKey(
        Role, on_delete=models.CASCADE,
        related_name='role_permissions', db_index=True,
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE,
        related_name='role_permissions', db_index=True,
    )
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('role', 'permission')

    def __str__(self):
        return f'{self.role.name} → {self.permission.codename}'


class UserRole(UUIDMixin):
    """Assigns a role to a user. Users can have multiple roles."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='user_roles', db_index=True,
    )
    role = models.ForeignKey(
        Role, on_delete=models.CASCADE,
        related_name='user_roles', db_index=True,
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='roles_assigned',
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_roles'
        unique_together = ('user', 'role')

    def __str__(self):
        return f'{self.user.email} → {self.role.name}'


# =============================================================================
# ADMIN ACTION LOG
# =============================================================================

class AdminActionLog(UUIDMixin):
    """Audit trail for admin actions."""

    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='admin_actions', db_index=True,
    )
    action = models.CharField(max_length=100, db_index=True)
    module = models.CharField(max_length=50, db_index=True)
    resource_type = models.CharField(max_length=50, blank=True, null=True)
    resource_id = models.UUIDField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'admin_action_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.admin_user} — {self.action} ({self.module})'

    @classmethod
    def log(cls, admin_user, action, module, resource_type=None,
            resource_id=None, description=None, request=None):
        """Create an audit log entry."""
        ip_address = None
        if request:
            ip_address = (
                request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
                or request.META.get('REMOTE_ADDR')
            )
        return cls.objects.create(
            admin_user=admin_user,
            action=action,
            module=module,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            ip_address=ip_address,
        )


# =============================================================================
# NOTIFICATION
# =============================================================================

class Notification(UUIDMixin, TimestampMixin):
    """Platform notification for users."""

    TYPE_CHOICES = [
        ('order', 'Order'),
        ('refund', 'Refund'),
        ('verification', 'Verification'),
        ('marketplace', 'Marketplace'),
        ('seller', 'Seller'),
        ('delivery', 'Delivery'),
        ('payout', 'Payout'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications', db_index=True,
    )
    notification_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, db_index=True,
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    action_url = models.CharField(max_length=500, blank=True, null=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]

    def __str__(self):
        return f'{self.title} → {self.user.email}'

    @classmethod
    def create_notification(cls, user, notification_type, title,
                            message, action_url=None):
        """Create and return a notification."""
        return cls.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
        )
