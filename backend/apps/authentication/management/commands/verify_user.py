"""
Manual user verification command — for support / dev / staging only.

Use cases:
    - A real user reports they can't find the verification email; support
      verifies them after manual identity check.
    - Local dev where Mailpit isn't reachable for some reason.
    - Seeding test fixtures.

Usage:
    python manage.py verify_user <email>           # verify one user
    python manage.py verify_user --all-pending     # verify everyone unverified

This is deliberately a CLI command (not an HTTP endpoint) so it requires
shell access to the server — auditable in shell history and impossible to
trigger from the public API.
"""

from django.core.management.base import BaseCommand, CommandError

from apps.authentication.models import User


class Command(BaseCommand):
    help = 'Mark one or more user accounts as email-verified.'

    def add_arguments(self, parser):
        parser.add_argument(
            'email', nargs='?', default=None,
            help='Email address of the user to verify.',
        )
        parser.add_argument(
            '--all-pending', action='store_true',
            help='Verify every user whose is_email_verified is False.',
        )

    def handle(self, *args, **options):
        if options['all_pending']:
            qs = User.objects.filter(is_email_verified=False, is_active=True)
            count = qs.count()
            if count == 0:
                self.stdout.write(self.style.SUCCESS('No unverified users found.'))
                return
            qs.update(is_email_verified=True)
            self.stdout.write(self.style.SUCCESS(
                f'Verified {count} previously unverified user(s).'
            ))
            return

        email = options['email']
        if not email:
            raise CommandError(
                'Provide an email address or use --all-pending. '
                'See `python manage.py verify_user --help`.'
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise CommandError(f'No user found with email {email!r}.')

        if user.is_email_verified:
            self.stdout.write(self.style.WARNING(
                f'{email} is already verified — nothing to do.'
            ))
            return

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        self.stdout.write(self.style.SUCCESS(f'Verified {email}.'))
