"""
Coupon, CouponUsage, FlashSale, FlashSaleProduct models.

Coupon types: percentage, fixed_amount, free_delivery.
FlashSale with countdown timer and per-user limits.
"""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import F
from django.utils import timezone

from core.models import BaseModel, UUIDMixin


# =============================================================================
# COUPON
# =============================================================================

class Coupon(BaseModel):
    """
    Discount coupon — store-scoped or platform-wide (store=NULL).

    Codes are stored UPPERCASE for case-insensitive matching.
    """

    TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed_amount', 'Fixed Amount'),
        ('free_delivery', 'Free Delivery'),
    ]

    store = models.ForeignKey(
        'sellers.Store', on_delete=models.CASCADE,
        null=True, blank=True, related_name='coupons',
        db_index=True,
        help_text='NULL = platform-wide coupon (admin only).',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='coupons_created',
    )
    code = models.CharField(
        max_length=50, unique=True, db_index=True,
        help_text='Stored as UPPERCASE for case-insensitive matching.',
    )
    coupon_type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'),
    )
    maximum_discount_cap = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
    )
    total_usage_limit = models.IntegerField(blank=True, null=True)
    per_user_limit = models.IntegerField(default=1)
    used_count = models.IntegerField(default=0)
    valid_from = models.DateTimeField()
    expires_at = models.DateTimeField(db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta(BaseModel.Meta):
        db_table = 'coupons'

    def __str__(self):
        return f'{self.code} ({self.coupon_type})'

    def save(self, *args, **kwargs):
        """Store code as UPPERCASE."""
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    def validate_for_user(self, user, cart_total, delivery_fee=Decimal('0.00')):
        """
        Validate whether this coupon is usable for a given user and cart.

        Returns:
            tuple: (is_valid, discount_amount, error_message)
        """
        now = timezone.now()

        if not self.is_active:
            return False, Decimal('0.00'), 'Coupon is inactive.'

        if now < self.valid_from:
            return False, Decimal('0.00'), 'Coupon is not yet valid.'

        if now > self.expires_at:
            return False, Decimal('0.00'), 'Coupon has expired.'

        if cart_total < self.minimum_order_amount:
            return (
                False, Decimal('0.00'),
                f'Minimum order amount is {self.minimum_order_amount} BDT.',
            )

        if self.total_usage_limit and self.used_count >= self.total_usage_limit:
            return False, Decimal('0.00'), 'Coupon usage limit reached.'

        # Per-user limit
        user_usage = CouponUsage.objects.filter(
            coupon=self, user=user,
        ).count()
        if user_usage >= self.per_user_limit:
            return False, Decimal('0.00'), 'You have already used this coupon.'

        # Calculate discount
        if self.coupon_type == 'percentage':
            discount = (cart_total * self.discount_value / 100).quantize(
                Decimal('0.01'),
            )
            if self.maximum_discount_cap:
                discount = min(discount, self.maximum_discount_cap)
        elif self.coupon_type == 'fixed_amount':
            discount = self.discount_value
        elif self.coupon_type == 'free_delivery':
            discount = delivery_fee
        else:
            discount = Decimal('0.00')

        return True, discount, None

    def increment_usage(self):
        """Atomically increment used_count with F() expression."""
        Coupon.objects.filter(pk=self.pk).update(
            used_count=F('used_count') + 1,
        )


# =============================================================================
# COUPON USAGE
# =============================================================================

class CouponUsage(UUIDMixin):
    """Tracks each coupon use to enforce per-user limits."""

    coupon = models.ForeignKey(
        Coupon, on_delete=models.CASCADE,
        related_name='usages', db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='coupon_usages', db_index=True,
    )
    order = models.ForeignKey(
        'orders.Order', on_delete=models.CASCADE,
        related_name='coupon_usages',
    )
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coupon_usages'
        unique_together = ('coupon', 'user', 'order')

    def __str__(self):
        return f'{self.coupon.code} used by {self.user.email}'


# =============================================================================
# FLASH SALE
# =============================================================================

class FlashSale(BaseModel):
    """Time-limited flash sale with countdown."""

    store = models.ForeignKey(
        'sellers.Store', on_delete=models.CASCADE,
        related_name='flash_sales', db_index=True,
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField(db_index=True)
    max_items_per_user = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = 'flash_sales'

    def __str__(self):
        return self.title

    @property
    def is_currently_active(self):
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at


class FlashSaleProduct(UUIDMixin):
    """Product included in a flash sale."""

    flash_sale = models.ForeignKey(
        FlashSale, on_delete=models.CASCADE,
        related_name='products', db_index=True,
    )
    product = models.ForeignKey(
        'mall.StoreProduct', on_delete=models.CASCADE,
        related_name='flash_sale_entries',
    )
    override_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text='Override price for this product during the sale.',
    )
    quantity_limit = models.PositiveIntegerField(
        blank=True, null=True,
        help_text='Maximum quantity available at flash price.',
    )
    sold_count = models.PositiveIntegerField(
        default=0,
        help_text='Number of units sold during this flash sale.',
    )

    class Meta:
        db_table = 'flash_sale_products'
        unique_together = ('flash_sale', 'product')

    def __str__(self):
        return f'{self.product.name} in {self.flash_sale.title}'
