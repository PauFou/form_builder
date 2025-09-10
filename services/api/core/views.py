import os
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import HttpResponse, Http404, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Organization, Submission, Membership, AuditLog
from .serializers import (
    OrganizationSerializer,
    SubmissionSerializer, UserSerializer
)
from .permissions import IsOrganizationMember, IsOrganizationAdmin
from .pagination import StandardResultsSetPagination
from .filters import SubmissionFilter, AuditLogFilter
from .mixins import AuditMixin
from .storage import gdpr_export_storage, form_upload_storage

User = get_user_model()


class OrganizationViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'slug']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOrganizationAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        return self.queryset.filter(
            memberships__user=self.request.user
        ).select_related().prefetch_related('memberships').distinct()
    
    def perform_create(self, serializer):
        organization = serializer.save()
        organization._created_by = self.request.user
        organization.save()


# FormViewSet and FormVersionViewSet moved to forms/views.py


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["completed_at", "locale"]
    search_fields = ["respondent_key", "metadata_json"]
    
    def get_queryset(self):
        form_id = self.kwargs.get("form_id")
        return self.queryset.filter(
            form_id=form_id,
            form__organization__memberships__user=self.request.user
        )
    
    @action(detail=False, methods=["post"])
    def export(self, request, form_id=None):
        queryset = self.filter_queryset(self.get_queryset())
        format = request.data.get("format", "csv")
        
        # TODO: Implement export logic
        return Response({"url": "export_url_here"})


@api_view(['GET'])
@permission_classes([AllowAny])  # Auth is handled by signed URL
def download_file(request):
    """
    Download file using signed URL
    
    Query params:
    - file: File path
    - expires: Expiration timestamp
    - signature: HMAC signature
    """
    file_path = request.GET.get('file')
    expires = request.GET.get('expires')
    signature = request.GET.get('signature')
    
    if not all([file_path, expires, signature]):
        return HttpResponseForbidden("Invalid download link")
    
    # Determine which storage backend based on path
    if 'gdpr-export' in file_path:
        storage = gdpr_export_storage
    else:
        storage = form_upload_storage
    
    # Verify signature
    if not storage.verify_signed_url(file_path, expires, signature):
        return HttpResponseForbidden("Invalid or expired download link")
    
    # Get full file path
    full_path = os.path.join(storage.location, file_path)
    
    # Security check - prevent directory traversal
    if not os.path.abspath(full_path).startswith(os.path.abspath(storage.location)):
        return HttpResponseForbidden("Invalid file path")
    
    # Check if file exists
    if not os.path.exists(full_path):
        raise Http404("File not found")
    
    # Serve file
    with open(full_path, 'rb') as f:
        response = HttpResponse(f.read())
        
    # Set headers
    filename = os.path.basename(file_path)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    # Set content type based on extension
    if filename.endswith('.json'):
        response['Content-Type'] = 'application/json'
    elif filename.endswith('.csv'):
        response['Content-Type'] = 'text/csv'
    elif filename.endswith('.parquet'):
        response['Content-Type'] = 'application/octet-stream'
    else:
        response['Content-Type'] = 'application/octet-stream'
    
    # Security headers
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    
    return response