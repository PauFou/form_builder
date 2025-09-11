from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid


class BaseModel(models.Model):
    """Abstract base model with common fields for all models"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]


class Organization(models.Model):
    PLAN_CHOICES = [
        ("free", "Free"),
        ("pro", "Pro"),
        ("scale", "Scale"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    seats = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]


class Membership(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("editor", "Editor"),
        ("viewer", "Viewer"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ["user", "organization"]


# Form model is defined in forms/models.py
# FormVersion model is defined in forms/models.py


class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey("forms.Form", on_delete=models.CASCADE, related_name="submissions")
    version = models.IntegerField()
    respondent_key = models.CharField(max_length=255, db_index=True)
    locale = models.CharField(max_length=10)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    metadata_json = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["form", "completed_at"]),
            models.Index(fields=["respondent_key"]),
        ]


class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="answers")
    block_id = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    value_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ["submission", "block_id"]


class Partial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey("forms.Form", on_delete=models.CASCADE, related_name="partials")
    respondent_key = models.CharField(max_length=255)
    last_step = models.CharField(max_length=100)
    value_json = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ["form", "respondent_key"]
        indexes = [
            models.Index(fields=["updated_at"]),
        ]


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="audit_logs")
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)
    entity = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=255)
    diff_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "created_at"]),
            models.Index(fields=["entity", "entity_id"]),
        ]