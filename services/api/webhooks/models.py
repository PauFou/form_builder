from django.db import models
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]


class Delivery(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name="deliveries")
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, null=True, blank=True)
    partial = models.ForeignKey(Partial, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    attempt = models.IntegerField(default=1)
    response_code = models.IntegerField(null=True, blank=True)
    error = models.TextField(blank=True)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "next_retry_at"]),
            models.Index(fields=["webhook", "created_at"]),
        ]