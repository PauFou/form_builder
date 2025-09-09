from rest_framework import serializers
from .models import Webhook, Delivery


class WebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webhook
        fields = [
            "id", "url", "secret", "active", "headers_json", 
            "include_partials", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "secret", "created_at", "updated_at"]
        extra_kwargs = {
            "secret": {"write_only": True}
        }


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = [
            "id", "webhook", "submission", "partial", "status",
            "attempt", "response_code", "error", "next_retry_at",
            "created_at", "delivered_at"
        ]
        read_only_fields = fields