from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WebhookViewSet, DeliveryViewSet, DeadLetterQueueViewSet, webhook_statistics
from .webhook_receiver import receive_webhook

router = DefaultRouter()
router.register(r"webhooks", WebhookViewSet, basename="webhook")
router.register(r"webhook-deliveries", DeliveryViewSet, basename="delivery")
router.register(r"webhook-dlq", DeadLetterQueueViewSet, basename="dlq")

urlpatterns = [
    path("webhook-stats/", webhook_statistics, name="webhook-stats"),
    path("webhook-receiver/<uuid:webhook_id>/", receive_webhook, name="webhook-receiver"),
    path("", include(router.urls)),
]