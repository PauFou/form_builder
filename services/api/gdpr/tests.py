from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch

from core.models import Organization, Membership
from forms.models import Form
from .models import (
    DataResidencyConfig, DataRetentionPolicy, PIIFieldConfig,
    PIIEncryption
)

User = get_user_model()


class GDPRModelsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.organization = Organization.objects.create(
            name='Test Organization',
            slug='test-org'
        )
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role='owner'
        )
        self.form = Form.objects.create(
            organization=self.organization,
            title='Test Form',
            created_by=self.user
        )
    
    def test_data_residency_config(self):
        config = DataResidencyConfig.objects.create(
            organization=self.organization,
            primary_region='eu-west-1',
            allowed_regions=['eu-west-1', 'eu-central-1'],
            enforce_residency=True
        )
        self.assertEqual(config.primary_region, 'eu-west-1')
        self.assertIn('eu-central-1', config.allowed_regions)
    
    def test_retention_policy(self):
        policy = DataRetentionPolicy.objects.create(
            organization=self.organization,
            submission_retention_days=365,
            partial_retention_days=30,
            auto_delete_enabled=True
        )
        self.assertEqual(policy.submission_retention_days, 365)
        self.assertTrue(policy.auto_delete_enabled)
    
    def test_pii_field_config(self):
        config = PIIFieldConfig.objects.create(
            form=self.form,
            field_id='email_field',
            field_type='email',
            encrypt_at_rest=True,
            mask_in_exports=True,
            masking_pattern='****@{domain}'
        )
        self.assertEqual(config.field_type, 'email')
        self.assertTrue(config.encrypt_at_rest)
    
    def test_pii_encryption(self):
        # Test encryption/decryption
        original_data = 'sensitive@example.com'
        encrypted = PIIEncryption.encrypt(original_data)
        self.assertNotEqual(encrypted, original_data)
        
        decrypted = PIIEncryption.decrypt(encrypted)
        self.assertEqual(decrypted, original_data)
        
        # Test masking
        masked_email = PIIEncryption.mask('test@example.com')
        self.assertEqual(masked_email, 'te****@example.com')
        
        masked_card = PIIEncryption.mask('1234567812345678', '****-****-****-{last4}')
        self.assertEqual(masked_card, '****-****-****-5678')


class GDPRAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.organization = Organization.objects.create(
            name='Test Organization',
            slug='test-org'
        )
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role='admin'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_data_residency_api(self):
        url = '/v1/gdpr/residency/'
        data = {
            'organization': str(self.organization.id),
            'primary_region': 'eu-west-1',
            'allowed_regions': ['eu-west-1', 'eu-central-1'],
            'enforce_residency': True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['primary_region'], 'eu-west-1')
    
    def test_retention_policy_api(self):
        url = '/v1/gdpr/retention/'
        data = {
            'organization': str(self.organization.id),
            'form': None,
            'submission_retention_days': 365,
            'partial_retention_days': 30,
            'attachment_retention_days': 365,
            'audit_log_retention_days': 730,
            'auto_delete_enabled': True,
            'deletion_notification_days': 30
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_deletion_request_api(self):
        url = '/v1/gdpr/deletion-requests/'
        data = {
            'requester_email': 'user@example.com',
            'requester_name': 'Test User',
            'organization': str(self.organization.id),
            'scope': 'all'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
    
    @patch('gdpr.tasks.process_export_request.delay')
    def test_export_request_api(self, mock_task):
        url = '/v1/gdpr/export-requests/'
        data = {
            'requester_email': self.user.email,
            'organization': str(self.organization.id),
            'include_submissions': True,
            'include_partial_submissions': True,
            'include_consent_records': True,
            'export_format': 'json'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify task was called
        self.assertTrue(mock_task.called)
    
    def test_compliance_status_api(self):
        # Create some GDPR configurations
        DataResidencyConfig.objects.create(
            organization=self.organization,
            primary_region='eu-west-1'
        )
        DataRetentionPolicy.objects.create(
            organization=self.organization,
            submission_retention_days=365
        )
        
        url = f'/v1/gdpr/compliance/status/?organization_id={self.organization.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('compliance_score', response.data)
        self.assertTrue(response.data['status']['data_residency_configured'])
        self.assertTrue(response.data['status']['retention_policy_set'])
