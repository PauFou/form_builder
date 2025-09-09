from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from core.models import Organization
from .models import Webhook, Delivery
from .serializers import WebhookSerializer, DeliverySerializer
from .tasks import test_webhook_delivery, retry_webhook_delivery
import secrets


class WebhookViewSet(viewsets.ModelViewSet):
    queryset = Webhook.objects.all()
    serializer_class = WebhookSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(
            organization__memberships__user=self.request.user
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
        test_webhook_delivery.delay(webhook.id)
        return Response({"status": "test_queued"})


class DeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "webhook"]
    
    def get_queryset(self):
        return self.queryset.filter(
            webhook__organization__memberships__user=self.request.user
        ).select_related("webhook", "submission", "partial")
    
    @action(detail=True, methods=["post"])
    def redrive(self, request, pk=None):
        delivery = self.get_object()
        if delivery.status != "failed":
            return Response(
                {"error": "Only failed deliveries can be redriven"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        retry_webhook_delivery.delay(delivery.id)
        return Response({"status": "redrive_queued"})