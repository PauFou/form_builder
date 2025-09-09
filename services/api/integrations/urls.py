from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import IntegrationViewSet, IntegrationConnectionViewSet, IntegrationLogViewSet

router = DefaultRouter()
router.register('integrations', IntegrationViewSet, basename='integration')
router.register('integration-connections', IntegrationConnectionViewSet, basename='integration-connection')
router.register('integration-logs', IntegrationLogViewSet, basename='integration-log')

urlpatterns = [
    path('', include(router.urls)),
]