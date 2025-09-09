from django.contrib import admin
from .models import Form, FormVersion


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ["title", "organization", "slug", "status", "created_by", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["title", "slug", "organization__name"]


@admin.register(FormVersion)
class FormVersionAdmin(admin.ModelAdmin):
    list_display = ["form", "version", "published_at", "canary_percentage", "created_at"]
    list_filter = ["published_at"]
    search_fields = ["form__title"]