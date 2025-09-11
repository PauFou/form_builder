from django.db import models
from core.models import BaseModel, Organization
# from core.db_utils import get_array_field  # Not needed with JSONField
import uuid
import json
from cryptography.fernet import Fernet
from django.conf import settings

class Integration(BaseModel):
    """Third-party integration configuration"""
    
    INTEGRATION_TYPES = [
        ('google_sheets', 'Google Sheets'),
        ('slack', 'Slack'),
        ('notion', 'Notion'),
        ('airtable', 'Airtable'),
        ('hubspot', 'HubSpot'),
        ('zapier', 'Zapier'),
        ('make', 'Make'),
        ('stripe', 'Stripe'),
        ('webhook', 'Custom Webhook'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='integrations'
    )
    type = models.CharField(max_length=50, choices=INTEGRATION_TYPES)
    name = models.CharField(max_length=200)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='inactive'
    )
    
    # Configuration (encrypted)
    config_encrypted = models.TextField()
    
    # Settings
    settings = models.JSONField(null=True, blank=True)
    
    # OAuth tokens (encrypted)
    access_token_encrypted = models.TextField(blank=True, null=True)
    refresh_token_encrypted = models.TextField(blank=True, null=True)
    token_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    last_sync_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['organization', 'type', 'name']]
        indexes = [
            models.Index(fields=['organization', 'type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    @property
    def config(self):
        """Decrypt and return configuration"""
        if self.config_encrypted:
            fernet = Fernet(settings.ENCRYPTION_KEY.encode())
            decrypted = fernet.decrypt(self.config_encrypted.encode())
            return json.loads(decrypted.decode())
        return {}
    
    @config.setter
    def config(self, value):
        """Encrypt and store configuration"""
        fernet = Fernet(settings.ENCRYPTION_KEY.encode())
        json_str = json.dumps(value)
        encrypted = fernet.encrypt(json_str.encode())
        self.config_encrypted = encrypted.decode()
    
    @property
    def access_token(self):
        """Decrypt and return access token"""
        if self.access_token_encrypted:
            fernet = Fernet(settings.ENCRYPTION_KEY.encode())
            decrypted = fernet.decrypt(self.access_token_encrypted.encode())
            return decrypted.decode()
        return None
    
    @access_token.setter
    def access_token(self, value):
        """Encrypt and store access token"""
        if value:
            fernet = Fernet(settings.ENCRYPTION_KEY.encode())
            encrypted = fernet.encrypt(value.encode())
            self.access_token_encrypted = encrypted.decode()
        else:
            self.access_token_encrypted = None
    
    @property
    def refresh_token(self):
        """Decrypt and return refresh token"""
        if self.refresh_token_encrypted:
            fernet = Fernet(settings.ENCRYPTION_KEY.encode())
            decrypted = fernet.decrypt(self.refresh_token_encrypted.encode())
            return decrypted.decode()
        return None
    
    @refresh_token.setter
    def refresh_token(self, value):
        """Encrypt and store refresh token"""
        if value:
            fernet = Fernet(settings.ENCRYPTION_KEY.encode())
            encrypted = fernet.encrypt(value.encode())
            self.refresh_token_encrypted = encrypted.decode()
        else:
            self.refresh_token_encrypted = None


class IntegrationConnection(BaseModel):
    """Connection between a form and an integration"""
    
    TRIGGER_EVENTS = [
        ('form_submit', 'Form Submission'),
        ('partial_submit', 'Partial Submission'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        'forms.Form',
        on_delete=models.CASCADE,
        related_name='integration_connections'
    )
    integration = models.ForeignKey(
        Integration,
        on_delete=models.CASCADE,
        related_name='connections'
    )
    
    # Configuration
    enabled = models.BooleanField(default=True)
    trigger_events = models.JSONField(null=True, blank=True, help_text="Events that trigger this integration")
    
    # Field mapping
    field_mapping = models.JSONField(null=True, blank=True, help_text="Maps form fields to integration fields")
    
    # Integration-specific settings
    settings = models.JSONField(null=True, blank=True)
    
    # Stats
    last_triggered_at = models.DateTimeField(blank=True, null=True)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    last_error = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['form', 'integration']]
        indexes = [
            models.Index(fields=['form', 'enabled']),
            models.Index(fields=['integration', 'enabled']),
        ]
    
    def __str__(self):
        return f"{self.form.title} → {self.integration.name}"


class IntegrationLog(BaseModel):
    """Log of integration executions"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    connection = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    submission = models.ForeignKey(
        'core.Submission',
        on_delete=models.CASCADE,
        related_name='integration_logs',
        blank=True,
        null=True
    )
    partial = models.ForeignKey(
        'core.Partial',
        on_delete=models.CASCADE,
        related_name='integration_logs',
        blank=True,
        null=True
    )
    
    # Execution details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    trigger_event = models.CharField(max_length=50)
    
    # Request/Response data
    request_data = models.JSONField(null=True, blank=True)
    response_data = models.JSONField(blank=True, null=True)
    response_code = models.IntegerField(blank=True, null=True)
    
    # Timing
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    duration_ms = models.IntegerField(blank=True, null=True)
    
    # Error info
    error_message = models.TextField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    next_retry_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['connection', 'status']),
            models.Index(fields=['submission']),
            models.Index(fields=['partial']),
            models.Index(fields=['status', 'next_retry_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.connection} - {self.get_status_display()}"