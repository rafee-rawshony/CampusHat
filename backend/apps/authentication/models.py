"""
CampusHat Custom User Model.

Minimal stub for Phase 01 to satisfy AUTH_USER_MODEL.
Full implementation (email login, roles, verification) in Phase 02.
"""

import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model for CampusHat.

    Uses UUID primary key and adds role field.
    Extended in Phase 02 with email auth, verification, etc.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('seller', 'Seller'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student',
    )

    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'auth_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.username
