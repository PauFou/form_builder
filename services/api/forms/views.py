from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from .models import Form, FormVersion
from .serializers import FormSerializer, FormVersionSerializer, FormImportSerializer
from .filters import FormFilter
from core.models import Organization
from core.permissions import IsOrganizationMember, IsOrganizationAdmin, CanEditForm
from core.pagination import StandardResultsSetPagination
from core.mixins import AuditMixin
from importers.service import ImportService


class FormViewSet(AuditMixin, viewsets.ModelViewSet):
    """Forms management"""
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
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'publish', 'unpublish']:
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
        
        # Generate a slug if not provided
        if 'slug' not in serializer.validated_data or not serializer.validated_data['slug']:
            from django.utils.text import slugify
            import time
            base_slug = slugify(serializer.validated_data.get('title', 'untitled'))
            slug = f"{base_slug}-{int(time.time())}"
            serializer.validated_data['slug'] = slug
        
        # Initialize empty pages if not provided
        if 'pages' not in serializer.validated_data or not serializer.validated_data['pages']:
            serializer.validated_data['pages'] = [{
                'id': 'page-1',
                'title': 'Page 1',
                'blocks': []
            }]
        
        # Initialize empty objects for other fields
        if 'logic' not in serializer.validated_data:
            serializer.validated_data['logic'] = {'rules': []}
        if 'theme' not in serializer.validated_data:
            serializer.validated_data['theme'] = {}
        if 'settings' not in serializer.validated_data:
            serializer.validated_data['settings'] = {}
            
        instance = serializer.save(organization=organization, created_by=self.request.user)
        instance._current_user = self.request.user
        
        # Create first version
        FormVersion.objects.create(
            form=instance,
            version=1,
            schema={"blocks": [], "settings": {}}
        )
    
    @extend_schema(
        summary="Publish a form",
        description="Publish a form version with optional canary deployment percentage",
        request={
            "type": "object",
            "properties": {
                "version_id": {
                    "type": "string",
                    "format": "uuid",
                    "description": "Specific version ID to publish. If not provided, publishes the latest version."
                },
                "canary_percentage": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100,
                    "default": 0,
                    "description": "Percentage of traffic for canary deployment"
                }
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["published"]},
                    "version": {"type": "integer"},
                    "canary_percentage": {"type": "integer"}
                }
            },
            400: {
                "type": "object",
                "properties": {
                    "error": {"type": "string"}
                }
            }
        }
    )
    @action(detail=True, methods=["post"])
    def publish(self, request, id=None):
        form = self.get_object()
        version_id = request.data.get("version_id")
        canary_percentage = request.data.get("canary_percentage", 0)
        
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
        version.canary_percentage = canary_percentage
        version._current_user = request.user
        version.save()
        
        form.status = "published"
        form._current_user = request.user
        form.save()
        
        return Response({
            "status": "published",
            "version": version.version,
            "canary_percentage": canary_percentage
        })
    
    @extend_schema(
        summary="Unpublish a form",
        description="Unpublish a form by setting its status back to draft. Optionally unpublish all versions or just the latest.",
        request={
            "type": "object",
            "properties": {
                "unpublish_all_versions": {
                    "type": "boolean",
                    "default": False,
                    "description": "If true, unpublish all versions. If false, only unpublish the latest published version."
                }
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["draft"]},
                    "message": {"type": "string"}
                }
            },
            400: {
                "type": "object",
                "properties": {
                    "error": {"type": "string"}
                }
            }
        }
    )
    @action(detail=True, methods=["post"])
    def unpublish(self, request, id=None):
        """Unpublish a form by setting its status back to draft"""
        form = self.get_object()
        
        # Check if form is currently published
        if form.status != "published":
            return Response(
                {"error": "Form is not currently published"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set form status back to draft
        form.status = "draft"
        form._current_user = request.user
        form.save()
        
        # Optionally unpublish all versions or just the latest
        unpublish_all = request.data.get("unpublish_all_versions", False)
        
        if unpublish_all:
            # Unpublish all versions
            form.versions.filter(published_at__isnull=False).update(
                published_at=None,
                canary_percentage=0
            )
            message = "All versions unpublished"
        else:
            # Just unpublish the most recently published version
            latest_published = form.versions.filter(published_at__isnull=False).first()
            if latest_published:
                latest_published.published_at = None
                latest_published.canary_percentage = 0
                latest_published._current_user = request.user
                latest_published.save()
                message = f"Version {latest_published.version} unpublished"
            else:
                message = "No published version found"
        
        return Response({
            "status": "draft",
            "message": message
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
                schema=latest_version.schema,
                theme=latest_version.theme
            )
        
        serializer = self.get_serializer(new_form)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        summary="Import form from external source",
        request={
            "type": "object",
            "required": ["type", "source"],
            "properties": {
                "type": {"type": "string", "enum": ["typeform", "google_forms", "tally"]},
                "source": {"type": "string", "description": "URL or ID of the form to import"},
                "credentials": {"type": "object", "description": "Source-specific credentials"}
            }
        }
    )
    @action(detail=False, methods=['post'], url_path='import')
    def import_form(self, request):
        """Import a form from Typeform, Google Forms, or Tally"""
        source_type = request.data.get('type')
        source = request.data.get('source')
        credentials = request.data.get('credentials', {})
        
        if not source_type or not source:
            return Response(
                {'error': 'Both type and source are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get organization from request
        org_id = request.data.get("organization_id")
        if org_id:
            organization = get_object_or_404(
                Organization,
                id=org_id,
                memberships__user=request.user,
                memberships__role__in=['owner', 'admin', 'editor']
            )
        else:
            # Try to get user's primary organization
            membership = request.user.memberships.filter(
                role__in=['owner', 'admin', 'editor']
            ).first()
            if not membership:
                return Response(
                    {'error': 'No organization found for user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            organization = membership.organization
        
        service = ImportService()
        
        try:
            result = service.import_form(
                source_type=source_type,
                source=source,
                credentials=credentials,
                organization=organization,
                user=request.user
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Import failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Validate import source",
        request={
            "type": "object",
            "required": ["type", "source"],
            "properties": {
                "type": {"type": "string", "enum": ["typeform", "google_forms", "tally"]},
                "source": {"type": "string"}
            }
        }
    )
    @action(detail=False, methods=['post'], url_path='import/validate')
    def validate_import(self, request):
        """Validate import source without importing"""
        source_type = request.data.get('type')
        source = request.data.get('source')
        
        if not source_type or not source:
            return Response(
                {'error': 'Both type and source are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = ImportService()
        
        try:
            result = service.validate_source(source_type, source)
            return Response(result)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Preview import without creating form",
        request={
            "type": "object", 
            "required": ["type", "source"],
            "properties": {
                "type": {"type": "string", "enum": ["typeform", "google_forms", "tally"]},
                "source": {"type": "string"},
                "credentials": {"type": "object"}
            }
        }
    )
    @action(detail=False, methods=['post'], url_path='import/preview')
    def preview_import(self, request):
        """Preview what will be imported"""
        source_type = request.data.get('type')
        source = request.data.get('source')
        credentials = request.data.get('credentials', {})
        
        if not source_type or not source:
            return Response(
                {'error': 'Both type and source are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = ImportService()
        result = service.preview_import(source_type, source, credentials)
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Get import requirements for a source type"
    )
    @action(detail=False, methods=['get'], url_path='import/requirements/(?P<source_type>[^/.]+)')
    def import_requirements(self, request, source_type=None):
        """Get requirements for importing from a specific source"""
        service = ImportService()
        
        try:
            requirements = service.get_import_requirements(source_type)
            return Response(requirements)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


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