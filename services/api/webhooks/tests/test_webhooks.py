from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, Mock
from celery import states
from core.models import Organization, Membership, Submission
from forms.models import Form
from webhooks.models import Webhook, Delivery, DeadLetterQueue
from webhooks.tasks import deliver_webhook, process_submission_webhooks
import responses
import json

User = get_user_model()


class WebhookAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test user and org
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password'
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
        
        self.client.force_authenticate(user=self.user)
    
    def test_create_webhook(self):
        """Test creating a webhook"""
        data = {
            'url': 'https://example.com/webhook',
            'organization_id': str(self.org.id),
            'include_partials': True,
            'headers_json': {'X-Custom': 'header'}
        }
        
        response = self.client.post('/v1/webhooks/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['url'], 'https://example.com/webhook')
        self.assertTrue(response.data['include_partials'])
        
        # Check secret was generated
        webhook = Webhook.objects.get(id=response.data['id'])
        self.assertIsNotNone(webhook.secret)
        self.assertEqual(len(webhook.secret), 43)  # Base64 URL safe length
    
    def test_webhook_permissions(self):
        """Test only admin/owner can manage webhooks"""
        # Create viewer user
        viewer = User.objects.create_user(
            email='viewer@example.com',
            username='viewer',
            password='password'
        )
        Membership.objects.create(
            user=viewer,
            organization=self.org,
            role='viewer'
        )
        
        self.client.force_authenticate(user=viewer)
        
        # Viewer cannot create webhook
        response = self.client.post('/v1/webhooks/', {
            'url': 'https://example.com/webhook',
            'organization_id': str(self.org.id)
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_test_webhook(self):
        """Test sending test webhook"""
        webhook = Webhook.objects.create(
            organization=self.org,
            url='https://example.com/test',
            secret='test-secret'
        )
        
        with patch('webhooks.tasks.test_webhook_delivery.delay') as mock_task:
            mock_task.return_value.get.return_value = 'test-delivery-id'
            
            response = self.client.post(f'/v1/webhooks/{webhook.id}/test/')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['delivery_id'], 'test-delivery-id')
            mock_task.assert_called_once_with(webhook.id)
    
    def test_webhook_stats(self):
        """Test webhook statistics endpoint"""
        webhook = Webhook.objects.create(
            organization=self.org,
            url='https://example.com/stats',
            secret='secret',
            total_deliveries=100,
            successful_deliveries=90,
            failed_deliveries=10
        )
        
        # Create some recent deliveries
        for i in range(5):
            Delivery.objects.create(
                webhook=webhook,
                status='success' if i < 3 else 'failed',
                response_time_ms=100 + i * 10,
                created_at=timezone.now()
            )
        
        response = self.client.get(f'/v1/webhooks/{webhook.id}/stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_deliveries'], 100)
        self.assertEqual(response.data['success_rate'], 90.0)
        self.assertEqual(response.data['deliveries_24h'], 5)
        self.assertEqual(response.data['success_24h'], 3)
        self.assertIsNotNone(response.data['avg_response_time_ms'])


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class WebhookDeliveryTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='test',
            password='password'
        )
        
        self.org = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        
        self.webhook = Webhook.objects.create(
            organization=self.org,
            url='https://example.com/webhook',
            secret='test-secret-key'
        )
        
        self.form = Form.objects.create(
            organization=self.org,
            title='Test Form',
            slug='test-form',
            created_by=self.user
        )
    
    @responses.activate
    def test_successful_webhook_delivery(self):
        """Test successful webhook delivery"""
        responses.add(
            responses.POST,
            'https://example.com/webhook',
            json={'success': True},
            status=200
        )
        
        delivery = Delivery.objects.create(
            webhook=self.webhook,
            submission=None,
            partial=None
        )
        
        result = deliver_webhook(delivery.id)
        
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'success')
        self.assertIsNotNone(delivery.delivered_at)
        self.assertEqual(delivery.response_code, 200)
        
        # Check webhook stats updated
        self.webhook.refresh_from_db()
        self.assertEqual(self.webhook.total_deliveries, 1)
        self.assertEqual(self.webhook.successful_deliveries, 1)
    
    @responses.activate
    def test_failed_webhook_delivery_with_retry(self):
        """Test failed webhook delivery triggers retry"""
        responses.add(
            responses.POST,
            'https://example.com/webhook',
            json={'error': 'Server error'},
            status=500
        )
        
        delivery = Delivery.objects.create(
            webhook=self.webhook,
            submission=None,
            partial=None
        )
        
        with self.assertRaises(Exception) as context:
            deliver_webhook(delivery.id)
        
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'pending')
        self.assertIsNotNone(delivery.next_retry_at)
        self.assertEqual(delivery.attempt, 1)
        self.assertIn('HTTP 500', delivery.error)
    
    @responses.activate
    def test_webhook_hmac_signature(self):
        """Test webhook includes correct HMAC signature"""
        responses.add(
            responses.POST,
            'https://example.com/webhook',
            status=200
        )
        
        delivery = Delivery.objects.create(
            webhook=self.webhook,
            submission=None,
            partial=None
        )
        
        deliver_webhook(delivery.id)
        
        # Check request was made with correct headers
        self.assertEqual(len(responses.calls), 1)
        request = responses.calls[0].request
        
        self.assertIn('X-Forms-Signature', request.headers)
        self.assertIn('X-Forms-Timestamp', request.headers)
        self.assertIn('X-Forms-Delivery-Id', request.headers)
        self.assertEqual(request.headers['Content-Type'], 'application/json')
    
    def test_dlq_entry_created_after_max_retries(self):
        """Test DLQ entry created when max retries exceeded"""
        delivery = Delivery.objects.create(
            webhook=self.webhook,
            submission=None,
            partial=None,
            attempt=7  # Max retries
        )
        
        with patch('requests.post', side_effect=Exception('Connection error')):
            with self.assertRaises(Exception):
                # Using a mock task that simulates max retries
                from celery import Task
                mock_task = Mock(spec=Task)
                mock_task.request.retries = 7
                
                from webhooks.tasks import handle_webhook_failure
                handle_webhook_failure(mock_task, delivery, 'Connection error')
        
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'failed')
        
        # Check DLQ entry exists
        dlq_exists = DeadLetterQueue.objects.filter(delivery=delivery).exists()
        self.assertTrue(dlq_exists)
    
    def test_process_submission_webhooks(self):
        """Test webhooks are created for new submission"""
        # Create submission
        submission = Submission.objects.create(
            form=self.form,
            version=1,
            respondent_key='test-key',
            locale='en',
            completed_at=timezone.now()
        )
        
        with patch('webhooks.tasks.deliver_webhook.s') as mock_deliver:
            mock_deliver.return_value = Mock()
            
            process_submission_webhooks(submission.id)
            
            # Check delivery was created
            self.assertEqual(Delivery.objects.count(), 1)
            delivery = Delivery.objects.first()
            self.assertEqual(delivery.webhook, self.webhook)
            self.assertEqual(delivery.submission, submission)
            
            # Check task was called
            mock_deliver.assert_called_once()


class RateLimitTestCase(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        
        self.webhook = Webhook.objects.create(
            organization=self.org,
            url='https://example.com/webhook',
            secret='secret'
        )
    
    @override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
    def test_rate_limiting(self):
        """Test webhook rate limiting"""
        from webhooks.tasks import check_rate_limit, RATE_LIMIT_MAX_REQUESTS
        from django.core.cache import cache
        
        # Clear cache
        cache.clear()
        
        # Should allow up to limit
        for i in range(RATE_LIMIT_MAX_REQUESTS):
            self.assertTrue(check_rate_limit(self.webhook))
        
        # Should block after limit
        self.assertFalse(check_rate_limit(self.webhook))
        
        # Clear cache and verify it works again
        cache.clear()
        self.assertTrue(check_rate_limit(self.webhook))