"""
CampusHat Order Models.

Phase 07: Order, OrderItem, OrderStatusHistory, Invoice.

Design:
  - Order has strict status transition validation.
  - OrderItem stores immutable snapshots of prices and commission.
  - OrderStatusHistory provides full audit trail.
  - Invoice links to a single order with async PDF generation.
"""

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import BaseModel, TimestampMixin, UUIDMixin
from core.utils import generate_invoice_number, generate_order_number


# =============================================================================
# STATUS TRANSITION ERRORS
# =============================================================================

class InvalidStatusTransitionError(Exception):
    """Raised when an invalid order status transition is attempted."""
    pass


# =============================================================================
# MODEL 1: ORDER
# =============================================================================

class Order(BaseModel):
    """
    Mall order with full lifecycle management.

    Includes immutable financial snapshots of commission, prices,
    and delivery fees calculated at checkout time.
    """

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    ORDER_STATUS_CHOICES = [
        ('placed', 'Placed'),
        ('confirmed', 'Confirmed'),
        ('packed', 'Packed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    VALID_TRANSITIONS = {
        'placed': ['confirmed', 'cancelled'],
        'confirmed': ['packed', 'cancelled'],
        'packed': ['shipped'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': [],
    }

    order_number = models.CharField(
        max_length=30, unique=True,
        default=generate_order_number,
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True,
    )
    store = models.ForeignKey(
        'sellers.Store',
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True,
    )
    # Delivery address
    delivery_address = models.ForeignKey(
        'authentication.UserAddress',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='orders',
    )
    delivery_address_snapshot = models.JSONField(
        default=dict,
        help_text='Immutable snapshot of delivery address at checkout.',
    )

    # Coupon (placeholder — Phase 08)
    coupon_code_snapshot = models.CharField(
        max_length=50, blank=True, null=True,
    )

    # Financial fields — IMMUTABLE after creation
    subtotal = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    delivery_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    platform_commission = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Total commission taken by platform. Immutable.',
    )
    seller_net_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Amount seller receives. Immutable.',
    )

    # Status
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES,
        default='pending', db_index=True,
    )
    order_status = models.CharField(
        max_length=15, choices=ORDER_STATUS_CHOICES,
        default='placed', db_index=True,
    )

    # Notes
    buyer_note = models.TextField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancellation_reason = models.TextField(blank=True, null=True)

    # Tracking
    tracking_code = models.CharField(
        max_length=50, blank=True, null=True,
    )

    class Meta(BaseModel.Meta):
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f'Order {self.order_number}'

    def transition_status(self, new_status, changed_by, role='system', note=None):
        """
        Validate and apply a status transition.

        Args:
            new_status: Target status.
            changed_by: User making the change.
            role: 'buyer', 'seller', 'admin', 'system'.
            note: Optional note for the history record.

        Raises:
            InvalidStatusTransitionError: If transition is not allowed.
        """
        valid = self.VALID_TRANSITIONS.get(self.order_status, [])
        if new_status not in valid:
            raise InvalidStatusTransitionError(
                f"Cannot transition from '{self.order_status}' to "
                f"'{new_status}'. Valid transitions: {valid}."
            )

        old_status = self.order_status
        self.order_status = new_status

        if new_status == 'cancelled':
            self.cancelled_at = timezone.now()

        self.save(update_fields=['order_status', 'cancelled_at', 'updated_at'])

        OrderStatusHistory.objects.create(
            order=self,
            from_status=old_status,
            to_status=new_status,
            changed_by=changed_by,
            changed_by_role=role,
            note=note,
        )

        # Auto-send notification to buyer
        try:
            from apps.admin_panel.notification_utils import send_notification
            STATUS_MESSAGES = {
                'confirmed': ('Order Confirmed ✓', f'Your order #{self.order_number} has been confirmed by the seller.'),
                'packed': ('Order Packed 📦', f'Your order #{self.order_number} is being packed for shipment.'),
                'shipped': ('Order Shipped 🚚', f'Your order #{self.order_number} has been shipped!'),
                'delivered': ('Order Delivered ✅', f'Your order #{self.order_number} has been delivered. Enjoy!'),
                'cancelled': ('Order Cancelled ❌', f'Your order #{self.order_number} has been cancelled.'),
            }
            if new_status in STATUS_MESSAGES:
                title, message = STATUS_MESSAGES[new_status]
                send_notification(
                    user=self.buyer,
                    notification_type='order',
                    title=title,
                    message=message,
                    action_url=f'/orders/{self.id}',
                )
        except Exception:
            pass  # Don't block order transition on notification failures


# =============================================================================
# MODEL 2: ORDER ITEM
# =============================================================================

class OrderItem(UUIDMixin):
    """
    Individual item in an order with immutable price/commission snapshots.

    All financial values are set at checkout and never change.
    """

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        db_index=True,
    )
    product = models.ForeignKey(
        'mall.StoreProduct',
        on_delete=models.PROTECT,
        related_name='order_items',
    )
    variant = models.ForeignKey(
        'mall.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items',
    )
    product_name_snapshot = models.CharField(max_length=300)
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Price per unit at checkout time. Immutable.',
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    line_total = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='unit_price * quantity. Immutable.',
    )
    commission_rate_snapshot = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text='Commission rate at order time. Immutable.',
    )
    commission_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text='Commission for this item. Immutable.',
    )

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f'{self.product_name_snapshot} x{self.quantity}'


# =============================================================================
# MODEL 3: ORDER STATUS HISTORY
# =============================================================================

class OrderStatusHistory(UUIDMixin):
    """Full audit trail of order status changes."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='status_history',
        db_index=True,
    )
    from_status = models.CharField(max_length=50, blank=True, null=True)
    to_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    changed_by_role = models.CharField(
        max_length=20,
        help_text="'buyer', 'seller', 'admin', or 'system'.",
    )
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'order_status_history'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order.order_number}: {self.from_status} → {self.to_status}'


# =============================================================================
# MODEL 4: INVOICE
# =============================================================================

class Invoice(UUIDMixin, TimestampMixin):
    """
    Invoice linked to an order.

    PDF is generated asynchronously via Celery task.
    """

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name='invoice',
    )
    invoice_number = models.CharField(
        max_length=50, unique=True,
        default=generate_invoice_number,
    )
    pdf_url = models.CharField(
        max_length=500, blank=True, null=True,
        help_text='S3 URL of the generated PDF invoice.',
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'),
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    issued_at = models.DateTimeField()

    class Meta:
        db_table = 'invoices'

    def __str__(self):
        return f'Invoice {self.invoice_number}'
