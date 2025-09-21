from django.db import models
# from django.contrib.postgres.fields import ArrayField  # Not needed with JSONField
from cryptography.fernet import Fernet
from django.conf import settings
import uuid

from core.models import BaseModel, Organization, User


class DataResidencyConfig(BaseModel):
    """Configure data residency requirements per organization"""
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='data_residency'
    )
    primary_region = models.CharField(
        max_length=20,
        default='eu-west-1',
        choices=[
            ('eu-west-1', 'EU West (Ireland)'),
            ('eu-central-1', 'EU Central (Frankfurt)'),
            ('eu-north-1', 'EU North (Stockholm)'),
        ]
    )
    allowed_regions = models.JSONField(
        null=True, blank=True,
        help_text="List of allowed regions for data storage"
    )
    enforce_residency = models.BooleanField(
        default=True,
        help_text="Enforce data residency requirements"
    )
    
    class Meta:
        verbose_name = "Data Residency Configuration"
        verbose_name_plural = "Data Residency Configurations"


class DataRetentionPolicy(BaseModel):
    """Data retention policies per organization or form"""
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='retention_policies'
    )
    form = models.ForeignKey(
        'forms.Form',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='retention_policies'
    )
    
    # Retention periods in days
    submission_retention_days = models.IntegerField(
        default=365,
        help_text="Days to retain form submissions"
    )
    partial_retention_days = models.IntegerField(
        default=30,
        help_text="Days to retain partial submissions"
    )
    attachment_retention_days = models.IntegerField(
        default=365,
        help_text="Days to retain file attachments"
    )
    audit_log_retention_days = models.IntegerField(
        default=730,  # 2 years
        help_text="Days to retain audit logs"
    )
    
    # Auto-deletion settings
    auto_delete_enabled = models.BooleanField(
        default=False,
        help_text="Enable automatic deletion after retention period"
    )
    deletion_notification_days = models.IntegerField(
        default=30,
        help_text="Days before deletion to notify data subjects"
    )
    
    class Meta:
        unique_together = [['organization', 'form']]
        verbose_name = "Data Retention Policy"
        verbose_name_plural = "Data Retention Policies"


class PIIFieldConfig(BaseModel):
    """Configure PII field handling per form"""
    form = models.ForeignKey(
        'forms.Form',
        on_delete=models.CASCADE,
        related_name='pii_configs'
    )
    field_id = models.CharField(max_length=100)
    field_type = models.CharField(
        max_length=50,
        choices=[
            ('name', 'Name'),
            ('email', 'Email'),
            ('phone', 'Phone'),
            ('address', 'Address'),
            ('ssn', 'Social Security Number'),
            ('credit_card', 'Credit Card'),
            ('bank_account', 'Bank Account'),
            ('passport', 'Passport Number'),
            ('driver_license', 'Driver License'),
            ('health', 'Health Information'),
            ('biometric', 'Biometric Data'),
            ('other', 'Other PII'),
        ]
    )
    
    # Handling settings
    encrypt_at_rest = models.BooleanField(default=True)
    mask_in_exports = models.BooleanField(default=True)
    mask_in_ui = models.BooleanField(default=False)
    require_consent = models.BooleanField(default=True)
    
    # Masking pattern (e.g., "****-****-****-{last4}")
    masking_pattern = models.CharField(
        max_length=100,
        blank=True,
        help_text="Pattern for masking (e.g., ****-****-****-{last4})"
    )
    
    class Meta:
        unique_together = [['form', 'field_id']]
        verbose_name = "PII Field Configuration"


class ConsentRecord(BaseModel):
    """Track consent given by data subjects"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        'forms.Form',
        on_delete=models.CASCADE,
        related_name='consent_records'
    )
    submission = models.ForeignKey(
        'core.Submission',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='consent_records'
    )
    
    # Consent details
    respondent_identifier = models.CharField(
        max_length=255,
        help_text="Email or other identifier"
    )
    consent_type = models.CharField(
        max_length=50,
        choices=[
            ('data_collection', 'Data Collection'),
            ('marketing', 'Marketing Communications'),
            ('analytics', 'Analytics & Tracking'),
            ('third_party', 'Third Party Sharing'),
            ('cookies', 'Cookies & Tracking'),
        ]
    )
    granted = models.BooleanField()
    consent_text = models.TextField(
        help_text="The exact consent text presented to the user"
    )
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    withdrawal_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['respondent_identifier']),
            models.Index(fields=['form', 'consent_type']),
        ]
        verbose_name = "Consent Record"


class DataProcessingAgreement(BaseModel):
    """DPA templates and signed agreements"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='dpas'
    )
    
    # Agreement details
    version = models.CharField(max_length=20)
    template_content = models.TextField(
        help_text="DPA template content in markdown"
    )
    
    # Signatory information
    signed = models.BooleanField(default=False)
    signed_date = models.DateTimeField(null=True, blank=True)
    signatory_name = models.CharField(max_length=255, blank=True)
    signatory_title = models.CharField(max_length=255, blank=True)
    signatory_email = models.EmailField(blank=True)
    
    # Document storage
    signed_document_url = models.URLField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Data Processing Agreement"
        verbose_name_plural = "Data Processing Agreements"


class DataDeletionRequest(BaseModel):
    """Track right to be forgotten requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Request details
    requester_email = models.EmailField()
    requester_name = models.CharField(max_length=255)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='deletion_requests'
    )
    
    # Scope
    scope = models.CharField(
        max_length=20,
        choices=[
            ('all', 'All Data'),
            ('form', 'Specific Form'),
            ('submission', 'Specific Submission'),
        ]
    )
    form = models.ForeignKey(
        'forms.Form',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    submission_ids = models.JSONField(
        null=True, blank=True
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('verified', 'Verified'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    
    # Verification
    verification_token = models.CharField(max_length=255)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Processing
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    deletion_report = models.JSONField(
        null=True, blank=True,
        help_text="Report of what was deleted"
    )
    
    # Rejection reason
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['requester_email']),
        ]
        verbose_name = "Data Deletion Request"


class DataExportRequest(BaseModel):
    """Track data export requests (right to data portability)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Request details
    requester_email = models.EmailField()
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='export_requests'
    )
    
    # Scope
    include_submissions = models.BooleanField(default=True)
    include_partial_submissions = models.BooleanField(default=True)
    include_consent_records = models.BooleanField(default=True)
    include_audit_logs = models.BooleanField(default=False)
    
    # Format
    export_format = models.CharField(
        max_length=20,
        choices=[
            ('json', 'JSON'),
            ('csv', 'CSV'),
            ('parquet', 'Parquet'),
        ],
        default='json'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('expired', 'Expired'),
        ],
        default='pending'
    )
    
    # Processing
    processed_at = models.DateTimeField(null=True, blank=True)
    export_url = models.URLField(blank=True)
    export_size_bytes = models.BigIntegerField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['requester_email']),
        ]
        verbose_name = "Data Export Request"


class PIIEncryption:
    """Utility class for PII encryption/decryption"""
    
    @staticmethod
    def get_fernet():
        # Get the encryption key from settings
        raw_key = settings.ENCRYPTION_KEY.encode()
        
        # Ensure the key is exactly 32 bytes
        if len(raw_key) < 32:
            # Pad with zeros if too short
            key_bytes = raw_key.ljust(32, b'0')
        else:
            # Truncate if too long
            key_bytes = raw_key[:32]
        
        # Convert to URL-safe base64 format required by Fernet
        import base64
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        
        return Fernet(fernet_key)
    
    @classmethod
    def encrypt(cls, data: str) -> str:
        """Encrypt PII data"""
        if not data:
            return data
        fernet = cls.get_fernet()
        return fernet.encrypt(data.encode()).decode()
    
    @classmethod
    def decrypt(cls, encrypted_data: str) -> str:
        """Decrypt PII data"""
        if not encrypted_data:
            return encrypted_data
        fernet = cls.get_fernet()
        return fernet.decrypt(encrypted_data.encode()).decode()
    
    @classmethod
    def mask(cls, data: str, pattern: str = None) -> str:
        """Mask PII data according to pattern"""
        if not data:
            return data
        
        if pattern and '{last4}' in pattern:
            # Handle credit card style masking
            return pattern.replace('{last4}', data[-4:] if len(data) >= 4 else data)
        elif pattern and '{first2}' in pattern:
            # Handle name style masking
            return pattern.replace('{first2}', data[:2] if len(data) >= 2 else data)
        else:
            # Default masking
            if '@' in data:  # Email
                parts = data.split('@')
                return f"{parts[0][:2]}****@{parts[1]}"
            elif len(data) > 4:  # General
                return data[:2] + '*' * (len(data) - 4) + data[-2:]
            else:
                return '*' * len(data)
