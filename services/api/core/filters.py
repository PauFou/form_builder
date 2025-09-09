from django_filters import rest_framework as filters
from .models import Submission, AuditLog


class SubmissionFilter(filters.FilterSet):
    completed = filters.BooleanFilter(field_name='completed_at', lookup_expr='isnull', exclude=True)
    started_after = filters.DateTimeFilter(field_name='started_at', lookup_expr='gte')
    started_before = filters.DateTimeFilter(field_name='started_at', lookup_expr='lte')
    completed_after = filters.DateTimeFilter(field_name='completed_at', lookup_expr='gte')
    completed_before = filters.DateTimeFilter(field_name='completed_at', lookup_expr='lte')
    
    class Meta:
        model = Submission
        fields = ['locale', 'respondent_key']


class AuditLogFilter(filters.FilterSet):
    action = filters.CharFilter(field_name='action')
    entity = filters.CharFilter(field_name='entity')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = AuditLog
        fields = ['actor', 'action', 'entity', 'entity_id']