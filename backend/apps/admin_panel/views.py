"""
Admin Panel Views.

Dashboard stats, user management, role management,
notification views, and admin broadcast.
"""

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import CampusHatPagination
from core.permissions import IsAdminOnly, IsAdminOrModerator

from .models import (
    AdminActionLog, Notification, Permission,
    Role, RolePermission, UserRole,
)
from .serializers import (
    AdminActionLogSerializer,
    AdminUserDetailSerializer,
    AdminUserListSerializer,
    BroadcastNotificationSerializer,
    NotificationSerializer,
    PermissionSerializer,
    RoleCreateSerializer,
    RoleSerializer,
    UserRoleSerializer,
)


# ═══════════════════════════════════════════════════════════════════
# DASHBOARD STATS
# ═══════════════════════════════════════════════════════════════════

class AdminDashboardView(APIView):
    """GET /api/v1/admin/dashboard/ — aggregate stats."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from apps.authentication.models import User, UserVerification
        from apps.marketplace.models import MarketplaceProduct
        from apps.orders.models import Order
        from apps.refunds.models import Refund
        from apps.sellers.models import SellerProfile, Store
        from apps.wallet.models import Wallet

        today = timezone.now().date()

        # User stats
        total_users = User.objects.count()
        verified_students = UserVerification.objects.filter(
            status='approved',
            verification_type__in=['student_id', 'faculty_id'],
        ).values('user').distinct().count()

        # Seller stats
        total_sellers = SellerProfile.objects.count()
        active_stores = Store.objects.filter(is_active=True).count()

        # Marketplace stats
        total_marketplace_ads = MarketplaceProduct.objects.count()

        # Pending approvals
        pending_seller_approvals = SellerProfile.objects.filter(
            is_approved=False, is_rejected=False,
        ).count()
        pending_store_approvals = Store.objects.filter(
            is_active=False,
        ).count()
        pending_ad_approvals = MarketplaceProduct.objects.filter(
            status='pending',
        ).count()
        pending_verifications = UserVerification.objects.filter(
            status='pending',
        ).count()

        pending_approvals_count = (
            pending_seller_approvals + pending_store_approvals
            + pending_ad_approvals + pending_verifications
        )

        # Order stats
        total_orders_today = Order.objects.filter(
            created_at__date=today,
        ).count()
        total_revenue_today = Order.objects.filter(
            created_at__date=today,
            payment_status='paid',
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Refund stats
        pending_refunds = Refund.objects.filter(
            status__in=['pending', 'under_review', 'approved'],
        ).count()

        # Platform wallet
        try:
            platform_wallet = Wallet.get_platform_wallet()
            platform_wallet_balance = platform_wallet.balance
        except Exception:
            platform_wallet_balance = 0

        return Response({
            'success': True,
            'data': {
                'total_users': total_users,
                'verified_students': verified_students,
                'total_sellers': total_sellers,
                'active_stores': active_stores,
                'total_marketplace_ads': total_marketplace_ads,
                'pending_approvals_count': pending_approvals_count,
                'pending_seller_approvals': pending_seller_approvals,
                'pending_store_approvals': pending_store_approvals,
                'pending_ad_approvals': pending_ad_approvals,
                'pending_verifications': pending_verifications,
                'total_orders_today': total_orders_today,
                'total_revenue_today': total_revenue_today,
                'pending_refunds': pending_refunds,
                'platform_wallet_balance': platform_wallet_balance,
            },
        })


# ═══════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

class AdminUserListView(APIView):
    """GET /api/v1/admin/users/ — filter by role, university, status."""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        from apps.authentication.models import User

        users = User.objects.select_related('university').all()

        # Filters
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)

        university = request.query_params.get('university')
        if university:
            users = users.filter(university_id=university)

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            users = users.filter(is_active=is_active.lower() == 'true')

        search = request.query_params.get('search')
        if search:
            users = users.filter(
                Q(email__icontains=search)
                | Q(full_name__icontains=search)
            )

        users = users.order_by('-created_at')
        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(users, request)
        if page is not None:
            return paginator.get_paginated_response(
                AdminUserListSerializer(page, many=True).data,
            )
        return Response({
            'success': True, 'data': AdminUserListSerializer(users, many=True).data,
        })


class AdminUserDetailView(APIView):
    """GET /api/v1/admin/users/{id}/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request, user_id):
        from apps.authentication.models import User
        try:
            user = User.objects.select_related('university').prefetch_related(
                'user_roles__role', 'user_roles__assigned_by',
            ).get(id=user_id)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'User not found.'}, status=404)

        return Response({
            'success': True, 'data': AdminUserDetailSerializer(user).data,
        })


class AdminUserSuspendView(APIView):
    """PATCH /api/v1/admin/users/{id}/suspend/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def patch(self, request, user_id):
        from apps.authentication.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'User not found.'}, status=404)

        user.is_active = False
        user.save(update_fields=['is_active'])

        AdminActionLog.log(
            request.user, 'suspend_user', 'users',
            resource_type='User', resource_id=user.id,
            description=f'Suspended user {user.email}',
            request=request,
        )
        return Response({'success': True, 'message': f'User {user.email} suspended.'})


class AdminUserActivateView(APIView):
    """PATCH /api/v1/admin/users/{id}/activate/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def patch(self, request, user_id):
        from apps.authentication.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'User not found.'}, status=404)

        user.is_active = True
        user.save(update_fields=['is_active'])

        AdminActionLog.log(
            request.user, 'activate_user', 'users',
            resource_type='User', resource_id=user.id,
            description=f'Activated user {user.email}',
            request=request,
        )
        return Response({'success': True, 'message': f'User {user.email} activated.'})


class AdminUserChangeRoleView(APIView):
    """PATCH /api/v1/admin/users/{id}/change-role/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def patch(self, request, user_id):
        from apps.authentication.models import User

        new_role = request.data.get('role')
        if not new_role:
            return Response({'success': False, 'message': 'role is required.'}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'User not found.'}, status=404)

        old_role = user.role
        user.role = new_role
        user.save(update_fields=['role'])

        AdminActionLog.log(
            request.user, 'change_user_role', 'users',
            resource_type='User', resource_id=user.id,
            description=f'Changed role from {old_role} to {new_role}',
            request=request,
        )
        return Response({
            'success': True,
            'message': f'User role changed from {old_role} to {new_role}.',
        })


class AdminAssignRoleView(APIView):
    """POST /api/v1/admin/users/{id}/assign-role/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def post(self, request, user_id):
        from apps.authentication.models import User
        role_id = request.data.get('role_id')
        if not role_id:
            return Response({'success': False, 'message': 'role_id is required.'}, status=400)

        try:
            user = User.objects.get(id=user_id)
            role = Role.objects.get(id=role_id)
        except (User.DoesNotExist, Role.DoesNotExist):
            return Response({'success': False, 'message': 'User or Role not found.'}, status=404)

        user_role, created = UserRole.objects.get_or_create(
            user=user, role=role,
            defaults={'assigned_by': request.user},
        )

        if not created:
            return Response({'success': False, 'message': 'Role already assigned.'}, status=409)

        AdminActionLog.log(
            request.user, 'assign_role', 'users',
            resource_type='UserRole', resource_id=user_role.id,
            description=f'Assigned role {role.name} to {user.email}',
            request=request,
        )
        return Response({
            'success': True, 'message': f'Role {role.name} assigned to {user.email}.',
            'data': UserRoleSerializer(user_role).data,
        }, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════
# ROLE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

class AdminRoleListView(APIView):
    """GET/POST /api/v1/admin/roles/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        roles = Role.objects.prefetch_related(
            'role_permissions__permission',
        ).all()
        return Response({
            'success': True, 'data': RoleSerializer(roles, many=True).data,
        })

    def post(self, request):
        serializer = RoleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()

        AdminActionLog.log(
            request.user, 'create_role', 'roles',
            resource_type='Role', resource_id=role.id,
            description=f'Created role: {role.name}',
            request=request,
        )
        return Response({
            'success': True, 'message': f'Role {role.name} created.',
            'data': RoleSerializer(role).data,
        }, status=status.HTTP_201_CREATED)


class AdminRoleDetailView(APIView):
    """GET/PATCH /api/v1/admin/roles/{id}/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request, role_id):
        try:
            role = Role.objects.prefetch_related(
                'role_permissions__permission',
            ).get(id=role_id)
        except Role.DoesNotExist:
            return Response({'success': False, 'message': 'Role not found.'}, status=404)

        return Response({'success': True, 'data': RoleSerializer(role).data})

    def patch(self, request, role_id):
        try:
            role = Role.objects.get(id=role_id)
        except Role.DoesNotExist:
            return Response({'success': False, 'message': 'Role not found.'}, status=404)

        serializer = RoleCreateSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 'message': 'Role updated.',
            'data': RoleSerializer(role).data,
        })


class AdminRoleAddPermissionView(APIView):
    """POST /api/v1/admin/roles/{id}/add-permission/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def post(self, request, role_id):
        permission_id = request.data.get('permission_id')
        if not permission_id:
            return Response({'success': False, 'message': 'permission_id required.'}, status=400)

        try:
            role = Role.objects.get(id=role_id)
            perm = Permission.objects.get(id=permission_id)
        except (Role.DoesNotExist, Permission.DoesNotExist):
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        rp, created = RolePermission.objects.get_or_create(role=role, permission=perm)
        if not created:
            return Response({'success': False, 'message': 'Already assigned.'}, status=409)

        AdminActionLog.log(
            request.user, 'add_permission_to_role', 'roles',
            resource_type='RolePermission', resource_id=rp.id,
            description=f'Added {perm.codename} to role {role.name}',
            request=request,
        )
        return Response({'success': True, 'message': f'Permission {perm.codename} added.'})


class AdminRoleRemovePermissionView(APIView):
    """DELETE /api/v1/admin/roles/{id}/remove-permission/{perm_id}/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def delete(self, request, role_id, perm_id):
        deleted, _ = RolePermission.objects.filter(
            role_id=role_id, permission_id=perm_id,
        ).delete()

        if not deleted:
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        AdminActionLog.log(
            request.user, 'remove_permission_from_role', 'roles',
            resource_type='RolePermission',
            description=f'Removed permission {perm_id} from role {role_id}',
            request=request,
        )
        return Response({'success': True, 'message': 'Permission removed.'})


# ═══════════════════════════════════════════════════════════════════
# PLATFORM WALLET (Admin)
# ═══════════════════════════════════════════════════════════════════

class AdminPlatformBalanceView(APIView):
    """GET /api/v1/admin/wallet/platform-balance/"""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from apps.wallet.models import Wallet
        try:
            wallet = Wallet.get_platform_wallet()
            wallet.refresh_balance()
        except Exception:
            return Response({
                'success': True,
                'data': {'balance': 0, 'locked_balance': 0},
            })

        return Response({
            'success': True,
            'data': {
                'balance': wallet.balance,
                'locked_balance': wallet.locked_balance,
            },
        })


class AdminPlatformTransactionsView(APIView):
    """GET /api/v1/admin/wallet/transactions/"""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from apps.wallet.models import Wallet, WalletTransaction
        from apps.wallet.serializers import WalletTransactionSerializer

        try:
            wallet = Wallet.get_platform_wallet()
        except Exception:
            return Response({'success': True, 'data': []})

        txns = WalletTransaction.objects.filter(wallet=wallet).order_by('-created_at')
        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(txns, request)
        if page is not None:
            return paginator.get_paginated_response(
                WalletTransactionSerializer(page, many=True).data,
            )
        return Response({
            'success': True,
            'data': WalletTransactionSerializer(txns, many=True).data,
        })


# ═══════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════

class NotificationListView(APIView):
    """GET /api/v1/notifications/ — user's own notifications."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(notifications, request)
        if page is not None:
            return paginator.get_paginated_response(
                NotificationSerializer(page, many=True).data,
            )
        return Response({
            'success': True,
            'data': NotificationSerializer(notifications, many=True).data,
        })


class NotificationUnreadCountView(APIView):
    """GET /api/v1/notifications/unread-count/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False,
        ).count()
        return Response({'success': True, 'data': {'unread_count': count}})


class NotificationMarkReadView(APIView):
    """POST /api/v1/notifications/{id}/mark-read/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, user=request.user,
            )
        except Notification.DoesNotExist:
            return Response({'success': False, 'message': 'Not found.'}, status=404)

        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at', 'updated_at'])

        return Response({'success': True, 'message': 'Notification marked as read.'})


class NotificationMarkAllReadView(APIView):
    """POST /api/v1/notifications/mark-all-read/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False,
        ).update(is_read=True, read_at=timezone.now())

        return Response({
            'success': True,
            'message': f'{count} notifications marked as read.',
        })


class AdminBroadcastNotificationView(APIView):
    """POST /api/v1/admin/notifications/broadcast/"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = BroadcastNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.admin_panel.tasks import broadcast_notification
        broadcast_notification.delay(
            title=serializer.validated_data['title'],
            message=serializer.validated_data['message'],
            target_role=serializer.validated_data.get('target_role', ''),
            action_url=serializer.validated_data.get('action_url', ''),
        )

        AdminActionLog.log(
            request.user, 'broadcast_notification', 'notifications',
            description=f'Broadcast: {serializer.validated_data["title"]}',
            request=request,
        )

        return Response({
            'success': True,
            'message': 'Broadcast notification queued.',
        })


# ═══════════════════════════════════════════════════════════════════
# ADMIN ACTION LOG
# ═══════════════════════════════════════════════════════════════════

class AdminActionLogListView(APIView):
    """GET /api/v1/admin/action-logs/"""

    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        logs = AdminActionLog.objects.select_related('admin_user').all()

        module = request.query_params.get('module')
        if module:
            logs = logs.filter(module=module)

        action = request.query_params.get('action')
        if action:
            logs = logs.filter(action=action)

        paginator = CampusHatPagination()
        page = paginator.paginate_queryset(logs, request)
        if page is not None:
            return paginator.get_paginated_response(
                AdminActionLogSerializer(page, many=True).data,
            )
        return Response({
            'success': True,
            'data': AdminActionLogSerializer(logs, many=True).data,
        })
