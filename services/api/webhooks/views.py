from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from core.models import Organization
from core.permissions import IsOrganizationAdmin
from core.pagination import StandardResultsSetPagination
from .models import Webhook, Delivery, DeadLetterQueue, WebhookLog
from .serializers import (
    WebhookSerializer, DeliverySerializer, DeadLetterQueueSerializer,
    WebhookLogSerializer, WebhookStatsSerializer, BulkRedriveSerializer
)
from .tasks import test_webhook_delivery, retry_webhook_delivery, bulk_redrive_dlq
from .filters import DeliveryFilter
import secrets


class WebhookViewSet(viewsets.ModelViewSet):
    queryset = Webhook.objects.all()
    serializer_class = WebhookSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['url']
    ordering_fields = ['created_at', 'total_deliveries', 'success_rate']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return self.queryset.filter(
            organization__memberships__user=self.request.user,
            organization__memberships__role__in=['owner', 'admin']
        ).annotate(
            success_rate_calc=Avg('deliveries__response_time_ms')
        )
    
    def perform_create(self, serializer):
        org_id = self.request.data.get("organization_id")
        organization = get_object_or_404(
            Organization,
            id=org_id,
            memberships__user=self.request.user,
            memberships__role__in=["owner", "admin"]
        )
        secret = secrets.token_urlsafe(32)
        serializer.save(organization=organization, secret=secret)
    
    @action(detail=True, methods=["post"])
    def test(self, request, pk=None):
        webhook = self.get_object()
        delivery_id = test_webhook_delivery.delay(webhook.id).get()
        return Response({
            "status": "test_queued",
            "delivery_id": delivery_id
        })
    
    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        webhook = self.get_object()
        webhook.active = not webhook.active
        webhook.save()
        return Response({
            "active": webhook.active
        })
    
    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        webhook = self.get_object()
        
        # Calculate 24h stats
        last_24h = timezone.now() - timedelta(hours=24)
        deliveries_24h = webhook.deliveries.filter(created_at__gte=last_24h)
        
        stats = {
            "total_deliveries": webhook.total_deliveries,
            "successful_deliveries": webhook.successful_deliveries,
            "failed_deliveries": webhook.failed_deliveries,
            "success_rate": webhook.success_rate,
            "deliveries_24h": deliveries_24h.count(),
            "success_24h": deliveries_24h.filter(status='success').count(),
            "failed_24h": deliveries_24h.filter(status='failed').count(),
            "avg_response_time_ms": deliveries_24h.filter(
                response_time_ms__isnull=False
            ).aggregate(avg=Avg('response_time_ms'))['avg'],
            "pending_retries": webhook.deliveries.filter(
                status='pending',
                next_retry_at__isnull=False
            ).count()
        }
        
        return Response(stats)


class DeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = DeliveryFilter
    search_fields = ['id', 'webhook__url']
    ordering_fields = ['created_at', 'delivered_at', 'response_time_ms']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return self.queryset.filter(
            webhook__organization__memberships__user=self.request.user
        ).select_related('webhook', 'submission', 'partial').prefetch_related('logs')
    
    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        delivery = self.get_object()
        if delivery.status not in ["failed", "dlq"]:
            return Response(
                {"error": "Only failed or DLQ deliveries can be retried"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        retry_webhook_delivery.delay(delivery.id)
        return Response({"status": "retry_queued"})
    
    @action(detail=True, methods=["get"])
    def logs(self, request, pk=None):
        delivery = self.get_object()
        logs = delivery.logs.all()
        serializer = WebhookLogSerializer(logs, many=True)
        return Response(serializer.data)


class DeadLetterQueueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DeadLetterQueue.objects.all()
    serializer_class = DeadLetterQueueSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ['-created_at']
    
    def get_queryset(self):
        return self.queryset.filter(
            delivery__webhook__organization__memberships__user=self.request.user,
            delivery__webhook__organization__memberships__role__in=['owner', 'admin']
        ).select_related('delivery__webhook')
    
    @action(detail=True, methods=["post"])
    def redrive(self, request, pk=None):
        dlq_entry = self.get_object()
        
        if dlq_entry.redriven_at:
            return Response(
                {"error": "DLQ entry already redriven"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from .tasks import redrive_dlq_entry
        redrive_dlq_entry.delay(dlq_entry.id)
        
        return Response({"status": "redrive_queued"})
    
    @action(detail=False, methods=["post"])
    def bulk_redrive(self, request):
        serializer = BulkRedriveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        webhook_id = serializer.validated_data.get('webhook_id')
        limit = serializer.validated_data.get('limit', 100)
        
        # Verify webhook ownership if specified
        if webhook_id:
            webhook = get_object_or_404(
                Webhook,
                id=webhook_id,
                organization__memberships__user=request.user,
                organization__memberships__role__in=['owner', 'admin']
            )
        
        count = bulk_redrive_dlq.delay(webhook_id, limit).get()
        
        return Response({
            "status": "bulk_redrive_queued",
            "count": count
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def webhook_statistics(request):
    """Global webhook statistics for the organization"""
    # Get user's organizations
    org_ids = Organization.objects.filter(
        memberships__user=request.user
    ).values_list('id', flat=True)
    
    # Calculate stats
    last_24h = timezone.now() - timedelta(hours=24)
    
    total_webhooks = Webhook.objects.filter(organization_id__in=org_ids).count()
    active_webhooks = Webhook.objects.filter(
        organization_id__in=org_ids,
        active=True
    ).count()
    
    deliveries_24h = Delivery.objects.filter(
        webhook__organization_id__in=org_ids,
        created_at__gte=last_24h
    )
    
    stats_data = {
        'total_webhooks': total_webhooks,
        'active_webhooks': active_webhooks,
        'total_deliveries_24h': deliveries_24h.count(),
        'successful_deliveries_24h': deliveries_24h.filter(status='success').count(),
        'failed_deliveries_24h': deliveries_24h.filter(status='failed').count(),
        'pending_deliveries': Delivery.objects.filter(
            webhook__organization_id__in=org_ids,
            status='pending'
        ).count(),
        'dlq_entries': DeadLetterQueue.objects.filter(
            delivery__webhook__organization_id__in=org_ids,
            redriven_at__isnull=True
        ).count(),
        'avg_response_time_ms': deliveries_24h.filter(
            response_time_ms__isnull=False
        ).aggregate(avg=Avg('response_time_ms'))['avg'] or 0
    }
    
    serializer = WebhookStatsSerializer(stats_data)
    return Response(serializer.data)