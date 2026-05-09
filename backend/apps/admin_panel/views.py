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
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

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
        from apps.mall.models import StoreProduct
        from apps.orders.models import Order
        from apps.refunds.models import Refund
        from apps.sellers.models import SellerProfile, Store
        from apps.wallet.models import Wallet
        from datetime import datetime, time, timedelta

        today = timezone.now().date()
        today_start = timezone.make_aware(datetime.combine(today, time.min))
        seven_days_ago = today_start - timedelta(days=7)
        fourteen_days_ago = today_start - timedelta(days=14)

        # ── Seller / Store stats ────────────────────────────────────────
        seller_stats = SellerProfile.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
        )
        store_stats = Store.objects.aggregate(
            active=Count('id', filter=Q(status='active')),
            pending=Count('id', filter=Q(status='under_review')),
        )

        # ── Marketplace stats + listing-type breakdown ──────────────────
        marketplace_stats = MarketplaceProduct.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            buy_sell=Count('id', filter=Q(post_type='sell')),
            rental=Count('id', filter=Q(post_type='rent')),
            service=Count('id', filter=Q(post_type='service')),
            food=Count('id', filter=Q(post_type='food')),
        )

        # ── Verification stats ──────────────────────────────────────────
        verification_stats = UserVerification.objects.aggregate(
            verified_students=Count(
                'user',
                filter=Q(
                    status='approved',
                    verification_type__in=['student_id', 'faculty_id'],
                ),
                distinct=True,
            ),
            pending=Count('id', filter=Q(status='pending')),
        )

        # ── Mall products ───────────────────────────────────────────────
        mall_products = StoreProduct.objects.filter(
            deleted_at__isnull=True, is_active=True,
        ).count()

        # ── Order stats: ALL-TIME + today + by status ───────────────────
        order_all = Order.objects.aggregate(
            total=Count('id'),
            total_revenue=Sum('total_amount', filter=Q(payment_status='paid')),
            delivered=Count('id', filter=Q(order_status='delivered')),
            pending=Count('id', filter=Q(order_status__in=['placed', 'confirmed', 'packed'])),
            cancelled=Count('id', filter=Q(order_status='cancelled')),
        )
        order_today = Order.objects.filter(created_at__gte=today_start).aggregate(
            total_today=Count('id'),
            revenue_today=Sum('total_amount', filter=Q(payment_status='paid')),
        )

        # ── Revenue trend (last 7 days vs previous 7 days) ─────────────
        rev_recent = Order.objects.filter(
            payment_status='paid',
            created_at__gte=seven_days_ago,
        ).aggregate(s=Sum('total_amount'))['s'] or 0
        rev_previous = Order.objects.filter(
            payment_status='paid',
            created_at__gte=fourteen_days_ago,
            created_at__lt=seven_days_ago,
        ).aggregate(s=Sum('total_amount'))['s'] or 0
        if rev_previous > 0:
            revenue_trend = round(((float(rev_recent) - float(rev_previous)) / float(rev_previous)) * 100, 1)
        else:
            revenue_trend = 100.0 if rev_recent > 0 else 0.0

        # ── User stats ─────────────────────────────────────────────────
        total_users = User.objects.count()
        new_users_today = User.objects.filter(created_at__gte=today_start).count()

        pending_refunds = Refund.objects.filter(
            status__in=['pending', 'under_review', 'approved'],
        ).count()

        pending_seller_approvals = seller_stats['pending']
        pending_store_approvals = store_stats['pending']
        pending_ad_approvals = marketplace_stats['pending']
        pending_verifications = verification_stats['pending']
        pending_approvals_count = (
            pending_seller_approvals + pending_store_approvals
            + pending_ad_approvals + pending_verifications
        )

        # Platform wallet
        try:
            platform_wallet = Wallet.get_platform_wallet()
            platform_wallet_balance = platform_wallet.balance
        except Exception:
            platform_wallet_balance = 0

        return Response({
            'success': True,
            'data': {
                # Primary KPIs (what the frontend MetricCards expect)
                'total_revenue': float(order_all['total_revenue'] or 0),
                'total_sellers': seller_stats['total'],
                'mall_products': mall_products,
                'marketplace_listings': marketplace_stats['total'],

                # Orders (all-time)
                'total_orders': order_all['total'] or 0,
                'delivered_orders': order_all['delivered'] or 0,
                'pending_orders': order_all['pending'] or 0,
                'cancelled_orders': order_all['cancelled'] or 0,

                # Today metrics
                'total_orders_today': order_today['total_today'] or 0,
                'total_revenue_today': float(order_today['revenue_today'] or 0),

                # Users
                'total_users': total_users,
                'new_users_today': new_users_today,
                'verified_students': verification_stats['verified_students'],

                # Trend
                'revenue_trend': revenue_trend,

                # Marketplace type breakdown
                'buy_listings': marketplace_stats['buy_sell'] or 0,
                'rental_listings': marketplace_stats['rental'] or 0,
                'service_listings': marketplace_stats['service'] or 0,
                'food_listings': marketplace_stats['food'] or 0,

                # Stores
                'active_stores': store_stats['active'],
                'total_marketplace_ads': marketplace_stats['total'],

                # Approvals
                'pending_approvals_count': pending_approvals_count,
                'pending_seller_approvals': pending_seller_approvals,
                'pending_store_approvals': pending_store_approvals,
                'pending_ad_approvals': pending_ad_approvals,
                'pending_verifications': pending_verifications,
                'pending_refunds': pending_refunds,
                'platform_wallet_balance': platform_wallet_balance,
            },
        })

    # Access all records including soft-deleted

from django.shortcuts import get_object_or_404

class AdminRestoreView(APIView):
    """POST /api/v1/admin/restore/{resource_type}/{pk}/"""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def post(self, request, resource_type, pk):
        from apps.sellers.models import SellerProfile, Store
        from apps.authentication.models import User
        
        MODEL_MAP = {
            'seller': SellerProfile,
            'store':  Store,
            'user':   User,
        }
        
        model = MODEL_MAP.get(resource_type)
        if not model:
            return Response({'error': 'Invalid resource type.'}, status=400)

        obj = get_object_or_404(model.all_objects, pk=pk)
        if not obj.is_deleted:
            return Response({'error': 'Record is not deleted.'}, status=400)

        obj.restore()
        return Response({'message': f'{resource_type} restored.'}, status=200)


class AdminMyPermissionsView(APIView):
    """GET /api/v1/admin/my-permissions/ — returns the current user's role permissions."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        # Single query with prefetch — avoids N+1 across roles → role_permissions → permission.
        user_roles = UserRole.objects.filter(
            user=request.user, is_active=True,
        ).prefetch_related('role__role_permissions__permission')
        all_perms = set()
        for ur in user_roles:
            for rp in ur.role.role_permissions.all():
                all_perms.add(rp.permission.codename)

        return Response({
            'success': True,
            'data': {
                'permissions': list(all_perms),
            },
        })


class AdminApprovalCountsView(APIView):
    """GET /api/v1/admin/approvals/counts/ — pending counts for approval tabs."""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from apps.authentication.models import UserVerification
        from apps.marketplace.models import MarketplaceProduct
        from apps.sellers.models import SellerProfile

        verifications = UserVerification.objects.filter(status='pending').count()
        sellers = SellerProfile.objects.filter(
            status='pending',
        ).count()
        marketplace = MarketplaceProduct.objects.filter(status='pending').count()

        return Response({
            'success': True,
            'data': {
                'verifications': verifications,
                'sellers': sellers,
                'marketplace': marketplace,
                'total': verifications + sellers + marketplace,
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

        is_email_verified = request.query_params.get('is_email_verified')
        if is_email_verified is not None:
            users = users.filter(is_email_verified=is_email_verified.lower() == 'true')

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

    @extend_schema(request=None)
    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False,
        ).count()
        return Response({'success': True, 'data': {'unread_count': count}})


class NotificationMarkReadView(APIView):
    """POST /api/v1/notifications/{id}/mark-read/"""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=None)
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

    @extend_schema(request=None)
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
