from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Organization, Form, FormVersion, Submission, Membership, AuditLog
from .serializers import (
    OrganizationSerializer, FormSerializer, FormVersionSerializer,
    SubmissionSerializer, FormImportSerializer, UserSerializer
)
from .permissions import IsOrganizationMember, IsOrganizationAdmin, CanEditForm
from .pagination import StandardResultsSetPagination
from .filters import FormFilter, SubmissionFilter, AuditLogFilter
from .mixins import AuditMixin

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


class FormViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = FormFilter
    search_fields = ['title', 'description', 'slug']
    ordering_fields = ['title', 'created_at', 'updated_at']
    ordering = ['-created_at']
    lookup_field = "id"
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'publish']:
            return [IsAuthenticated(), CanEditForm()]
        return [IsAuthenticated(), IsOrganizationMember()]
    
    def get_queryset(self):
        return self.queryset.filter(
            organization__memberships__user=self.request.user
        ).select_related('organization', 'created_by').prefetch_related('versions').distinct()
    
    def perform_create(self, serializer):
        org_id = self.request.data.get("organization_id")
        organization = get_object_or_404(
            Organization,
            id=org_id,
            memberships__user=self.request.user,
            memberships__role__in=['owner', 'admin', 'editor']
        )
        instance = serializer.save(organization=organization, created_by=self.request.user)
        instance._current_user = self.request.user
        
        # Create first version
        FormVersion.objects.create(
            form=instance,
            version=1,
            schema_json={"blocks": [], "settings": {}}
        )
    
    @action(detail=True, methods=["post"])
    def publish(self, request, id=None):
        form = self.get_object()
        version_id = request.data.get("version_id")
        canary_percent = request.data.get("canary_percent", 0)
        
        if not version_id:
            # Publish latest version
            version = form.versions.first()
        else:
            version = get_object_or_404(FormVersion, id=version_id, form=form)
        
        if not version:
            return Response(
                {"error": "No version to publish"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        version.published_at = timezone.now()
        version.canary_percent = canary_percent
        version._current_user = request.user
        version.save()
        
        form.status = "published"
        form._current_user = request.user
        form.save()
        
        return Response({
            "status": "published",
            "version": version.version,
            "canary_percent": canary_percent
        })
    
    @action(detail=True, methods=["post"])
    def duplicate(self, request, id=None):
        form = self.get_object()
        
        # Create new form with copied data
        new_form = Form.objects.create(
            organization=form.organization,
            title=f"{form.title} (Copy)",
            slug=f"{form.slug}-copy-{timezone.now().timestamp()}",
            description=form.description,
            status="draft",
            default_locale=form.default_locale,
            created_by=request.user
        )
        
        # Copy latest version
        latest_version = form.versions.first()
        if latest_version:
            FormVersion.objects.create(
                form=new_form,
                version=1,
                schema_json=latest_version.schema_json,
                theme_json=latest_version.theme_json
            )
        
        serializer = self.get_serializer(new_form)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=["post"])
    def import_form(self, request, slug=None):
        form = self.get_object()
        serializer = FormImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # TODO: Implement import logic
        return Response({"status": "imported"})


class FormVersionViewSet(viewsets.ModelViewSet):
    queryset = FormVersion.objects.all()
    serializer_class = FormVersionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        form_id = self.kwargs.get("form_id")
        return self.queryset.filter(
            form_id=form_id,
            form__organization__memberships__user=self.request.user
        )
    
    def perform_create(self, serializer):
        form_id = self.kwargs.get("form_id")
        form = get_object_or_404(
            Form,
            id=form_id,
            organization__memberships__user=self.request.user
        )
        last_version = form.versions.first()
        new_version = (last_version.version + 1) if last_version else 1
        serializer.save(form=form, version=new_version)


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