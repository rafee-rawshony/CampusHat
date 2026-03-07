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
    """
    Allow access only to users who have an approved seller profile.
    """

    message = 'You must be an approved seller to perform this action.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Check if the user has a seller_profile and it's approved
        seller_profile = getattr(user, 'seller_profile', None)
        if seller_profile is None:
            return False
        return getattr(seller_profile, 'is_approved', False)


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
