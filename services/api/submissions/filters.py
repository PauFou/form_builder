import django_filters
from django.db.models import Q
from core.models import Submission


class SubmissionFilter(django_filters.FilterSet):
    """
    Advanced filtering for submissions.
    """
    
    # Date range filters
    started_after = django_filters.DateTimeFilter(field_name='started_at', lookup_expr='gte')
    started_before = django_filters.DateTimeFilter(field_name='started_at', lookup_expr='lte')
    completed_after = django_filters.DateTimeFilter(field_name='completed_at', lookup_expr='gte')
    completed_before = django_filters.DateTimeFilter(field_name='completed_at', lookup_expr='lte')
    
    # Status filters
    is_completed = django_filters.BooleanFilter(method='filter_completion_status')
    
    # Locale filter
    locale = django_filters.CharFilter(lookup_expr='iexact')
    
    # Respondent key filter
    respondent_key = django_filters.CharFilter(lookup_expr='icontains')
    
    # Version filter
    version = django_filters.NumberFilter()
    
    # Tags filter (searches in metadata_json)
    has_tag = django_filters.CharFilter(method='filter_has_tag')
    
    # Full-text search in answers
    search = django_filters.CharFilter(method='filter_full_text_search')
    
    class Meta:
        model = Submission
        fields = {
            'started_at': ['exact', 'gte', 'lte'],
            'completed_at': ['exact', 'gte', 'lte', 'isnull'],
            'locale': ['exact', 'icontains'],
            'version': ['exact', 'gte', 'lte'],
            'respondent_key': ['exact', 'icontains'],
        }

    def filter_completion_status(self, queryset, name, value):
        """
        Filter by completion status.
        """
        if value is True:
            return queryset.filter(completed_at__isnull=False)
        elif value is False:
            return queryset.filter(completed_at__isnull=True)
        return queryset

    def filter_has_tag(self, queryset, name, value):
        """
        Filter submissions that have a specific tag.
        """
        return queryset.filter(
            metadata_json__tags__contains=[value]
        )

    def filter_full_text_search(self, queryset, name, value):
        """
        Full-text search across submission data.
        """
        if not value:
            return queryset
            
        # Search in multiple fields
        search_query = (
            Q(respondent_key__icontains=value) |
            Q(answers__value_json__icontains=value) |
            Q(metadata_json__icontains=value)
        )
        
        return queryset.filter(search_query).distinct()