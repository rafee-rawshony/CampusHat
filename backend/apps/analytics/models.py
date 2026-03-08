"""
Analytics Models.

ProductView, SearchLog, ActivityLog, SellerDashboardStats.
"""

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import UUIDMixin


# =============================================================================
# PRODUCT VIEW TRACKING
# =============================================================================

class ProductView(UUIDMixin):
    """Tracks product views for mall and marketplace with dedup."""

    TYPE_CHOICES = [
        ('mall', 'Mall'),
        ('marketplace', 'Marketplace'),
    ]

    product_id = models.UUIDField(db_index=True)
    product_type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='product_views',
    )
    university = models.ForeignKey(
        'universities.University', on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    session_id = models.CharField(max_length=100, blank=True, null=True)
    viewed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'product_views'
        indexes = [
            models.Index(fields=['product_id', 'product_type', 'viewed_at']),
        ]

    def __str__(self):
        return f'{self.product_type}:{self.product_id} at {self.viewed_at}'

    @classmethod
    def record_view(cls, product_id, product_type, request):
        """Record a view with 1-hour dedup per session."""
        session_id = request.session.session_key or request.META.get(
            'HTTP_X_SESSION_ID', '',
        )
        user = request.user if request.user.is_authenticated else None
        university = getattr(user, 'university', None) if user else None

        if session_id:
            recent = cls.objects.filter(
                product_id=product_id,
                session_id=session_id,
                viewed_at__gte=timezone.now() - timedelta(hours=1),
            ).exists()
            if recent:
                return None

        return cls.objects.create(
            product_id=product_id,
            product_type=product_type,
            user=user,
            university=university,
            session_id=session_id,
        )


# =============================================================================
# SEARCH LOG
# =============================================================================

class SearchLog(UUIDMixin):
    """Tracks search queries for demand intelligence."""

    SCOPE_CHOICES = [
        ('mall', 'Mall'),
        ('marketplace', 'Marketplace'),
        ('all', 'All'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    university = models.ForeignKey(
        'universities.University', on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    search_scope = models.CharField(max_length=15, choices=SCOPE_CHOICES)
    query = models.CharField(max_length=300)
    result_count = models.IntegerField(default=0)
    searched_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'search_logs'
        indexes = [
            models.Index(fields=['university', 'searched_at']),
            models.Index(fields=['query']),
        ]

    def __str__(self):
        return f'"{self.query}" ({self.search_scope}) → {self.result_count}'


# =============================================================================
# ACTIVITY LOG
# =============================================================================

class ActivityLog(UUIDMixin):
    """Security and compliance audit log."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    action = models.CharField(max_length=100, db_index=True)
    module = models.CharField(max_length=50, db_index=True)
    resource_type = models.CharField(max_length=50, blank=True, null=True)
    resource_id = models.UUIDField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=300, blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'action', 'created_at']),
            models.Index(fields=['module', 'created_at']),
        ]

    def __str__(self):
        return f'{self.user} — {self.action} ({self.module})'


# =============================================================================
# SELLER DASHBOARD STATS (cached / precomputed)
# =============================================================================

class SellerDashboardStats(UUIDMixin):
    """Pre-computed seller stats, refreshed by Celery every 6 hours."""

    seller = models.OneToOneField(
        'sellers.SellerProfile', on_delete=models.CASCADE,
        related_name='dashboard_stats',
    )
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.IntegerField(default=0)
    completed_orders = models.IntegerField(default=0)
    pending_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    last_computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_dashboard_stats'

    def __str__(self):
        return f'Stats for {self.seller}'
