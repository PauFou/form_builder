from rest_framework import serializers
from .models import Integration, IntegrationConnection, IntegrationLog


class IntegrationSerializer(serializers.ModelSerializer):
    config = serializers.JSONField(write_only=True, required=False)
    config_display = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Integration
        fields = [
            'id', 'type', 'type_display', 'name', 'status',
            'config', 'config_display', 'settings',
            'last_sync_at', 'error_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_sync_at']
    
    def get_config_display(self, obj):
        """Return safe config data for display (without secrets)"""
        config = obj.config
        safe_config = {}
        
        # Type-specific safe fields
        if obj.type == 'google_sheets':
            safe_config['spreadsheet_id'] = config.get('spreadsheet_id')
            safe_config['sheet_name'] = config.get('sheet_name')
        elif obj.type == 'slack':
            safe_config['channel'] = config.get('channel')
            safe_config['workspace'] = config.get('workspace')
        elif obj.type == 'notion':
            safe_config['database_id'] = config.get('database_id')
            safe_config['workspace_name'] = config.get('workspace_name')
        elif obj.type == 'webhook':
            safe_config['url'] = config.get('url')
            safe_config['method'] = config.get('method', 'POST')
        
        return safe_config
    
    def create(self, validated_data):
        config_data = validated_data.pop('config', {})
        integration = Integration.objects.create(**validated_data)
        if config_data:
            integration.config = config_data
            integration.save()
        return integration
    
    def update(self, instance, validated_data):
        config_data = validated_data.pop('config', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if config_data is not None:
            instance.config = config_data
        instance.save()
        return instance


class IntegrationConnectionSerializer(serializers.ModelSerializer):
    integration_name = serializers.CharField(source='integration.name', read_only=True)
    integration_type = serializers.CharField(source='integration.type', read_only=True)
    form_title = serializers.CharField(source='form.title', read_only=True)
    
    class Meta:
        model = IntegrationConnection
        fields = [
            'id', 'form', 'form_title', 'integration', 'integration_name',
            'integration_type', 'enabled', 'trigger_events', 'field_mapping',
            'settings', 'last_triggered_at', 'success_count', 'error_count',
            'last_error', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_triggered_at', 'success_count', 'error_count',
            'last_error', 'created_at', 'updated_at'
        ]
    
    def validate_field_mapping(self, value):
        """Validate field mapping structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Field mapping must be a dictionary")
        return value
    
    def validate_trigger_events(self, value):
        """Ensure at least one trigger event is selected"""
        if not value:
            raise serializers.ValidationError("At least one trigger event is required")
        return value


class IntegrationLogSerializer(serializers.ModelSerializer):
    connection_name = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()
    
    class Meta:
        model = IntegrationLog
        fields = [
            'id', 'connection', 'connection_name', 'submission', 'partial',
            'status', 'trigger_event', 'request_data', 'response_data',
            'response_code', 'started_at', 'completed_at', 'duration_ms',
            'duration_seconds', 'error_message', 'retry_count', 'next_retry_at',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_connection_name(self, obj):
        return f"{obj.connection.form.title} → {obj.connection.integration.name}"
    
    def get_duration_seconds(self, obj):
        if obj.duration_ms:
            return round(obj.duration_ms / 1000, 2)
        return None


class TestIntegrationSerializer(serializers.Serializer):
    """Serializer for testing integration connections"""
    sample_data = serializers.JSONField(
        help_text="Sample form data to test with",
        required=False
    )


class IntegrationOAuthSerializer(serializers.Serializer):
    """Serializer for OAuth callback data"""
    code = serializers.CharField(required=True)
    state = serializers.CharField(required=True)