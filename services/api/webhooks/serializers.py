from rest_framework import serializers
from .models import Webhook, Delivery, DeadLetterQueue, WebhookLog


class WebhookSerializer(serializers.ModelSerializer):
    success_rate = serializers.SerializerMethodField()
    organization_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Webhook
        fields = [
            "id", "url", "secret", "active", "headers_json", 
            "include_partials", "retry_enabled", "max_retries",
            "total_deliveries", "successful_deliveries", "failed_deliveries",
            "success_rate", "organization_id", "created_at", "updated_at"
        ]
        read_only_fields = [
            "id", "total_deliveries", "successful_deliveries",
            "failed_deliveries", "success_rate", "created_at", "updated_at"
        ]
        extra_kwargs = {
            "secret": {"write_only": True}
        }
    
    def get_success_rate(self, obj) -> float:
        if obj.total_deliveries == 0:
            return 100.0
        return round((obj.successful_deliveries / obj.total_deliveries) * 100, 2)


class DeliverySerializer(serializers.ModelSerializer):
    webhook_url = serializers.CharField(source='webhook.url', read_only=True)
    has_dlq_entry = serializers.SerializerMethodField()
    
    class Meta:
        model = Delivery
        fields = [
            "id", "webhook", "webhook_url", "submission", "partial", "status",
            "attempt", "response_code", "response_time_ms", "error", 
            "next_retry_at", "payload_size", "has_dlq_entry",
            "created_at", "delivered_at"
        ]
        read_only_fields = fields
    
    def get_has_dlq_entry(self, obj) -> bool:
        return hasattr(obj, 'dlq_entry')


class DeadLetterQueueSerializer(serializers.ModelSerializer):
    delivery = DeliverySerializer(read_only=True)
    
    class Meta:
        model = DeadLetterQueue
        fields = [
            "id", "delivery", "reason", "payload_json",
            "created_at", "redriven_at"
        ]
        read_only_fields = fields


class WebhookLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookLog
        fields = [
            "id", "attempt", "timestamp", "request_headers",
            "request_body", "response_status", "response_headers",
            "response_body", "error_message", "duration_ms"
        ]
        read_only_fields = fields


class WebhookStatsSerializer(serializers.Serializer):
    total_webhooks = serializers.IntegerField()
    active_webhooks = serializers.IntegerField()
    total_deliveries_24h = serializers.IntegerField()
    successful_deliveries_24h = serializers.IntegerField()
    failed_deliveries_24h = serializers.IntegerField()
    pending_deliveries = serializers.IntegerField()
    dlq_entries = serializers.IntegerField()
    avg_response_time_ms = serializers.FloatField()


class BulkRedriveSerializer(serializers.Serializer):
    webhook_id = serializers.UUIDField(required=False)
    limit = serializers.IntegerField(default=100, max_value=1000)