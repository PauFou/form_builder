from django.contrib import admin
from .models import User, Organization, Membership, Form, FormVersion, Submission, Answer, Partial, AuditLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "username", "is_active", "verified_at", "date_joined"]
    search_fields = ["email", "username"]
    list_filter = ["is_active", "is_staff", "is_superuser"]


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "plan", "seats", "created_at"]
    search_fields = ["name", "slug"]
    list_filter = ["plan"]


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ["user", "organization", "role", "created_at"]
    list_filter = ["role"]
    search_fields = ["user__email", "organization__name"]


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ["title", "organization", "slug", "status", "created_by", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["title", "slug", "organization__name"]


@admin.register(FormVersion)
class FormVersionAdmin(admin.ModelAdmin):
    list_display = ["form", "version", "published_at", "canary_percent", "created_at"]
    list_filter = ["published_at"]
    search_fields = ["form__title"]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["form", "respondent_key", "started_at", "completed_at"]
    list_filter = ["completed_at", "started_at"]
    search_fields = ["respondent_key", "form__title"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["organization", "actor", "action", "entity", "created_at"]
    list_filter = ["action", "entity", "created_at"]
    search_fields = ["organization__name", "actor__email"]
    readonly_fields = ["diff_json"]