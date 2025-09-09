from django.db import models
from django.contrib.postgres.fields import ArrayField
from core.models import Organization, Submission, Partial
import uuid


class Webhook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="webhooks")
    url = models.URLField()
    secret = models.CharField(max_length=255)
    active = models.BooleanField(default=True)
    headers_json = models.JSONField(default=dict)
    include_partials = models.BooleanField(default=False)
    retry_enabled = models.BooleanField(default=True)
    max_retries = models.IntegerField(default=7)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Statistics
    total_deliveries = models.IntegerField(default=0)
    successful_deliveries = models.IntegerField(default=0)
    failed_deliveries = models.IntegerField(default=0)
    
    class Meta:
        ordering = ["-created_at"]
        
    @property
    def success_rate(self):
        if self.total_deliveries == 0:
            return 0
        return (self.successful_deliveries / self.total_deliveries) * 100


class Delivery(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("dlq", "Dead Letter Queue"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name="deliveries")
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, null=True, blank=True)
    partial = models.ForeignKey(Partial, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    attempt = models.IntegerField(default=1)
    response_code = models.IntegerField(null=True, blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)
    error = models.TextField(blank=True)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    payload_size = models.IntegerField(default=0)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "next_retry_at"]),
            models.Index(fields=["webhook", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]


class DeadLetterQueue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery = models.OneToOneField(Delivery, on_delete=models.CASCADE, related_name="dlq_entry")
    reason = models.TextField()
    payload_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    redriven_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["redriven_at"]),
        ]


class WebhookLog(models.Model):
    """Detailed logging for webhook deliveries"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name="logs")
    attempt = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    request_headers = models.JSONField()
    request_body = models.TextField()
    response_status = models.IntegerField(null=True)
    response_headers = models.JSONField(null=True)
    response_body = models.TextField(null=True)
    error_message = models.TextField(null=True)
    duration_ms = models.IntegerField(null=True)
    
    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["delivery", "attempt"]),
        ]