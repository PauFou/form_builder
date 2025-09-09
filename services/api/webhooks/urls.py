from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WebhookViewSet, DeliveryViewSet

router = DefaultRouter()
router.register(r"webhooks", WebhookViewSet, basename="webhook")
router.register(r"webhook-deliveries", DeliveryViewSet, basename="delivery")

urlpatterns = [
    path("", include(router.urls)),
]