import pytest
import json
import hmac
import hashlib
from unittest.mock import patch, Mock
from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from forms.models import Form
from core.models import Submission
from webhooks.models import Webhook, Delivery
from webhooks.tasks import send_webhook, retry_failed_webhooks
from webhooks.services import WebhookService

User = get_user_model()


class WebhookModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.organization = Organization.objects.create(
            name='Test Org',
            owner=self.user
        )
        self.form = Form.objects.create(
            organization=self.organization,
            title='Test Form',
            created_by=self.user
        )

    def test_webhook_creation(self):
        """Test creating a webhook"""
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret',
            events=['submission.created', 'submission.updated']
        )
        
        self.assertEqual(webhook.organization, self.organization)
        self.assertEqual(webhook.url, 'https://example.com/webhook')
        self.assertTrue(webhook.active)
        self.assertEqual(webhook.events, ['submission.created', 'submission.updated'])

    def test_webhook_delivery_creation(self):
        """Test creating a webhook delivery"""
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='pending'
        )
        
        self.assertEqual(delivery.webhook, webhook)
        self.assertEqual(delivery.submission, submission)
        self.assertEqual(delivery.event, 'submission.created')
        self.assertEqual(delivery.status, 'pending')

    def test_webhook_signature_generation(self):
        """Test webhook signature generation"""
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        payload = json.dumps({'test': 'data'})
        timestamp = '1234567890'
        
        expected_signature = hmac.new(
            webhook.secret.encode(),
            f"{timestamp}.{payload}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Test signature generation in WebhookService
        service = WebhookService()
        signature = service.generate_signature(webhook.secret, payload, timestamp)
        
        self.assertEqual(signature, f"sha256={expected_signature}")


class WebhookServiceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.organization = Organization.objects.create(
            name='Test Org',
            owner=self.user
        )
        self.form = Form.objects.create(
            organization=self.organization,
            title='Test Form',
            created_by=self.user
        )
        self.service = WebhookService()

    @patch('requests.post')
    def test_send_webhook_success(self, mock_post):
        """Test successful webhook delivery"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = 'OK'
        mock_post.return_value = mock_response
        
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='pending'
        )
        
        self.service.send_webhook(delivery)
        
        # Check that request was made
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        
        self.assertEqual(args[0], webhook.url)
        self.assertIn('X-Webhook-Signature', kwargs['headers'])
        self.assertIn('X-Webhook-Timestamp', kwargs['headers'])
        self.assertEqual(kwargs['json'], delivery.payload)
        
        # Check delivery status
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'success')
        self.assertEqual(delivery.response_code, 200)

    @patch('requests.post')
    def test_send_webhook_failure(self, mock_post):
        """Test failed webhook delivery"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = 'Internal Server Error'
        mock_post.return_value = mock_response
        
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='pending'
        )
        
        self.service.send_webhook(delivery)
        
        # Check delivery status
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'failed')
        self.assertEqual(delivery.response_code, 500)
        self.assertIsNotNone(delivery.next_retry_at)

    @patch('requests.post')
    def test_send_webhook_timeout(self, mock_post):
        """Test webhook delivery timeout"""
        from requests.exceptions import Timeout
        mock_post.side_effect = Timeout()
        
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='pending'
        )
        
        self.service.send_webhook(delivery)
        
        # Check delivery status
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'failed')
        self.assertIn('timeout', delivery.error.lower())

    def test_retry_backoff_calculation(self):
        """Test exponential backoff calculation for retries"""
        from datetime import timedelta
        from django.utils import timezone
        
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='failed',
            attempt=1
        )
        
        next_retry = self.service.calculate_next_retry(delivery.attempt)
        
        # First retry should be in ~30 seconds
        expected_min = timezone.now() + timedelta(seconds=25)
        expected_max = timezone.now() + timedelta(seconds=35)
        
        self.assertGreater(next_retry, expected_min)
        self.assertLess(next_retry, expected_max)

    def test_max_retry_attempts(self):
        """Test that deliveries stop retrying after max attempts"""
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='failed',
            attempt=7  # Max attempts exceeded
        )
        
        next_retry = self.service.calculate_next_retry(delivery.attempt)
        self.assertIsNone(next_retry)


class WebhookTaskTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.organization = Organization.objects.create(
            name='Test Org',
            owner=self.user
        )
        self.form = Form.objects.create(
            organization=self.organization,
            title='Test Form',
            created_by=self.user
        )

    @patch('webhooks.tasks.WebhookService.send_webhook')
    def test_send_webhook_task(self, mock_send):
        """Test webhook sending task"""
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='pending'
        )
        
        # Run the task
        send_webhook(delivery.id)
        
        # Check that service method was called
        mock_send.assert_called_once_with(delivery)

    @patch('webhooks.tasks.WebhookService.send_webhook')
    def test_retry_failed_webhooks_task(self, mock_send):
        """Test retrying failed webhooks task"""
        from django.utils import timezone
        from datetime import timedelta
        
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        # Create a failed delivery ready for retry
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            event='submission.created',
            payload={'test': 'data'},
            status='failed',
            attempt=1,
            next_retry_at=timezone.now() - timedelta(minutes=1)  # Past retry time
        )
        
        # Run the retry task
        retry_failed_webhooks()
        
        # Check that service method was called
        mock_send.assert_called_once_with(delivery)

    def test_webhook_event_filtering(self):
        """Test that webhooks only fire for subscribed events"""
        webhook = Webhook.objects.create(
            organization=self.organization,
            url='https://example.com/webhook',
            secret='test-secret',
            events=['submission.created']  # Only subscribed to created events
        )
        
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-key',
            data={'field1': 'value1'}
        )
        
        # Should create delivery for subscribed event
        self.service = WebhookService()
        self.service.trigger_webhooks(
            'submission.created',
            self.organization,
            submission=submission
        )
        
        self.assertEqual(Delivery.objects.filter(event='submission.created').count(), 1)
        
        # Should not create delivery for unsubscribed event
        self.service.trigger_webhooks(
            'submission.deleted',
            self.organization,
            submission=submission
        )
        
        self.assertEqual(Delivery.objects.filter(event='submission.deleted').count(), 0)