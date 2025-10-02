from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema_field

from .models import (
    DataResidencyConfig, DataRetentionPolicy, PIIFieldConfig,
    ConsentRecord, DataProcessingAgreement, DataDeletionRequest,
    DataExportRequest
)


class DataResidencyConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataResidencyConfig
        fields = [
            'id', 'organization', 'primary_region', 'allowed_regions',
            'enforce_residency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_allowed_regions(self, value):
        valid_regions = ['eu-west-1', 'eu-central-1', 'eu-north-1']
        for region in value:
            if region not in valid_regions:
                raise serializers.ValidationError(
                    f"Invalid region: {region}. Valid regions are: {', '.join(valid_regions)}"
                )
        return value


class DataRetentionPolicySerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    form_title = serializers.CharField(source='form.title', read_only=True, allow_null=True)
    
    class Meta:
        model = DataRetentionPolicy
        fields = [
            'id', 'organization', 'organization_name', 'form', 'form_title',
            'submission_retention_days', 'partial_retention_days',
            'attachment_retention_days', 'audit_log_retention_days',
            'auto_delete_enabled', 'deletion_notification_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Ensure retention periods are reasonable
        min_days = 30
        max_days = 3650  # 10 years
        
        for field in ['submission_retention_days', 'partial_retention_days', 
                     'attachment_retention_days', 'audit_log_retention_days']:
            if field in data:
                if data[field] < min_days:
                    raise serializers.ValidationError(
                        f"{field} must be at least {min_days} days"
                    )
                if data[field] > max_days:
                    raise serializers.ValidationError(
                        f"{field} cannot exceed {max_days} days"
                    )
        
        return data


class PIIFieldConfigSerializer(serializers.ModelSerializer):
    form_title = serializers.CharField(source='form.title', read_only=True)
    
    class Meta:
        model = PIIFieldConfig
        fields = [
            'id', 'form', 'form_title', 'field_id', 'field_type',
            'encrypt_at_rest', 'mask_in_exports', 'mask_in_ui',
            'require_consent', 'masking_pattern', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_masking_pattern(self, value):
        if value and not ('{last4}' in value or '{first2}' in value or '*' in value):
            raise serializers.ValidationError(
                "Masking pattern must contain {last4}, {first2}, or * characters"
            )
        return value


class ConsentRecordSerializer(serializers.ModelSerializer):
    form_title = serializers.CharField(source='form.title', read_only=True)
    
    class Meta:
        model = ConsentRecord
        fields = [
            'id', 'form', 'form_title', 'submission', 'respondent_identifier',
            'consent_type', 'granted', 'consent_text', 'ip_address',
            'user_agent', 'withdrawal_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DataProcessingAgreementSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    is_signed = serializers.BooleanField(source='signed', read_only=True)
    
    class Meta:
        model = DataProcessingAgreement
        fields = [
            'id', 'organization', 'organization_name', 'version',
            'template_content', 'is_signed', 'signed_date',
            'signatory_name', 'signatory_title', 'signatory_email',
            'signed_document_url', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_signed', 'signed_date', 'signed_document_url',
            'created_at', 'updated_at'
        ]


class SignDPASerializer(serializers.Serializer):
    """Serializer for signing a DPA"""
    signatory_name = serializers.CharField(max_length=255)
    signatory_title = serializers.CharField(max_length=255)
    signatory_email = serializers.EmailField()
    
    def update(self, instance, validated_data):
        instance.signatory_name = validated_data['signatory_name']
        instance.signatory_title = validated_data['signatory_title']
        instance.signatory_email = validated_data['signatory_email']
        instance.signed = True
        instance.signed_date = timezone.now()
        instance.save()
        return instance


class DataDeletionRequestSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    form_title = serializers.CharField(source='form.title', read_only=True, allow_null=True)
    can_process = serializers.SerializerMethodField()
    
    class Meta:
        model = DataDeletionRequest
        fields = [
            'id', 'requester_email', 'requester_name', 'organization',
            'organization_name', 'scope', 'form', 'form_title',
            'submission_ids', 'status', 'verification_token',
            'verified_at', 'processed_at', 'processed_by',
            'deletion_report', 'rejection_reason', 'can_process',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'verification_token', 'verified_at', 'processed_at',
            'processed_by', 'deletion_report', 'created_at', 'updated_at'
        ]
    
    @extend_schema_field(serializers.BooleanField)
    def get_can_process(self, obj) -> bool:
        """Check if deletion request can be processed."""
        return obj.status == 'verified'
    
    def create(self, validated_data):
        # Generate verification token
        import secrets
        validated_data['verification_token'] = secrets.token_urlsafe(32)
        return super().create(validated_data)


class VerifyDeletionRequestSerializer(serializers.Serializer):
    """Serializer for verifying deletion request"""
    token = serializers.CharField()
    
    def validate_token(self, value):
        try:
            request = DataDeletionRequest.objects.get(
                verification_token=value,
                status='pending'
            )
        except DataDeletionRequest.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")
        
        # Check if token is not expired (48 hours)
        if timezone.now() > request.created_at + timedelta(hours=48):
            raise serializers.ValidationError("Verification token has expired")
        
        return value


class ProcessDeletionRequestSerializer(serializers.Serializer):
    """Serializer for processing deletion request"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError(
                "Rejection reason is required when rejecting a request"
            )
        return data


class DataExportRequestSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DataExportRequest
        fields = [
            'id', 'requester_email', 'organization', 'organization_name',
            'include_submissions', 'include_partial_submissions',
            'include_consent_records', 'include_audit_logs',
            'export_format', 'status', 'processed_at', 'download_url',
            'export_size_bytes', 'expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'processed_at', 'export_url',
            'export_size_bytes', 'expires_at', 'created_at', 'updated_at'
        ]
    
    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_download_url(self, obj) -> str | None:
        """Get download URL for completed export."""
        if obj.status == 'completed' and obj.export_url:
            return obj.export_url
        return None


class DPATemplateSerializer(serializers.Serializer):
    """Serializer for default DPA template"""
    version = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True)
    organization = serializers.CharField(read_only=True)
    date = serializers.DateTimeField(read_only=True)