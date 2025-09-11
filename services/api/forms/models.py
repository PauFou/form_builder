from django.db import models
import uuid

from core.models import BaseModel, Organization, User
from core.db_utils import get_array_field


class Form(BaseModel):
    """Form model"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='forms'
    )
    
    # Basic info
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Form structure
    pages = models.JSONField(default=list, help_text="Form pages with blocks")
    logic = models.JSONField(default=dict, blank=True, help_text="Form logic rules")
    theme = models.JSONField(default=dict, blank=True, help_text="Form theme configuration")
    settings = models.JSONField(default=dict, blank=True, help_text="Form settings")
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    tags = get_array_field(
        models.CharField(max_length=50),
        default=list,
        blank=True
    )
    
    # Localization
    default_locale = models.CharField(max_length=10, default='en')
    locales = get_array_field(
        models.CharField(max_length=10),
        default=list,
        blank=True
    )
    translations = models.JSONField(default=dict, blank=True)
    
    # Stats
    submission_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    
    # Relations
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_forms'
    )
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['organization', 'slug']]
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['slug']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return self.title


class FormVersion(BaseModel):
    """Form version for history and rollback"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        Form,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    version = models.IntegerField()
    
    # Snapshot of form data
    schema = models.JSONField(help_text="Form schema at this version")
    theme = models.JSONField(blank=True, null=True)
    settings = models.JSONField(blank=True, null=True)
    
    # Publishing info
    published_at = models.DateTimeField(blank=True, null=True)
    published_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='published_versions'
    )
    canary_percentage = models.IntegerField(default=0, help_text="Percentage of traffic for canary deployment")
    
    # Version metadata
    changelog = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-version']
        unique_together = [['form', 'version']]
        indexes = [
            models.Index(fields=['form', '-version']),
            models.Index(fields=['published_at']),
        ]
    
    def __str__(self):
        return f"{self.form.title} v{self.version}"


class Submission(BaseModel):
    """Form submission model"""
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        Form,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    form_version = models.ForeignKey(
        FormVersion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submissions'
    )
    
    # Respondent info
    respondent_key = models.CharField(max_length=255, help_text="Unique key for the respondent")
    respondent_email = models.EmailField(blank=True, null=True)
    
    # Submission data
    data = models.JSONField(default=dict, help_text="Form submission data")
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional metadata")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Analytics
    time_spent = models.IntegerField(default=0, help_text="Time spent in seconds")
    device_type = models.CharField(max_length=50, blank=True)
    browser = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['form', 'status']),
            models.Index(fields=['respondent_key']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Submission {self.id} for {self.form.title}"