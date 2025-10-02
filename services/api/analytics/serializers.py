"""
Serializers for analytics API endpoints
"""
from rest_framework import serializers
from datetime import datetime


class AnalyticsQuerySerializer(serializers.Serializer):
    """Base serializer for analytics queries"""
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        
        # Limit to 1 year of data for performance
        if (data['end_date'] - data['start_date']).days > 365:
            raise serializers.ValidationError("Date range cannot exceed 365 days")
        
        return data


class FormAnalyticsSerializer(AnalyticsQuerySerializer):
    """Serializer for form analytics request"""
    metrics = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            'views', 'submissions', 'completion_rate', 
            'avg_time', 'bounce_rate'
        ]),
        required=False,
        default=['views', 'submissions', 'completion_rate']
    )


class FieldAnalyticsSerializer(AnalyticsQuerySerializer):
    """Serializer for field-level analytics request"""
    field_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )


class TimeSeriesSerializer(AnalyticsQuerySerializer):
    """Serializer for time series data request"""
    metric = serializers.ChoiceField(choices=[
        'views', 'submissions', 'completion_rate'
    ])
    interval = serializers.ChoiceField(
        choices=['hour', 'day', 'week', 'month'],
        default='day'
    )


class FunnelAnalyticsSerializer(AnalyticsQuerySerializer):
    """Serializer for funnel analytics request"""
    include_drop_off = serializers.BooleanField(default=True)


class ReferrerAnalyticsSerializer(AnalyticsQuerySerializer):
    """Serializer for referrer analytics request"""
    limit = serializers.IntegerField(min_value=1, max_value=100, default=10)


class DeviceAnalyticsSerializer(AnalyticsQuerySerializer):
    """Serializer for device breakdown request"""
    group_by = serializers.ChoiceField(
        choices=['device', 'browser', 'os', 'all'],
        default='all'
    )


class EventTrackingSerializer(serializers.Serializer):
    """Serializer for tracking events"""
    event_type = serializers.ChoiceField(choices=[
        'view', 'interaction', 'submission'
    ])
    form_id = serializers.UUIDField()
    session_id = serializers.CharField(max_length=64)
    respondent_key = serializers.CharField(max_length=64, required=False, allow_blank=True)
    timestamp = serializers.DateTimeField(default=datetime.now)
    
    # Common fields
    user_agent = serializers.CharField(required=False, allow_blank=True)
    ip_address = serializers.CharField(required=False, allow_blank=True)
    referrer_url = serializers.URLField(required=False, allow_blank=True)
    
    # View event fields
    page_load_time_ms = serializers.IntegerField(required=False, min_value=0)
    device_info = serializers.JSONField(required=False)
    
    # Interaction event fields  
    interaction_type = serializers.CharField(required=False)
    field_id = serializers.CharField(required=False, allow_blank=True)
    field_type = serializers.CharField(required=False, allow_blank=True)
    page_number = serializers.IntegerField(required=False, min_value=1)
    time_on_field_ms = serializers.IntegerField(required=False, min_value=0)
    error_info = serializers.JSONField(required=False)
    
    # Submission event fields
    is_complete = serializers.BooleanField(required=False)
    is_partial = serializers.BooleanField(required=False)
    total_time_ms = serializers.IntegerField(required=False, min_value=0)
    fields_completed = serializers.IntegerField(required=False, min_value=0)
    fields_total = serializers.IntegerField(required=False, min_value=0)
    
    def validate(self, data):
        event_type = data['event_type']
        
        # Validate required fields based on event type
        if event_type == 'view':
            if 'page_load_time_ms' not in data:
                raise serializers.ValidationError(
                    "page_load_time_ms is required for view events"
                )
        elif event_type == 'interaction':
            if 'interaction_type' not in data:
                raise serializers.ValidationError(
                    "interaction_type is required for interaction events"
                )
        elif event_type == 'submission':
            if 'is_complete' not in data:
                raise serializers.ValidationError(
                    "is_complete is required for submission events"
                )
        
        return data


class BatchEventTrackingSerializer(serializers.Serializer):
    """Serializer for batch event tracking"""
    events = serializers.ListField(
        child=EventTrackingSerializer(),
        min_length=1,
        max_length=1000
    )


# Response serializers
class AnalyticsMetricsResponseSerializer(serializers.Serializer):
    """Response serializer for analytics metrics"""
    form_id = serializers.UUIDField()
    period = serializers.DictField()
    views = serializers.DictField(required=False)
    submissions = serializers.DictField(required=False)
    completion_rate = serializers.FloatField(required=False)
    time_metrics = serializers.DictField(required=False)
    bounce_rate = serializers.FloatField(required=False)


class FieldAnalyticsResponseSerializer(serializers.Serializer):
    """Response serializer for field analytics"""
    field_id = serializers.CharField()
    field_type = serializers.CharField()
    total_interactions = serializers.IntegerField()
    unique_sessions = serializers.IntegerField()
    changes = serializers.IntegerField()
    errors = serializers.IntegerField()
    avg_time_seconds = serializers.FloatField()
    p95_time_seconds = serializers.FloatField()
    error_details = serializers.ListField(required=False)


class TimeSeriesDataPointSerializer(serializers.Serializer):
    """Serializer for time series data points"""
    period = serializers.DateTimeField()
    value = serializers.FloatField()


class FunnelStepSerializer(serializers.Serializer):
    """Serializer for funnel steps"""
    step = serializers.IntegerField()
    name = serializers.CharField()
    reached = serializers.IntegerField()
    completed = serializers.IntegerField()
    drop_off_rate = serializers.FloatField()


class FunnelAnalyticsResponseSerializer(serializers.Serializer):
    """Response serializer for funnel analytics"""
    total_sessions = serializers.IntegerField()
    submit_attempts = serializers.IntegerField()
    completions = serializers.IntegerField()
    overall_conversion_rate = serializers.FloatField()
    funnel_steps = FunnelStepSerializer(many=True)


class ReferrerDataSerializer(serializers.Serializer):
    """Serializer for referrer data"""
    referrer_domain = serializers.CharField()
    visits = serializers.IntegerField()
    unique_sessions = serializers.IntegerField()
    conversions = serializers.IntegerField()
    conversion_rate = serializers.FloatField()


class DeviceBreakdownSerializer(serializers.Serializer):
    """Response serializer for device breakdown"""
    devices = serializers.DictField()
    browsers = serializers.DictField()
    operating_systems = serializers.DictField()