from django.shortcuts import get_object_or_404
from django.http import Http404, HttpResponse
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import csv
import io
from datetime import datetime

from core.models import Submission
from core.permissions import IsOrganizationMember
from forms.models import Form
from .serializers import SubmissionSerializer, SubmissionCreateSerializer
from .filters import SubmissionFilter


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing form submissions.
    Supports full CRUD operations, filtering, search, and export.
    """
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = SubmissionFilter
    search_fields = ['respondent_key', 'answers__value_json']
    ordering_fields = ['started_at', 'completed_at']
    ordering = ['-started_at']

    def get_queryset(self):
        """
        Filter submissions by form and user's organization access.
        """
        # Check for form_pk in URL kwargs first, then query params
        form_id = self.kwargs.get('form_pk') or self.request.query_params.get('form_pk')
        if form_id:
            # Get form and check permissions
            form = get_object_or_404(Form, id=form_id)
            self.check_object_permissions(self.request, form)
            
            return Submission.objects.filter(
                form=form
            ).select_related('form').prefetch_related('answers')
        
        # If no form_id, show submissions from user's organization forms
        # Get user's organization through membership
        try:
            user_org = self.request.user.memberships.first().organization
            return Submission.objects.filter(
                form__organization=user_org
            ).select_related('form').prefetch_related('answers')
        except AttributeError:
            # Return empty queryset if user has no organization
            return Submission.objects.none()

    def get_serializer_class(self):
        """
        Use different serializers for create vs other actions.
        """
        if self.action == 'create':
            return SubmissionCreateSerializer
        return SubmissionSerializer

    def perform_create(self, serializer):
        """
        Set the form when creating a submission.
        """
        form_id = self.kwargs.get('form_pk')
        if form_id:
            form = get_object_or_404(Form, id=form_id)
            self.check_object_permissions(self.request, form)
            serializer.save(form=form)
        else:
            raise Http404("Form not found")

    @action(detail=False, methods=['post'])
    def export(self, request, form_pk=None):
        """
        Export submissions to CSV format.
        Supports filtering and custom field selection.
        """
        # Get filtered queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get export format (default to CSV)
        export_format = request.data.get('format', 'csv')
        if export_format not in ['csv', 'json']:
            return Response(
                {'error': 'Unsupported format. Use csv or json.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get form for field names
        form_id = form_pk or self.kwargs.get('form_pk')
        form = get_object_or_404(Form, id=form_id)
        
        if export_format == 'csv':
            return self._export_csv(queryset, form)
        else:
            return self._export_json(queryset)

    def _export_csv(self, queryset, form):
        """
        Export submissions as CSV.
        """
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Get all field keys from form schema
        field_keys = []
        if hasattr(form, 'schema_json') and form.schema_json:
            for page in form.schema_json.get('pages', []):
                for field in page.get('fields', []):
                    field_keys.append(field.get('key', f"field_{field.get('id')}"))
        
        # Write header
        headers = ['submission_id', 'started_at', 'completed_at', 'respondent_key', 'locale'] + field_keys
        writer.writerow(headers)
        
        # Write submissions
        for submission in queryset:
            # Get answers as dict
            answers_dict = {}
            for answer in submission.answers.all():
                answers_dict[answer.field_key] = answer.value_json
            
            # Build row
            row = [
                str(submission.id),
                submission.started_at.isoformat(),
                submission.completed_at.isoformat() if submission.completed_at else '',
                submission.respondent_key,
                submission.locale,
            ]
            
            # Add field values
            for key in field_keys:
                row.append(answers_dict.get(key, ''))
            
            writer.writerow(row)
        
        # Prepare response
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type='text/csv'
        )
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"submissions_{form.slug}_{timestamp}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response

    def _export_json(self, queryset):
        """
        Export submissions as JSON.
        """
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'submissions': serializer.data,
            'count': queryset.count(),
            'exported_at': datetime.now().isoformat()
        })

    @action(detail=True, methods=['post'])
    def add_tags(self, request, pk=None, form_pk=None):
        """
        Add tags to a submission.
        """
        submission = self.get_object()
        tags = request.data.get('tags', [])
        
        if not isinstance(tags, list):
            return Response(
                {'error': 'Tags must be a list.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current metadata or create empty dict
        metadata = submission.metadata_json or {}
        current_tags = set(metadata.get('tags', []))
        current_tags.update(tags)
        metadata['tags'] = list(current_tags)
        
        submission.metadata_json = metadata
        submission.save()
        
        return Response({'tags': metadata['tags']})

    @action(detail=False, methods=['post'])
    def bulk_tag(self, request, form_pk=None):
        """
        Add tags to multiple submissions.
        """
        submission_ids = request.data.get('submission_ids', [])
        tags = request.data.get('tags', [])
        
        if not submission_ids or not tags:
            return Response(
                {'error': 'submission_ids and tags are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filter to accessible submissions
        queryset = self.get_queryset().filter(id__in=submission_ids)
        
        updated_count = 0
        for submission in queryset:
            metadata = submission.metadata_json or {}
            current_tags = set(metadata.get('tags', []))
            current_tags.update(tags)
            metadata['tags'] = list(current_tags)
            submission.metadata_json = metadata
            submission.save()
            updated_count += 1
        
        return Response({
            'updated_count': updated_count,
            'total_requested': len(submission_ids)
        })

    @action(detail=False)
    def stats(self, request, form_pk=None):
        """
        Get submission statistics for the form.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total_submissions': queryset.count(),
            'completed_submissions': queryset.filter(completed_at__isnull=False).count(),
            'partial_submissions': queryset.filter(completed_at__isnull=True).count(),
        }
        
        # Add completion rate
        if stats['total_submissions'] > 0:
            stats['completion_rate'] = round(
                (stats['completed_submissions'] / stats['total_submissions']) * 100, 2
            )
        else:
            stats['completion_rate'] = 0
        
        return Response(stats)