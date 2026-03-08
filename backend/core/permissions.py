"""
CampusHat Custom DRF Permissions.

Reusable permission classes for controlling access across the platform.
These are used in views via `permission_classes = [IsVerifiedStudent]`.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsVerifiedStudent(BasePermission):
    """
    Allow access only to users whose student_id or faculty_id
    verification has been approved.
    """

    message = 'You must be a verified student to perform this action.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'role', None) not in ('student', 'faculty'):
            return False
        # Check for approved verification via UserVerification model
        from apps.authentication.models import UserVerification
        return UserVerification.objects.filter(
            user=user,
            verification_type__in=['student_id', 'faculty_id'],
            status='approved',
        ).exists()


class IsApprovedSeller(BasePermission):
    """Must have seller role AND approved seller profile"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin': return True
        from apps.sellers.models import SellerProfile
        return SellerProfile.objects.filter(
            user=request.user, status='approved').exists()


class IsAdminOrModerator(BasePermission):
    """
    Allow access only to admin or moderator users.
    """

    message = 'This action requires admin or moderator privileges.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, 'role', None) in ('admin', 'moderator')


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: allow the object owner or an admin.

    The view's model must have a field that references the user (default: 'user').
    Override `owner_field` in the view to change the lookup field name.
    """

    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Admin always has access
        if getattr(user, 'role', None) == 'admin':
            return True

        # Check ownership via the configured field
        owner_field = getattr(view, 'owner_field', 'user')
        owner = getattr(obj, owner_field, None)

        if owner is None:
            return False

        # Handle both direct user reference and FK ID
        if hasattr(owner, 'pk'):
            return owner.pk == user.pk
        return owner == user.pk


class ReadOnly(BasePermission):
    """
    Allow read-only access (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class HasPermission(BasePermission):
    """
    Check role-based permission via the admin_panel models.

    Usage:
        permission_classes = [HasPermission('approve_seller')]

    Admin role (user.role == 'admin') bypasses ALL permission checks.
    """

    def __init__(self, codename):
        self.codename = codename

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

# Admin role bypasses all permission checks
        if getattr(user, 'role', None) == 'admin':
            return True

        # Check role-based permissions from database
        from apps.admin_panel.models import RolePermission, UserRole
        user_roles = UserRole.objects.filter(user=user)
        return RolePermission.objects.filter(
            role__in=user_roles.values('role'),
            permission__codename=self.codename,
        ).exists()


class IsVerifiedForMarketplace(BasePermission):
    """
    Allows marketplace posting, chatting, and seeing contact info.
    Requires: verified student OR verified faculty OR approved seller OR admin.
    Normal users: DENIED.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin': return True
        
        from apps.sellers.models import SellerProfile
        if request.user.role == 'seller':
            return SellerProfile.objects.filter(
                user=request.user, status='approved').exists()
                
        from apps.authentication.models import UserVerification
        if request.user.role in ['student', 'faculty']:
            return UserVerification.objects.filter(
                user=request.user,
                verification_type__in=['student_id', 'faculty_id'],
                status='approved'
            ).exists()
        return False  # normal_user and moderator: no marketplace access


class IsNormalUserOrAbove(BasePermission):
    """Any authenticated user (normal_user, student, faculty, seller, admin)"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class CanBuyFromMall(BasePermission):
    """Normal user and above can buy. Guests cannot."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsAdminOnly(BasePermission):
    """Strictly admin — no moderators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsSellerModerator(BasePermission):
    """Has permission codename: approve_seller"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin': return True
        from apps.admin_panel.models import RolePermission
        return RolePermission.objects.filter(
            role__user_roles__user=request.user,
            permission__codename='approve_seller'
        ).exists()


class IsVerificationModerator(BasePermission):
    """Has permission codename: review_verifications"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin': return True
        from apps.admin_panel.models import RolePermission
        return RolePermission.objects.filter(
            role__user_roles__user=request.user,
            permission__codename='review_verifications'
        ).exists()

class IsMarketplaceModerator(BasePermission):
    """Has permission codename: moderate_marketplace"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated: return False
        if request.user.role == 'admin': return True
        from apps.admin_panel.models import RolePermission
        return RolePermission.objects.filter(
            role__user_roles__user=request.user,
            permission__codename='moderate_marketplace'
        ).exists()


class IsMarketplacePostOwner(BasePermission):
    """
    Object-level permission: allow only the owner of a marketplace listing.
    """
    message = 'You do not own this listing.'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        # Admin bypass
        if request.user.role == 'admin':
            return True
        return obj.user == request.user

