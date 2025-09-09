from django_filters import rest_framework as filters
from .models import Delivery, DeadLetterQueue


class DeliveryFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Delivery.STATUS_CHOICES)
    webhook = filters.UUIDFilter()
    has_error = filters.BooleanFilter(method='filter_has_error')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    min_response_time = filters.NumberFilter(field_name='response_time_ms', lookup_expr='gte')
    max_response_time = filters.NumberFilter(field_name='response_time_ms', lookup_expr='lte')
    
    class Meta:
        model = Delivery
        fields = ['status', 'webhook', 'submission', 'partial']
    
    def filter_has_error(self, queryset, name, value):
        if value:
            return queryset.exclude(error='')
        return queryset.filter(error='')