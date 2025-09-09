from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WebhookViewSet, DeliveryViewSet, DeadLetterQueueViewSet, webhook_statistics

router = DefaultRouter()
router.register(r"webhooks", WebhookViewSet, basename="webhook")
router.register(r"webhook-deliveries", DeliveryViewSet, basename="delivery")
router.register(r"webhook-dlq", DeadLetterQueueViewSet, basename="dlq")

urlpatterns = [
    path("webhook-stats/", webhook_statistics, name="webhook-stats"),
    path("", include(router.urls)),
]