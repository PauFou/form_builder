"""
Analytics API views with direct ClickHouse integration
"""
import logging
from datetime import datetime
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import views, status, permissions
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from forms.models import Form
from .serializers import (
    FormAnalyticsSerializer,
    FieldAnalyticsSerializer,
    TimeSeriesSerializer,
    FunnelAnalyticsSerializer,
    ReferrerAnalyticsSerializer,
    DeviceAnalyticsSerializer,
    EventTrackingSerializer,
    BatchEventTrackingSerializer,
    AnalyticsMetricsResponseSerializer,
    FieldAnalyticsResponseSerializer,
    TimeSeriesDataPointSerializer,
    FunnelAnalyticsResponseSerializer,
    ReferrerDataSerializer,
    DeviceBreakdownSerializer
)
from .clickhouse_client import ClickHouseClient, ClickHouseError

logger = logging.getLogger(__name__)


class FormAnalyticsView(views.APIView):
    """Get analytics metrics for a specific form"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('end_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('metrics', OpenApiTypes.STR, many=True, required=False)
        ],
        responses={200: AnalyticsMetricsResponseSerializer}
    )
    def get(self, request, form_id):
        # Check form access
        _form = get_object_or_404(
            Form.objects.filter(organization__members=request.user),
            id=form_id
        )
        
        # Validate query parameters
        serializer = FormAnalyticsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        # Convert dates to datetime
        start_date = datetime.combine(
            serializer.validated_data['start_date'],
            datetime.min.time()
        ).replace(tzinfo=timezone.utc)
        end_date = datetime.combine(
            serializer.validated_data['end_date'],
            datetime.max.time()
        ).replace(tzinfo=timezone.utc)
        
        try:
            client = ClickHouseClient()
            analytics_data = client.get_form_analytics(
                str(form_id),
                start_date,
                end_date,
                serializer.validated_data.get('metrics')
            )
            
            response_serializer = AnalyticsMetricsResponseSerializer(data=analytics_data)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(response_serializer.validated_data)
            
        except ClickHouseError as e:
            logger.error(f"ClickHouse error for form {form_id}: {str(e)}")
            return Response(
                {"error": "Failed to retrieve analytics data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FieldAnalyticsView(views.APIView):
    """Get field-level analytics for a form"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('end_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('field_ids', OpenApiTypes.UUID, many=True, required=False)
        ],
        responses={200: FieldAnalyticsResponseSerializer(many=True)}
    )
    def get(self, request, form_id):
        # Check form access
        _form = get_object_or_404(
            Form.objects.filter(organization__members=request.user),
            id=form_id
        )
        
        # Validate query parameters
        serializer = FieldAnalyticsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        # Convert dates to datetime
        start_date = datetime.combine(
            serializer.validated_data['start_date'],
            datetime.min.time()
        ).replace(tzinfo=timezone.utc)
        end_date = datetime.combine(
            serializer.validated_data['end_date'],
            datetime.max.time()
        ).replace(tzinfo=timezone.utc)
        
        try:
            client = ClickHouseClient()
            field_data = client.get_field_analytics(
                str(form_id),
                start_date,
                end_date
            )
            
            response_serializer = FieldAnalyticsResponseSerializer(data=field_data, many=True)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(response_serializer.validated_data)
            
        except ClickHouseError as e:
            logger.error(f"ClickHouse error for form {form_id}: {str(e)}")
            return Response(
                {"error": "Failed to retrieve field analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TimeSeriesAnalyticsView(views.APIView):
    """Get time series data for a specific metric"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('end_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('metric', OpenApiTypes.STR, required=True),
            OpenApiParameter('interval', OpenApiTypes.STR, required=False)
        ],
        responses={200: TimeSeriesDataPointSerializer(many=True)}
    )
    def get(self, request, form_id):
        # Check form access
        _form = get_object_or_404(
            Form.objects.filter(organization__members=request.user),
            id=form_id
        )
        
        # Validate query parameters
        serializer = TimeSeriesSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        # Convert dates to datetime
        start_date = datetime.combine(
            serializer.validated_data['start_date'],
            datetime.min.time()
        ).replace(tzinfo=timezone.utc)
        end_date = datetime.combine(
            serializer.validated_data['end_date'],
            datetime.max.time()
        ).replace(tzinfo=timezone.utc)
        
        try:
            client = ClickHouseClient()
            time_series_data = client.get_time_series_data(
                str(form_id),
                serializer.validated_data['metric'],
                start_date,
                end_date,
                serializer.validated_data['interval']
            )
            
            response_serializer = TimeSeriesDataPointSerializer(data=time_series_data, many=True)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(response_serializer.validated_data)
            
        except ClickHouseError as e:
            logger.error(f"ClickHouse error for form {form_id}: {str(e)}")
            return Response(
                {"error": "Failed to retrieve time series data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FunnelAnalyticsView(views.APIView):
    """Get funnel analytics for multi-step forms"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('end_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('include_drop_off', OpenApiTypes.BOOL, required=False)
        ],
        responses={200: FunnelAnalyticsResponseSerializer}
    )
    def get(self, request, form_id):
        # Check form access
        _form = get_object_or_404(
            Form.objects.filter(organization__members=request.user),
            id=form_id
        )
        
        # Validate query parameters
        serializer = FunnelAnalyticsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        # Convert dates to datetime
        start_date = datetime.combine(
            serializer.validated_data['start_date'],
            datetime.min.time()
        ).replace(tzinfo=timezone.utc)
        end_date = datetime.combine(
            serializer.validated_data['end_date'],
            datetime.max.time()
        ).replace(tzinfo=timezone.utc)
        
        try:
            client = ClickHouseClient()
            funnel_data = client.get_funnel_analytics(
                str(form_id),
                start_date,
                end_date
            )
            
            response_serializer = FunnelAnalyticsResponseSerializer(data=funnel_data)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(response_serializer.validated_data)
            
        except ClickHouseError as e:
            logger.error(f"ClickHouse error for form {form_id}: {str(e)}")
            return Response(
                {"error": "Failed to retrieve funnel analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReferrerAnalyticsView(views.APIView):
    """Get top referrers for a form"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('end_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('limit', OpenApiTypes.INT, required=False)
        ],
        responses={200: ReferrerDataSerializer(many=True)}
    )
    def get(self, request, form_id):
        # Check form access
        _form = get_object_or_404(
            Form.objects.filter(organization__members=request.user),
            id=form_id
        )
        
        # Validate query parameters
        serializer = ReferrerAnalyticsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        # Convert dates to datetime
        start_date = datetime.combine(
            serializer.validated_data['start_date'],
            datetime.min.time()
        ).replace(tzinfo=timezone.utc)
        end_date = datetime.combine(
            serializer.validated_data['end_date'],
            datetime.max.time()
        ).replace(tzinfo=timezone.utc)
        
        try:
            client = ClickHouseClient()
            referrer_data = client.get_top_referrers(
                str(form_id),
                start_date,
                end_date,
                serializer.validated_data['limit']
            )
            
            response_serializer = ReferrerDataSerializer(data=referrer_data, many=True)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(response_serializer.validated_data)
            
        except ClickHouseError as e:
            logger.error(f"ClickHouse error for form {form_id}: {str(e)}")
            return Response(
                {"error": "Failed to retrieve referrer analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeviceAnalyticsView(views.APIView):
    """Get device breakdown for a form"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('end_date', OpenApiTypes.DATE, required=True),
            OpenApiParameter('group_by', OpenApiTypes.STR, required=False)
        ],
        responses={200: DeviceBreakdownSerializer}
    )
    def get(self, request, form_id):
        # Check form access
        _form = get_object_or_404(
            Form.objects.filter(organization__members=request.user),
            id=form_id
        )
        
        # Validate query parameters
        serializer = DeviceAnalyticsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        # Convert dates to datetime
        start_date = datetime.combine(
            serializer.validated_data['start_date'],
            datetime.min.time()
        ).replace(tzinfo=timezone.utc)
        end_date = datetime.combine(
            serializer.validated_data['end_date'],
            datetime.max.time()
        ).replace(tzinfo=timezone.utc)
        
        try:
            client = ClickHouseClient()
            device_data = client.get_device_breakdown(
                str(form_id),
                start_date,
                end_date
            )
            
            response_serializer = DeviceBreakdownSerializer(data=device_data)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(response_serializer.validated_data)
            
        except ClickHouseError as e:
            logger.error(f"ClickHouse error for form {form_id}: {str(e)}")
            return Response(
                {"error": "Failed to retrieve device analytics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventTrackingView(views.APIView):
    """Track analytics events"""
    permission_classes = [permissions.AllowAny]  # Allow anonymous tracking
    
    @extend_schema(
        request=EventTrackingSerializer,
        responses={204: None}
    )
    def post(self, request):
        serializer = EventTrackingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            client = ClickHouseClient()
            event_data = serializer.validated_data
            event_type = event_data.pop('event_type')
            
            # Add common fields
            event_data['ip_address'] = self._get_client_ip(request)
            event_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
            
            # Route to appropriate table
            if event_type == 'view':
                success = client.insert_event('form_views', event_data)
            elif event_type == 'interaction':
                success = client.insert_event('form_interactions', event_data)
            elif event_type == 'submission':
                success = client.insert_event('form_submissions', event_data)
            
            if not success:
                return Response(
                    {"error": "Failed to track event"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error(f"Error tracking event: {str(e)}")
            return Response(
                {"error": "Failed to track event"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class BatchEventTrackingView(views.APIView):
    """Track multiple analytics events in batch"""
    permission_classes = [permissions.AllowAny]  # Allow anonymous tracking
    
    @extend_schema(
        request=BatchEventTrackingSerializer,
        responses={204: None}
    )
    def post(self, request):
        serializer = BatchEventTrackingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            client = ClickHouseClient()
            events_by_type = {
                'view': [],
                'interaction': [],
                'submission': []
            }
            
            # Group events by type
            for event_data in serializer.validated_data['events']:
                event_type = event_data.pop('event_type')
                
                # Add common fields
                event_data['ip_address'] = self._get_client_ip(request)
                event_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
                
                events_by_type[event_type].append(event_data)
            
            # Insert batches
            if events_by_type['view']:
                client.insert_batch('form_views', events_by_type['view'])
            if events_by_type['interaction']:
                client.insert_batch('form_interactions', events_by_type['interaction'])
            if events_by_type['submission']:
                client.insert_batch('form_submissions', events_by_type['submission'])
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error(f"Error tracking batch events: {str(e)}")
            return Response(
                {"error": "Failed to track events"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip