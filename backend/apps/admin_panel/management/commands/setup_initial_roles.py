"""
Management command: setup_initial_roles.

Creates default roles and permissions, assigns permissions to each role.
Optionally creates a superuser from DJANGO_SUPERUSER_EMAIL env var.
"""

import os
from django.core.management.base import BaseCommand
from apps.admin_panel.models import Permission, Role, RolePermission


# Permission definitions: (codename, module, description)
PERMISSIONS = [
    ('approve_seller', 'sellers', 'Approve seller applications'),
    ('reject_seller', 'sellers', 'Reject seller applications'),
    ('suspend_seller', 'sellers', 'Suspend sellers'),
    ('approve_store', 'sellers', 'Approve store applications'),
    ('reject_store', 'sellers', 'Reject store applications'),
    ('process_refund', 'refunds', 'Process approved refunds'),
    ('approve_refund', 'refunds', 'Approve refund requests'),
    ('reject_refund', 'refunds', 'Reject refund requests'),
    ('manage_coupons', 'coupons', 'Manage platform coupons'),
    ('moderate_marketplace', 'marketplace', 'Moderate marketplace ads'),
    ('manage_delivery', 'delivery', 'Manage delivery partners and updates'),
    ('view_financial_reports', 'finance', 'View financial reports'),
    ('process_payout', 'finance', 'Process seller payouts'),
    ('manage_universities', 'universities', 'Manage university records'),
    ('manage_users', 'users', 'Manage user accounts'),
    ('manage_roles', 'roles', 'Manage roles and permissions'),
    ('broadcast_notification', 'notifications', 'Send broadcast notifications'),
    ('approve_verification', 'verification', 'Approve student verifications'),
    ('reject_verification', 'verification', 'Reject student verifications'),
]

# Role → permission codenames mapping
ROLE_PERMISSIONS = {
    'super_admin': [p[0] for p in PERMISSIONS],  # ALL permissions
    'moderator': [
        'approve_seller', 'reject_seller', 'approve_store', 'reject_store',
        'moderate_marketplace', 'approve_verification', 'reject_verification',
    ],
    'finance_admin': [
        'process_refund', 'approve_refund', 'reject_refund',
        'view_financial_reports', 'process_payout', 'manage_coupons',
    ],
    'support': [
        'approve_verification', 'reject_verification',
        'moderate_marketplace',
    ],
}


class Command(BaseCommand):
    help = 'Create default roles and permissions for the admin panel.'

    def handle(self, *args, **options):
        # Create permissions
        perm_objects = {}
        for codename, module, description in PERMISSIONS:
            perm, created = Permission.objects.get_or_create(
                codename=codename,
                defaults={'module': module, 'description': description},
            )
            perm_objects[codename] = perm
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  Permission: {codename} [{status}]')

        # Create roles and assign permissions
        for role_name, perm_codenames in ROLE_PERMISSIONS.items():
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': f'{role_name.replace("_", " ").title()} role'},
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'\n  Role: {role_name} [{status}]')

            for codename in perm_codenames:
                perm = perm_objects.get(codename)
                if perm:
                    rp, rp_created = RolePermission.objects.get_or_create(
                        role=role, permission=perm,
                    )
                    if rp_created:
                        self.stdout.write(f'    + {codename}')

        # Create superuser from env var
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
        if email:
            from apps.authentication.models import User
            password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': 'Super Admin',
                    'role': 'admin',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_email_verified': True,
                },
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'\n  Superuser created: {email}')
            else:
                self.stdout.write(f'\n  Superuser exists: {email}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {len(PERMISSIONS)} permissions, {len(ROLE_PERMISSIONS)} roles.',
        ))
