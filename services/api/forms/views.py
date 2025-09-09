from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema

from .models import Form
from .serializers import FormSerializer
from core.permissions import IsOwner
from importers.service import ImportService


class FormViewSet(viewsets.ModelViewSet):
    """Forms management"""
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = Form.objects.all()
    
    def get_queryset(self):
        return self.queryset.filter(
            organization=self.request.user.membership.organization
        )
    
    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.membership.organization,
            created_by=self.request.user
        )
    
    @extend_schema(
        summary="Import form from external source",
        request={
            "type": "object",
            "required": ["type", "source"],
            "properties": {
                "type": {"type": "string", "enum": ["typeform", "google_forms"]},
                "source": {"type": "string", "description": "URL or ID of the form to import"},
                "credentials": {"type": "object", "description": "Source-specific credentials"}
            }
        }
    )
    @action(detail=False, methods=['post'], url_path='import')
    def import_form(self, request):
        """Import a form from Typeform or Google Forms"""
        source_type = request.data.get('type')
        source = request.data.get('source')
        credentials = request.data.get('credentials', {})
        
        if not source_type or not source:
            return Response(
                {'error': 'Both type and source are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = ImportService()
        
        try:
            result = service.import_form(
                source_type=source_type,
                source=source,
                credentials=credentials,
                organization=request.user.membership.organization,
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
                "type": {"type": "string", "enum": ["typeform", "google_forms"]},
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
                "type": {"type": "string", "enum": ["typeform", "google_forms"]},
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