from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DataResidencyConfigViewSet, DataRetentionPolicyViewSet,
    PIIFieldConfigViewSet, ConsentRecordViewSet,
    DataProcessingAgreementViewSet, DataDeletionRequestViewSet,
    DataExportRequestViewSet, GDPRComplianceStatusViewSet
)

router = DefaultRouter()
router.register(r'residency', DataResidencyConfigViewSet, basename='residency')
router.register(r'retention', DataRetentionPolicyViewSet, basename='retention')
router.register(r'pii-fields', PIIFieldConfigViewSet, basename='pii-fields')
router.register(r'consent', ConsentRecordViewSet, basename='consent')
router.register(r'dpa', DataProcessingAgreementViewSet, basename='dpa')
router.register(r'deletion-requests', DataDeletionRequestViewSet, basename='deletion-requests')
router.register(r'export-requests', DataExportRequestViewSet, basename='export-requests')
router.register(r'compliance', GDPRComplianceStatusViewSet, basename='compliance')

app_name = 'gdpr'

urlpatterns = [
    path('', include(router.urls)),
]