"""Delivery admin."""
from django.contrib import admin
from .models import Delivery, DeliveryPartner, DeliveryTrackingEvent


class TrackingEventInline(admin.TabularInline):
    model = DeliveryTrackingEvent
    extra = 0
    readonly_fields = ('status_label', 'location_description', 'event_time', 'created_at')


@admin.register(DeliveryPartner)
class DeliveryPartnerAdmin(admin.ModelAdmin):
    list_display = ('name', 'partner_type', 'is_active')
    list_filter = ('partner_type', 'is_active')


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('tracking_code', 'order', 'partner', 'status', 'delivered_at')
    list_filter = ('status',)
    search_fields = ('tracking_code',)
    inlines = [TrackingEventInline]
