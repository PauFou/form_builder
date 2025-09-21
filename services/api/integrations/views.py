from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from .models import Integration, IntegrationConnection, IntegrationLog
from .serializers import (
    IntegrationSerializer,
    IntegrationConnectionSerializer,
    IntegrationLogSerializer,
    TestIntegrationSerializer,
    IntegrationOAuthSerializer
)
from .services import IntegrationService
from core.permissions import IsOwner


class IntegrationViewSet(viewsets.ModelViewSet):
    """
    Manage third-party integrations
    """
    serializer_class = IntegrationSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = Integration.objects.all()
    
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
        summary="Test integration connection",
        request=TestIntegrationSerializer,
        responses={200: {"type": "object", "properties": {"success": {"type": "boolean"}, "message": {"type": "string"}}}}
    )
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test integration with sample data"""
        integration = self.get_object()
        serializer = TestIntegrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = IntegrationService()
        result = service.test_integration(
            integration,
            sample_data=serializer.validated_data.get('sample_data', {})
        )
        
        return Response(result)
    
    @extend_schema(
        summary="Initiate OAuth flow",
        responses={200: {"type": "object", "properties": {"auth_url": {"type": "string"}}}}
    )
    @action(detail=True, methods=['post'])
    def oauth_start(self, request, pk=None):
        """Start OAuth authentication flow"""
        integration = self.get_object()
        
        service = IntegrationService()
        auth_url = service.get_oauth_url(integration)
        
        return Response({'auth_url': auth_url})
    
    @extend_schema(
        summary="Complete OAuth flow",
        request=IntegrationOAuthSerializer
    )
    @action(detail=True, methods=['post'])
    def oauth_callback(self, request, pk=None):
        """Complete OAuth authentication"""
        integration = self.get_object()
        serializer = IntegrationOAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = IntegrationService()
        try:
            service.complete_oauth(
                integration,
                code=serializer.validated_data['code'],
                state=serializer.validated_data['state']
            )
            
            integration.status = 'active'
            integration.save()
            
            return Response({'success': True})
        except Exception as e:
            integration.status = 'error'
            integration.error_message = str(e)
            integration.save()
            
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Sync integration data",
        responses={200: IntegrationSerializer}
    )
    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Manually sync integration data"""
        integration = self.get_object()
        
        service = IntegrationService()
        try:
            service.sync_integration(integration)
            integration.last_sync_at = timezone.now()
            integration.status = 'active'
            integration.error_message = None
            integration.save()
        except Exception as e:
            integration.status = 'error'
            integration.error_message = str(e)
            integration.save()
        
        serializer = self.get_serializer(integration)
        return Response(serializer.data)


class IntegrationConnectionViewSet(viewsets.ModelViewSet):
    """
    Manage connections between forms and integrations
    """
    serializer_class = IntegrationConnectionSerializer
    permission_classes = [IsAuthenticated]
    queryset = IntegrationConnection.objects.all()
    
    def get_queryset(self):
        queryset = self.queryset.filter(
            form__organization=self.request.user.membership.organization
        )
        
        # Filter by form if specified
        form_id = self.request.query_params.get('form')
        if form_id:
            queryset = queryset.filter(form_id=form_id)
        
        # Filter by integration if specified
        integration_id = self.request.query_params.get('integration')
        if integration_id:
            queryset = queryset.filter(integration_id=integration_id)
        
        return queryset.select_related('form', 'integration')
    
    def perform_create(self, serializer):
        # Verify user has access to both form and integration
        form = serializer.validated_data['form']
        integration = serializer.validated_data['integration']
        
        if form.organization != self.request.user.membership.organization:
            raise PermissionError("You don't have access to this form")
        
        if integration.organization != self.request.user.membership.organization:
            raise PermissionError("You don't have access to this integration")
        
        serializer.save()
    
    @extend_schema(
        summary="Test connection with sample data",
        request=TestIntegrationSerializer
    )
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test connection with sample form data"""
        connection = self.get_object()
        serializer = TestIntegrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = IntegrationService()
        result = service.test_connection(
            connection,
            sample_data=serializer.validated_data.get('sample_data', {})
        )
        
        return Response(result)
    
    @extend_schema(
        summary="Get field mapping suggestions",
        responses={200: {"type": "object", "properties": {"suggestions": {"type": "object"}}}}
    )
    @action(detail=True, methods=['get'])
    def mapping_suggestions(self, request, pk=None):
        """Get suggested field mappings based on field names and types"""
        connection = self.get_object()
        
        service = IntegrationService()
        suggestions = service.get_field_mapping_suggestions(connection)
        
        return Response({'suggestions': suggestions})


class IntegrationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View integration execution logs
    """
    serializer_class = IntegrationLogSerializer
    permission_classes = [IsAuthenticated]
    queryset = IntegrationLog.objects.all()
    
    def get_queryset(self):
        queryset = self.queryset.filter(
            connection__form__organization=self.request.user.membership.organization
        )
        
        # Filter by connection
        connection_id = self.request.query_params.get('connection')
        if connection_id:
            queryset = queryset.filter(connection_id=connection_id)
        
        # Filter by status
        log_status = self.request.query_params.get('status')
        if log_status:
            queryset = queryset.filter(status=log_status)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset.select_related('connection__form', 'connection__integration')
    
    @extend_schema(
        summary="Retry failed integration",
        responses={200: IntegrationLogSerializer}
    )
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry a failed integration execution"""
        log = self.get_object()
        
        if log.status != 'failed':
            return Response(
                {'error': 'Only failed integrations can be retried'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create retry task
        from integrations.tasks import process_integration_log
        process_integration_log.delay(str(log.id))
        
        log.status = 'pending'
        log.retry_count += 1
        log.save()
        
        serializer = self.get_serializer(log)
        return Response(serializer.data)