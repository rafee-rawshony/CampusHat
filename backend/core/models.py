"""
CampusHat Core Models.

Base model mixins that provide consistent behavior across all apps:
- UUIDMixin: UUID primary keys
- TimestampMixin: created_at / updated_at
- SoftDeleteMixin: soft deletion with manager filtering
- BaseModel: combines all three — inherit from this for all models
"""

import uuid

from django.db import models
from django.utils import timezone


# =============================================================================
# MANAGERS
# =============================================================================

class SoftDeleteManager(models.Manager):
    """
    Custom manager that excludes soft-deleted records by default.

    Use `all_with_deleted()` to include soft-deleted records, or
    `deleted_only()` to get only soft-deleted records.
    """

    def get_queryset(self):
        """Return only non-deleted records."""
        return super().get_queryset().filter(deleted_at__isnull=True)

    def all_with_deleted(self):
        """Return all records including soft-deleted ones."""
        return super().get_queryset()

    def deleted_only(self):
        """Return only soft-deleted records."""
        return super().get_queryset().filter(deleted_at__isnull=False)


# =============================================================================
# MIXINS
# =============================================================================

class UUIDMixin(models.Model):
    """
    Mixin that replaces the default auto-incrementing ID with a UUID.

    Provides globally unique, non-sequential primary keys which are
    better for distributed systems and don't leak record counts.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Unique identifier for this record.',
    )

    class Meta:
        abstract = True


class TimestampMixin(models.Model):
    """
    Mixin that adds created_at and updated_at timestamps.

    These fields are automatically managed by Django:
    - created_at is set once when the record is first created.
    - updated_at is refreshed every time the record is saved.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this record was created.',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='When this record was last updated.',
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


class SoftDeleteMixin(models.Model):
    """
    Mixin that provides soft-delete functionality.

    Instead of permanently deleting records, sets a `deleted_at` timestamp.
    The custom SoftDeleteManager filters these out from normal queries.

    Usage:
        instance.soft_delete()       # Marks as deleted
        instance.restore()           # Restores a soft-deleted record
        Model.objects.all()          # Excludes deleted (default)
        Model.all_objects.all()      # Includes deleted
    """

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        default=None,
        db_index=True,
        help_text='When this record was soft-deleted. NULL means active.',
    )

    # Default manager excludes soft-deleted records
    objects = SoftDeleteManager()

    # Access all records including soft-deleted
    all_objects = models.Manager()

    class Meta:
        abstract = True

    @property
    def is_deleted(self) -> bool:
        """Check whether this record has been soft-deleted."""
        return self.deleted_at is not None

    def soft_delete(self):
        """Mark this record as deleted without removing it from the database."""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        """Restore a soft-deleted record."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])


# =============================================================================
# BASE MODEL
# =============================================================================

class BaseModel(UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Abstract base model for all CampusHat models.

    Combines UUID primary keys, automatic timestamps, and soft-delete
    functionality into a single base class. All app models should
    inherit from this class.

    Example:
        class Product(BaseModel):
            name = models.CharField(max_length=255)
            price = models.DecimalField(max_digits=10, decimal_places=2)

            class Meta(BaseModel.Meta):
                db_table = 'mall_products'
    """

    class Meta(TimestampMixin.Meta):
        abstract = True
