from django.contrib import admin
from .models import Integration, IntegrationConnection, IntegrationLog


@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'organization', 'status', 'created_at']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['name', 'organization__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('id', 'name', 'type', 'organization', 'status')
        }),
        ('Configuration', {
            'fields': ('settings', 'error_message')
        }),
        ('OAuth', {
            'fields': ('token_expires_at', 'last_sync_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(IntegrationConnection)
class IntegrationConnectionAdmin(admin.ModelAdmin):
    list_display = ['form', 'integration', 'enabled', 'last_triggered_at', 'success_count', 'error_count']
    list_filter = ['enabled', 'trigger_events', 'created_at']
    search_fields = ['form__title', 'integration__name']
    readonly_fields = ['id', 'last_triggered_at', 'success_count', 'error_count', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('id', 'form', 'integration', 'enabled')
        }),
        ('Configuration', {
            'fields': ('trigger_events', 'field_mapping', 'settings')
        }),
        ('Stats', {
            'fields': ('last_triggered_at', 'success_count', 'error_count', 'last_error')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(IntegrationLog)
class IntegrationLogAdmin(admin.ModelAdmin):
    list_display = ['connection', 'status', 'trigger_event', 'created_at', 'duration_ms']
    list_filter = ['status', 'trigger_event', 'created_at']
    search_fields = ['connection__form__title', 'connection__integration__name']
    readonly_fields = ['id', 'started_at', 'completed_at', 'duration_ms', 'created_at']
    
    fieldsets = (
        (None, {
            'fields': ('id', 'connection', 'submission', 'partial', 'status', 'trigger_event')
        }),
        ('Execution', {
            'fields': ('started_at', 'completed_at', 'duration_ms')
        }),
        ('Data', {
            'fields': ('request_data', 'response_data', 'response_code')
        }),
        ('Error', {
            'fields': ('error_message', 'retry_count', 'next_retry_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )