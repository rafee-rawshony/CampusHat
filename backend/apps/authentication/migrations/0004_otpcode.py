"""
Migration: add OTPCode model for passwordless login.
"""

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_change_default_role_to_normal_user'),
    ]

    operations = [
        migrations.CreateModel(
            name='OTPCode',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text='Unique identifier for this record.',
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    'identifier',
                    models.CharField(
                        db_index=True,
                        help_text='Email address or phone number this OTP was sent to.',
                        max_length=255,
                    ),
                ),
                (
                    'code_hash',
                    models.CharField(
                        help_text='SHA-256 hash of the 6-digit OTP (plaintext is never stored).',
                        max_length=64,
                    ),
                ),
                (
                    'purpose',
                    models.CharField(
                        choices=[('login', 'Login')],
                        default='login',
                        help_text='Why this OTP was issued.',
                        max_length=20,
                    ),
                ),
                (
                    'expires_at',
                    models.DateTimeField(
                        db_index=True,
                        help_text='When this OTP expires.',
                    ),
                ),
                (
                    'used',
                    models.BooleanField(
                        default=False,
                        help_text='Whether this OTP has been consumed.',
                    ),
                ),
                (
                    'attempts',
                    models.PositiveSmallIntegerField(
                        default=0,
                        help_text='Number of failed verification attempts on this code.',
                    ),
                ),
                (
                    'created_at',
                    models.DateTimeField(
                        auto_now_add=True,
                        help_text='When this OTP was created.',
                    ),
                ),
            ],
            options={
                'verbose_name': 'OTP Code',
                'verbose_name_plural': 'OTP Codes',
                'db_table': 'auth_otp_codes',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='otpcode',
            index=models.Index(
                fields=['identifier', 'used'],
                name='idx_otp_identifier_used',
            ),
        ),
    ]
