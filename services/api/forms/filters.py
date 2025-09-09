from django_filters import rest_framework as filters
from .models import Form


class FormFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Form.STATUS_CHOICES)
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Form
        fields = ['status', 'created_by', 'organization']