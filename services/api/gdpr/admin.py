from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone

from .models import (
    DataResidencyConfig, DataRetentionPolicy, PIIFieldConfig,
    ConsentRecord, DataProcessingAgreement, DataDeletionRequest,
    DataExportRequest
)


@admin.register(DataResidencyConfig)
class DataResidencyConfigAdmin(admin.ModelAdmin):
    list_display = ['organization', 'primary_region', 'enforce_residency', 'created_at']
    list_filter = ['primary_region', 'enforce_residency']
    search_fields = ['organization__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Organization', {
            'fields': ('organization',)
        }),
        ('Residency Settings', {
            'fields': ('primary_region', 'allowed_regions', 'enforce_residency')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(DataRetentionPolicy)
class DataRetentionPolicyAdmin(admin.ModelAdmin):
    list_display = [
        'organization', 'form', 'submission_retention_days',
        'auto_delete_enabled', 'created_at'
    ]
    list_filter = ['auto_delete_enabled', 'organization']
    search_fields = ['organization__name', 'form__title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Scope', {
            'fields': ('organization', 'form'),
            'description': 'Leave form empty for organization-wide policy'
        }),
        ('Retention Periods (in days)', {
            'fields': (
                'submission_retention_days',
                'partial_retention_days',
                'attachment_retention_days',
                'audit_log_retention_days'
            )
        }),
        ('Auto-deletion Settings', {
            'fields': ('auto_delete_enabled', 'deletion_notification_days')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PIIFieldConfig)
class PIIFieldConfigAdmin(admin.ModelAdmin):
    list_display = [
        'form', 'field_id', 'field_type', 'encrypt_at_rest',
        'mask_in_exports', 'mask_in_ui'
    ]
    list_filter = ['field_type', 'encrypt_at_rest', 'mask_in_exports']
    search_fields = ['form__title', 'field_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Field Identification', {
            'fields': ('form', 'field_id', 'field_type')
        }),
        ('Security Settings', {
            'fields': (
                'encrypt_at_rest',
                'mask_in_exports',
                'mask_in_ui',
                'require_consent',
                'masking_pattern'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ConsentRecord)
class ConsentRecordAdmin(admin.ModelAdmin):
    list_display = [
        'respondent_identifier', 'form', 'consent_type',
        'granted', 'created_at', 'withdrawal_date'
    ]
    list_filter = ['consent_type', 'granted', 'form__organization']
    search_fields = ['respondent_identifier', 'form__title']
    readonly_fields = ['created_at', 'updated_at', 'ip_address', 'user_agent']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Consent Details', {
            'fields': (
                'form', 'submission', 'respondent_identifier',
                'consent_type', 'granted', 'consent_text'
            )
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'withdrawal_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(DataProcessingAgreement)
class DataProcessingAgreementAdmin(admin.ModelAdmin):
    list_display = [
        'organization', 'version', 'signed', 'signed_date',
        'signatory_name', 'created_at'
    ]
    list_filter = ['signed', 'version']
    search_fields = ['organization__name', 'signatory_name', 'signatory_email']
    readonly_fields = ['created_at', 'updated_at', 'signed_date']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Agreement', {
            'fields': ('organization', 'version', 'template_content')
        }),
        ('Signature', {
            'fields': (
                'signed', 'signed_date', 'signatory_name',
                'signatory_title', 'signatory_email',
                'signed_document_url'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        # DPAs should be created through the API
        return False


@admin.register(DataDeletionRequest)
class DataDeletionRequestAdmin(admin.ModelAdmin):
    list_display = [
        'requester_email', 'organization', 'scope', 'status',
        'created_at', 'processed_at', 'action_buttons'
    ]
    list_filter = ['status', 'scope', 'organization']
    search_fields = ['requester_email', 'requester_name']
    readonly_fields = [
        'verification_token', 'verified_at', 'processed_at',
        'processed_by', 'deletion_report', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Request Details', {
            'fields': (
                'requester_email', 'requester_name', 'organization',
                'scope', 'form', 'submission_ids'
            )
        }),
        ('Status', {
            'fields': (
                'status', 'verification_token', 'verified_at',
                'processed_at', 'processed_by', 'rejection_reason'
            )
        }),
        ('Processing Report', {
            'fields': ('deletion_report',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def action_buttons(self, obj):
        if obj.status == 'verified':
            return format_html(
                '<a class="button" href="{}">Process</a>',
                reverse('admin:gdpr_datadeletionrequest_process', args=[obj.pk])
            )
        return '-'
    action_buttons.short_description = 'Actions'
    
    def has_add_permission(self, request):
        # Deletion requests should be created through the API
        return False


@admin.register(DataExportRequest)
class DataExportRequestAdmin(admin.ModelAdmin):
    list_display = [
        'requester_email', 'organization', 'export_format',
        'status', 'created_at', 'expires_at', 'download_link'
    ]
    list_filter = ['status', 'export_format', 'organization']
    search_fields = ['requester_email']
    readonly_fields = [
        'status', 'processed_at', 'export_url', 'export_size_bytes',
        'expires_at', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Request Details', {
            'fields': (
                'requester_email', 'organization',
                'include_submissions', 'include_partial_submissions',
                'include_consent_records', 'include_audit_logs',
                'export_format'
            )
        }),
        ('Processing', {
            'fields': (
                'status', 'processed_at', 'export_url',
                'export_size_bytes', 'expires_at'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def download_link(self, obj):
        if obj.status == 'completed' and obj.export_url:
            return format_html(
                '<a href="{}" target="_blank">Download</a>',
                obj.export_url
            )
        return '-'
    download_link.short_description = 'Download'
    
    def has_add_permission(self, request):
        # Export requests should be created through the API
        return False


# Custom admin actions
@admin.action(description='Mark selected requests as verified')
def verify_deletion_requests(modeladmin, request, queryset):
    queryset.filter(status='pending').update(
        status='verified',
        verified_at=timezone.now()
    )


# Add custom actions to the appropriate admin classes
DataDeletionRequestAdmin.actions = [verify_deletion_requests]
