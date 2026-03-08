"""
Delivery Models.

DeliveryPartner, Delivery tracking, and DeliveryTrackingEvent timeline.
"""

from django.db import models

from core.models import BaseModel, UUIDMixin


class DeliveryPartner(BaseModel):
    """Courier or campus delivery partner."""

    PARTNER_TYPE_CHOICES = [
        ('external_courier', 'External Courier'),
        ('internal', 'Internal'),
        ('campus_runner', 'Campus Runner'),
    ]

    name = models.CharField(max_length=200)
    partner_type = models.CharField(
        max_length=20, choices=PARTNER_TYPE_CHOICES,
    )
    api_endpoint = models.CharField(max_length=300, blank=True, null=True)
    api_key_encrypted = models.TextField(
        blank=True, null=True,
        help_text='Fernet-encrypted API key.',
    )
    tracking_url_template = models.CharField(
        max_length=300, blank=True, null=True,
        help_text='Template with {code} placeholder.',
    )
    is_active = models.BooleanField(default=True)
    supported_areas = models.JSONField(default=list, blank=True)

    class Meta(BaseModel.Meta):
        db_table = 'delivery_partners'

    def __str__(self):
        return self.name


class Delivery(BaseModel):
    """Delivery tracking for an order."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('returned', 'Returned'),
    ]

    order = models.OneToOneField(
        'orders.Order', on_delete=models.PROTECT,
        related_name='delivery', db_index=True,
    )
    partner = models.ForeignKey(
        DeliveryPartner, on_delete=models.PROTECT,
        related_name='deliveries',
    )
    tracking_code = models.CharField(
        max_length=100, unique=True, db_index=True,
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='pending', db_index=True,
    )
    estimated_delivery_date = models.DateField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    delivery_proof_url = models.CharField(
        max_length=500, blank=True, null=True,
    )

    class Meta(BaseModel.Meta):
        db_table = 'deliveries'
        indexes = [
            models.Index(fields=['status', 'tracking_code']),
        ]

    def __str__(self):
        return f'Delivery {self.tracking_code} — {self.status}'


class DeliveryTrackingEvent(UUIDMixin):
    """Individual event in a delivery timeline."""

    delivery = models.ForeignKey(
        Delivery, on_delete=models.CASCADE,
        related_name='tracking_events', db_index=True,
    )
    status_label = models.CharField(max_length=100)
    location_description = models.CharField(
        max_length=200, blank=True, null=True,
    )
    note = models.TextField(blank=True, null=True)
    event_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'delivery_tracking_events'
        ordering = ['-event_time']

    def __str__(self):
        return f'{self.status_label} — {self.event_time}'
