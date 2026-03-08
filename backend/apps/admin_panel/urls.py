"""Admin Panel URL Configuration."""

from django.urls import path

from .views import (
    AdminActionLogListView,
    AdminAssignRoleView,
    AdminBroadcastNotificationView,
    AdminDashboardView,
    AdminPlatformBalanceView,
    AdminPlatformTransactionsView,
    AdminRoleAddPermissionView,
    AdminRoleDetailView,
    AdminRoleListView,
    AdminRoleRemovePermissionView,
    AdminUserActivateView,
    AdminUserChangeRoleView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUserSuspendView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
    AdminRestoreView,
)

app_name = 'admin_panel'

# ── Notification routes (authenticated users) ──
notification_urlpatterns = [
    path('', NotificationListView.as_view(), name='list'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='unread-count'),
    path('<uuid:notification_id>/mark-read/', NotificationMarkReadView.as_view(), name='mark-read'),
    path('mark-all-read/', NotificationMarkAllReadView.as_view(), name='mark-all-read'),
]

# ── Admin dashboard ──
admin_dashboard_urlpatterns = [
    path('', AdminDashboardView.as_view(), name='dashboard'),
    path('restore/<str:resource_type>/<uuid:pk>/', AdminRestoreView.as_view(), name='restore'),
]

# ── Admin user management ──
admin_user_urlpatterns = [
    path('', AdminUserListView.as_view(), name='user-list'),
    path('<uuid:user_id>/', AdminUserDetailView.as_view(), name='user-detail'),
    path('<uuid:user_id>/suspend/', AdminUserSuspendView.as_view(), name='user-suspend'),
    path('<uuid:user_id>/activate/', AdminUserActivateView.as_view(), name='user-activate'),
    path('<uuid:user_id>/change-role/', AdminUserChangeRoleView.as_view(), name='user-change-role'),
    path('<uuid:user_id>/assign-role/', AdminAssignRoleView.as_view(), name='user-assign-role'),
]

# ── Admin role management ──
admin_role_urlpatterns = [
    path('', AdminRoleListView.as_view(), name='role-list'),
    path('<uuid:role_id>/', AdminRoleDetailView.as_view(), name='role-detail'),
    path('<uuid:role_id>/add-permission/', AdminRoleAddPermissionView.as_view(), name='role-add-perm'),
    path('<uuid:role_id>/remove-permission/<uuid:perm_id>/',
         AdminRoleRemovePermissionView.as_view(), name='role-remove-perm'),
]

# ── Admin wallet (platform) ──
admin_wallet_urlpatterns = [
    path('platform-balance/', AdminPlatformBalanceView.as_view(), name='platform-balance'),
    path('transactions/', AdminPlatformTransactionsView.as_view(), name='platform-txns'),
]

# ── Admin notifications ──
admin_notification_urlpatterns = [
    path('broadcast/', AdminBroadcastNotificationView.as_view(), name='broadcast'),
]

# ── Admin action logs ──
admin_log_urlpatterns = [
    path('', AdminActionLogListView.as_view(), name='log-list'),
]
