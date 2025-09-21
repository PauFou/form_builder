from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings

from .models import (
    DataResidencyConfig, DataRetentionPolicy, PIIFieldConfig,
    ConsentRecord, DataProcessingAgreement, DataDeletionRequest,
    DataExportRequest
)
from .serializers import (
    DataResidencyConfigSerializer, DataRetentionPolicySerializer,
    PIIFieldConfigSerializer, ConsentRecordSerializer,
    DataProcessingAgreementSerializer, SignDPASerializer,
    DataDeletionRequestSerializer, VerifyDeletionRequestSerializer,
    ProcessDeletionRequestSerializer, DataExportRequestSerializer,
    DPATemplateSerializer
)
from .tasks import (
    process_deletion_request, process_export_request
)
from core.models import Organization, AuditLog
from core.permissions import IsOrganizationMember
from forms.models import Form


class DataResidencyConfigViewSet(viewsets.ModelViewSet):
    serializer_class = DataResidencyConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    
    def get_queryset(self):
        return DataResidencyConfig.objects.filter(
            organization__memberships__user=self.request.user
        )
    
    def perform_create(self, serializer):
        # Ensure one config per organization
        org_id = self.request.data.get('organization')
        if DataResidencyConfig.objects.filter(organization_id=org_id).exists():
            raise serializers.ValidationError(
                "Data residency configuration already exists for this organization"
            )
        serializer.save()


class DataRetentionPolicyViewSet(viewsets.ModelViewSet):
    serializer_class = DataRetentionPolicySerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    
    def get_queryset(self):
        return DataRetentionPolicy.objects.filter(
            organization__memberships__user=self.request.user
        ).select_related('organization', 'form')
    
    @action(detail=False, methods=['post'])
    def apply_default(self, request):
        """Apply default retention policy to organization"""
        org_id = request.data.get('organization_id')
        try:
            org = Organization.objects.get(
                id=org_id,
                memberships__user=request.user
            )
        except Organization.DoesNotExist:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        policy, created = DataRetentionPolicy.objects.get_or_create(
            organization=org,
            form=None,
            defaults={
                'submission_retention_days': 365,
                'partial_retention_days': 30,
                'attachment_retention_days': 365,
                'audit_log_retention_days': 730,
                'auto_delete_enabled': False,
                'deletion_notification_days': 30
            }
        )
        
        serializer = self.get_serializer(policy)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PIIFieldConfigViewSet(viewsets.ModelViewSet):
    serializer_class = PIIFieldConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    
    def get_queryset(self):
        return PIIFieldConfig.objects.filter(
            form__organization__memberships__user=self.request.user
        ).select_related('form')
    
    @action(detail=False, methods=['post'])
    def auto_detect(self, request):
        """Auto-detect PII fields in a form"""
        form_id = request.data.get('form_id')
        try:
            form = Form.objects.get(
                id=form_id,
                organization__memberships__user=request.user
            )
        except Form.DoesNotExist:
            return Response(
                {"error": "Form not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Patterns for auto-detection
        pii_patterns = {
            'email': ['email', 'e-mail', 'mail'],
            'phone': ['phone', 'tel', 'mobile', 'cell'],
            'name': ['name', 'firstname', 'lastname', 'surname'],
            'address': ['address', 'street', 'city', 'zip', 'postal'],
            'ssn': ['ssn', 'social', 'security'],
            'credit_card': ['card', 'credit', 'payment'],
        }
        
        detected_fields = []
        
        # Scan form pages and blocks
        for page in form.pages:
            for block in page.get('blocks', []):
                field_id = block.get('id')
                field_label = block.get('label', '').lower()
                block.get('type')
                
                # Check if field matches any PII pattern
                for pii_type, patterns in pii_patterns.items():
                    if any(pattern in field_label for pattern in patterns):
                        config, created = PIIFieldConfig.objects.get_or_create(
                            form=form,
                            field_id=field_id,
                            defaults={
                                'field_type': pii_type,
                                'encrypt_at_rest': pii_type in ['ssn', 'credit_card'],
                                'mask_in_exports': True,
                                'mask_in_ui': pii_type in ['ssn', 'credit_card'],
                                'require_consent': True
                            }
                        )
                        detected_fields.append(PIIFieldConfigSerializer(config).data)
        
        return Response({
            'detected_count': len(detected_fields),
            'fields': detected_fields
        })


class ConsentRecordViewSet(viewsets.ModelViewSet):
    serializer_class = ConsentRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    
    def get_queryset(self):
        return ConsentRecord.objects.filter(
            form__organization__memberships__user=self.request.user
        ).select_related('form', 'submission')
    
    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Withdraw consent"""
        consent = self.get_object()
        consent.granted = False
        consent.withdrawal_date = timezone.now()
        consent.save()
        
        # Log the withdrawal
        AuditLog.objects.create(
            organization=consent.form.organization,
            actor=request.user,
            action='consent_withdrawn',
            entity='consent_record',
            entity_id=str(consent.id),
            diff_json={'consent_type': consent.consent_type}
        )
        
        return Response({'status': 'consent withdrawn'})


class DataProcessingAgreementViewSet(viewsets.ModelViewSet):
    serializer_class = DataProcessingAgreementSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    
    def get_queryset(self):
        return DataProcessingAgreement.objects.filter(
            organization__memberships__user=self.request.user
        ).select_related('organization')
    
    @action(detail=False, methods=['get'])
    def template(self, request):
        """Get default DPA template"""
        org_id = request.query_params.get('organization_id')
        try:
            org = Organization.objects.get(
                id=org_id,
                memberships__user=request.user
            )
        except Organization.DoesNotExist:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        template_content = self._generate_dpa_template(org)
        
        serializer = DPATemplateSerializer({
            'version': '2.0',
            'content': template_content,
            'organization': org.name,
            'date': timezone.now()
        })
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """Sign a DPA"""
        dpa = self.get_object()
        if dpa.signed:
            return Response(
                {"error": "DPA already signed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SignDPASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.update(dpa, serializer.validated_data)
        
        # Generate signed document (placeholder - integrate with PDF service)
        # dpa.signed_document_url = generate_signed_pdf(dpa)
        # dpa.save()
        
        # Log the signing
        AuditLog.objects.create(
            organization=dpa.organization,
            actor=request.user,
            action='dpa_signed',
            entity='dpa',
            entity_id=str(dpa.id),
            diff_json={'version': dpa.version, 'signatory': dpa.signatory_email}
        )
        
        return Response(DataProcessingAgreementSerializer(dpa).data)
    
    def _generate_dpa_template(self, organization):
        """Generate DPA template content"""
        return f"""
# Data Processing Agreement

This Data Processing Agreement ("Agreement") is entered into between:

**Data Controller**: {organization.name}
**Data Processor**: [Platform Name]

## 1. Definitions
- "Personal Data" means any information relating to an identified or identifiable natural person
- "Processing" means any operation performed on Personal Data
- "Data Subject" means the individual to whom Personal Data relates

## 2. Scope and Purpose
The Processor shall process Personal Data only on behalf of the Controller and in accordance with the Controller's instructions.

## 3. Data Processor Obligations
The Processor shall:
- Process Personal Data only on documented instructions from the Controller
- Ensure authorized persons have committed to confidentiality
- Implement appropriate technical and organizational measures
- Assist the Controller in responding to data subject requests
- Make available all information necessary to demonstrate compliance

## 4. Data Security
The Processor implements industry-standard security measures including:
- Encryption of Personal Data in transit and at rest
- Regular security assessments and penetration testing
- Access controls and authentication mechanisms
- Incident response procedures

## 5. Sub-processors
The Processor may engage sub-processors with prior written consent of the Controller.

## 6. Data Subject Rights
The Processor shall assist the Controller in fulfilling obligations to respond to data subject requests.

## 7. Data Breach Notification
The Processor shall notify the Controller without undue delay after becoming aware of a Personal Data breach.

## 8. Audit Rights
The Controller has the right to conduct audits of the Processor's compliance with this Agreement.

## 9. Data Return and Deletion
Upon termination, the Processor shall return or delete all Personal Data as instructed by the Controller.

## 10. Liability and Indemnification
Each party shall be liable for damages caused by its processing in violation of applicable data protection laws.

## 11. Term and Termination
This Agreement remains in effect for the duration of the Processing activities.

## 12. Governing Law
This Agreement is governed by the laws of [Jurisdiction].

Version: 2.0
Date: {timezone.now().strftime('%Y-%m-%d')}
"""


class DataDeletionRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DataDeletionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Users can see their own requests or organization requests if admin
        return DataDeletionRequest.objects.filter(
            Q(requester_email=user.email) |
            Q(organization__memberships__user=user, organization__memberships__role__in=['owner', 'admin'])
        ).select_related('organization', 'form', 'processed_by')
    
    def create(self, request):
        """Create a deletion request"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deletion_request = serializer.save()
        
        # Send verification email
        self._send_verification_email(deletion_request)
        
        return Response(
            {
                "message": "Deletion request created. Please check your email to verify.",
                "id": deletion_request.id
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def verify(self, request):
        """Verify deletion request with token"""
        serializer = VerifyDeletionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        deletion_request = DataDeletionRequest.objects.get(
            verification_token=token,
            status='pending'
        )
        
        deletion_request.status = 'verified'
        deletion_request.verified_at = timezone.now()
        deletion_request.save()
        
        return Response({"message": "Deletion request verified successfully"})
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a deletion request (admin only)"""
        deletion_request = self.get_object()
        
        # Check permissions
        if not request.user.memberships.filter(
            organization=deletion_request.organization,
            role__in=['owner', 'admin']
        ).exists():
            return Response(
                {"error": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ProcessDeletionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if serializer.validated_data['action'] == 'approve':
            deletion_request.status = 'processing'
            deletion_request.save()
            
            # Queue async processing
            process_deletion_request.delay(deletion_request.id, request.user.id)
            
            return Response({"message": "Deletion request is being processed"})
        else:
            deletion_request.status = 'rejected'
            deletion_request.rejection_reason = serializer.validated_data['rejection_reason']
            deletion_request.processed_at = timezone.now()
            deletion_request.processed_by = request.user
            deletion_request.save()
            
            return Response({"message": "Deletion request rejected"})
    
    def _send_verification_email(self, deletion_request):
        """Send verification email for deletion request"""
        verification_url = f"{settings.FRONTEND_URL}/gdpr/verify-deletion?token={deletion_request.verification_token}"
        
        send_mail(
            subject="Verify Your Data Deletion Request",
            message=f"""
            Hello {deletion_request.requester_name},
            
            We received a request to delete your data from our platform.
            
            To verify this request, please click the following link:
            {verification_url}
            
            This link will expire in 48 hours.
            
            If you did not make this request, please ignore this email.
            
            Best regards,
            The Platform Team
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[deletion_request.requester_email],
        )


class DataExportRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DataExportRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return DataExportRequest.objects.filter(
            Q(requester_email=user.email) |
            Q(organization__memberships__user=user)
        ).select_related('organization')
    
    def create(self, request):
        """Create a data export request"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        export_request = serializer.save()
        
        # Queue async processing
        process_export_request.delay(export_request.id)
        
        return Response(
            {
                "message": "Export request created. You'll receive an email when ready.",
                "id": export_request.id
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download exported data"""
        export_request = self.get_object()
        
        if export_request.status != 'completed':
            return Response(
                {"error": "Export not ready"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if export_request.expires_at and timezone.now() > export_request.expires_at:
            return Response(
                {"error": "Export link has expired"},
                status=status.HTTP_410_GONE
            )
        
        # Return presigned URL or redirect
        return Response({"download_url": export_request.export_url})


# Utility view for GDPR compliance status
class GDPRComplianceStatusViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get GDPR compliance status for an organization"""
        org_id = request.query_params.get('organization_id')
        try:
            org = Organization.objects.get(
                id=org_id,
                memberships__user=request.user
            )
        except Organization.DoesNotExist:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check various compliance aspects
        has_residency_config = hasattr(org, 'data_residency')
        has_retention_policy = org.retention_policies.exists()
        has_signed_dpa = org.dpas.filter(signed=True).exists()
        
        # Count PII fields configured
        pii_fields_count = PIIFieldConfig.objects.filter(
            form__organization=org
        ).count()
        
        # Recent data requests
        recent_deletion_requests = org.deletion_requests.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        recent_export_requests = org.export_requests.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        compliance_score = sum([
            has_residency_config,
            has_retention_policy,
            has_signed_dpa,
            pii_fields_count > 0
        ]) * 25
        
        return Response({
            'organization': org.name,
            'compliance_score': compliance_score,
            'status': {
                'data_residency_configured': has_residency_config,
                'retention_policy_set': has_retention_policy,
                'dpa_signed': has_signed_dpa,
                'pii_fields_configured': pii_fields_count > 0
            },
            'statistics': {
                'pii_fields_count': pii_fields_count,
                'recent_deletion_requests': recent_deletion_requests,
                'recent_export_requests': recent_export_requests
            },
            'recommendations': self._get_recommendations(
                has_residency_config,
                has_retention_policy,
                has_signed_dpa,
                pii_fields_count
            )
        })
    
    def _get_recommendations(self, has_residency, has_retention, has_dpa, pii_count):
        recommendations = []
        
        if not has_residency:
            recommendations.append({
                'priority': 'high',
                'action': 'Configure data residency',
                'description': 'Set up EU data residency requirements'
            })
        
        if not has_retention:
            recommendations.append({
                'priority': 'high',
                'action': 'Set retention policy',
                'description': 'Define data retention periods'
            })
        
        if not has_dpa:
            recommendations.append({
                'priority': 'medium',
                'action': 'Sign DPA',
                'description': 'Review and sign Data Processing Agreement'
            })
        
        if pii_count == 0:
            recommendations.append({
                'priority': 'medium',
                'action': 'Configure PII fields',
                'description': 'Identify and configure PII field handling'
            })
        
        return recommendations
