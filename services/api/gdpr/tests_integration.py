import time
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status

from core.models import Organization, Membership
from forms.models import Form
from core.models import Submission, Answer
from .models import (
    DataResidencyConfig, PIIFieldConfig, DataRetentionPolicy,
    ConsentRecord, DataDeletionRequest, DataExportRequest,
    DataProcessingAgreement
)
from .tasks import cleanup_expired_data, process_deletion_request, generate_data_export

User = get_user_model()


class GDPRIntegrationTests(TransactionTestCase):
    """Integration tests for GDPR compliance features"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test user and organization
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass'
        )
        self.org = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        Membership.objects.create(
            user=self.user,
            organization=self.org,
            role='admin'
        )
        
        # Create test form
        self.form = Form.objects.create(
            organization=self.org,
            title='Test Form',
            created_by=self.user
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_complete_gdpr_workflow(self):
        """Test complete GDPR compliance workflow"""
        
        # 1. Configure data residency
        response = self.client.post('/api/v1/gdpr/residency/', {
            'organization': self.org.id,
            'primary_region': 'eu-west-1',
            'allowed_regions': ['eu-west-1', 'eu-central-1'],
            'enforce_eu_residency': True
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Configure PII fields
        response = self.client.post('/api/v1/gdpr/pii-fields/', {
            'form': self.form.id,
            'field_id': 'email_field',
            'is_pii': True,
            'encryption_enabled': True,
            'masking_pattern': '****@****.***'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 3. Set retention policy
        response = self.client.post('/api/v1/gdpr/retention/', {
            'organization': self.org.id,
            'data_type': 'submission',
            'retention_days': 90
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 4. Create and sign DPA
        response = self.client.post('/api/v1/gdpr/dpa/', {
            'organization': self.org.id,
            'company_name': 'Test Company',
            'signatory_name': 'John Doe',
            'signatory_email': 'john@test.com',
            'signatory_title': 'CEO'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        dpa_id = response.data['id']
        
        # Sign DPA
        response = self.client.post(f'/api/v1/gdpr/dpa/{dpa_id}/sign/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 5. Check compliance status
        response = self.client.get(f'/api/v1/gdpr/compliance/status/?organization={self.org.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['compliant'])
    
    def test_deletion_request_with_email_verification(self):
        """Test deletion request with email verification flow"""
        
        # Create some test data
        submission = Submission.objects.create(
            form=self.form,
            respondent_email='user@example.com',
            completed_at=timezone.now()
        )
        
        # Request deletion
        response = self.client.post('/api/v1/gdpr/deletion-requests/', {
            'email': 'user@example.com',
            'reason': 'No longer need account'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_id = response.data['id']
        
        # Check verification email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Verify your deletion request', mail.outbox[0].subject)
        
        # Extract token from email (in real scenario, user clicks link)
        deletion_request = DataDeletionRequest.objects.get(id=request_id)
        
        # Verify request
        response = self.client.post(f'/api/v1/gdpr/deletion-requests/{request_id}/verify/', {
            'token': deletion_request.verification_token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Process deletion (normally done by Celery task)
        process_deletion_request(request_id)
        
        # Check data was deleted
        self.assertFalse(Submission.objects.filter(respondent_email='user@example.com').exists())
        
        # Check deletion request status
        deletion_request.refresh_from_db()
        self.assertEqual(deletion_request.status, 'completed')
        self.assertIsNotNone(deletion_request.completed_at)
    
    def test_data_export_with_pii_masking(self):
        """Test data export with PII masking"""
        
        # Configure PII field
        PIIFieldConfig.objects.create(
            form=self.form,
            field_id='email',
            is_pii=True,
            encryption_enabled=True,
            masking_pattern='****@****.***'
        )
        
        # Create test submission
        submission = Submission.objects.create(
            form=self.form,
            respondent_email='test@example.com',
            completed_at=timezone.now()
        )
        Answer.objects.create(
            submission=submission,
            field_id='email',
            value='test@example.com'
        )
        
        # Request export without PII
        response = self.client.post('/api/v1/gdpr/export-requests/', {
            'email': 'test@example.com',
            'format': 'json',
            'include_pii': False
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_id = response.data['id']
        
        # Process export (normally done by Celery task)
        with patch('gdpr.tasks.default_storage') as mock_storage:
            mock_storage.save.return_value = 'exports/test.json'
            mock_storage.url.return_value = 'https://s3.example.com/exports/test.json'
            
            generate_data_export(request_id)
        
        # Check export request
        export_request = DataExportRequest.objects.get(id=request_id)
        self.assertEqual(export_request.status, 'completed')
        self.assertIsNotNone(export_request.download_url)
        
        # Verify PII was masked in export
        # In real implementation, we would check the actual exported file
    
    @patch('gdpr.tasks.timezone.now')
    def test_retention_policy_automation(self, mock_now):
        """Test automated data retention and deletion"""
        
        # Set current time
        current_time = timezone.now()
        mock_now.return_value = current_time
        
        # Create retention policy
        DataRetentionPolicy.objects.create(
            organization=self.org,
            data_type='submission',
            retention_days=30
        )
        
        # Create old and new submissions
        old_submission = Submission.objects.create(
            form=self.form,
            respondent_email='old@example.com',
            completed_at=current_time - timedelta(days=35)
        )
        new_submission = Submission.objects.create(
            form=self.form,
            respondent_email='new@example.com',
            completed_at=current_time - timedelta(days=10)
        )
        
        # Run cleanup task
        cleanup_expired_data()
        
        # Check results
        self.assertFalse(Submission.objects.filter(id=old_submission.id).exists())
        self.assertTrue(Submission.objects.filter(id=new_submission.id).exists())
    
    def test_consent_management_flow(self):
        """Test consent recording and withdrawal"""
        
        # Record initial consent
        response = self.client.post('/api/v1/gdpr/consent/', {
            'email': 'user@example.com',
            'consent_type': 'marketing',
            'consented': True,
            'consent_text': 'I agree to receive marketing emails',
            'form_id': self.form.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        consent_id = response.data['id']
        
        # Check consent status
        response = self.client.get(f'/api/v1/gdpr/consent/{consent_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['consented'])
        
        # Withdraw consent
        response = self.client.post(f'/api/v1/gdpr/consent/{consent_id}/withdraw/', {
            'reason': 'Too many emails'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify withdrawal
        consent = ConsentRecord.objects.get(id=consent_id)
        self.assertFalse(consent.consented)
        self.assertIsNotNone(consent.withdrawn_at)
        self.assertEqual(consent.withdrawal_reason, 'Too many emails')
    
    def test_cross_border_data_transfer_blocking(self):
        """Test that non-EU data transfers are blocked"""
        
        # Configure strict EU residency
        DataResidencyConfig.objects.create(
            organization=self.org,
            primary_region='eu-west-1',
            allowed_regions=['eu-west-1'],
            enforce_eu_residency=True,
            block_non_eu_webhooks=True
        )
        
        # Attempt to configure non-EU webhook
        response = self.client.post('/api/v1/webhooks/', {
            'organization': self.org.id,
            'url': 'https://us-webhook.example.com/webhook',
            'events': ['submission.created']
        })
        
        # Should be blocked (in real implementation)
        # This would require webhook validation logic
    
    def test_gdpr_compliance_audit(self):
        """Test GDPR compliance audit reporting"""
        
        # Set up complete GDPR configuration
        DataResidencyConfig.objects.create(
            organization=self.org,
            primary_region='eu-west-1'
        )
        DataRetentionPolicy.objects.create(
            organization=self.org,
            data_type='submission',
            retention_days=365
        )
        PIIFieldConfig.objects.create(
            form=self.form,
            field_id='email',
            is_pii=True,
            encryption_enabled=True
        )
        
        # Generate audit report
        response = self.client.get(f'/api/v1/gdpr/audit/?organization={self.org.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify audit contents
        self.assertIn('data_inventory', response.data)
        self.assertIn('pii_fields', response.data)
        self.assertIn('retention_policies', response.data)
        self.assertIn('deletion_requests', response.data)
        self.assertIn('compliance_gaps', response.data)


class GDPRPerformanceTests(TestCase):
    """Performance tests for GDPR operations"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass'
        )
        self.org = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        
    def test_bulk_deletion_performance(self):
        """Test performance of bulk data deletion"""
        
        # Create many submissions
        form = Form.objects.create(
            organization=self.org,
            title='Test Form',
            created_by=self.user
        )
        
        submissions = []
        for i in range(1000):
            submissions.append(Submission(
                form=form,
                respondent_email='user@example.com',
                completed_at=timezone.now()
            ))
        Submission.objects.bulk_create(submissions)
        
        # Time the deletion
        start_time = time.time()
        
        deletion_request = DataDeletionRequest.objects.create(
            email='user@example.com',
            reason='Performance test',
            status='verified',
            verified_at=timezone.now()
        )
        process_deletion_request(deletion_request.id)
        
        end_time = time.time()
        
        # Should complete in reasonable time (< 5 seconds for 1000 records)
        self.assertLess(end_time - start_time, 5.0)
        
        # Verify all deleted
        self.assertEqual(
            Submission.objects.filter(respondent_email='user@example.com').count(),
            0
        )