"""Delivery serializers."""
from rest_framework import serializers
from .models import Delivery, DeliveryPartner, DeliveryTrackingEvent


class DeliveryTrackingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryTrackingEvent
        fields = ['id', 'status_label', 'location_description', 'note', 'event_time', 'created_at']
        read_only_fields = fields


class DeliverySerializer(serializers.ModelSerializer):
    tracking_events = DeliveryTrackingEventSerializer(many=True, read_only=True)
    partner_name = serializers.CharField(source='partner.name', read_only=True)

    class Meta:
        model = Delivery
        fields = [
            'id', 'order', 'partner', 'partner_name', 'tracking_code',
            'status', 'estimated_delivery_date', 'delivered_at',
            'delivery_proof_url', 'tracking_events', 'created_at',
        ]
        read_only_fields = fields


class DeliveryPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartner
        fields = ['id', 'name', 'partner_type', 'tracking_url_template', 'is_active', 'supported_areas']
        read_only_fields = ['id']


class AdminDeliveryUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        'pending', 'picked_up', 'in_transit', 'out_for_delivery',
        'delivered', 'failed', 'returned',
    ])
    location_description = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    event_time = serializers.DateTimeField(required=False)
