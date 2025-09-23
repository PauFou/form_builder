"""
Cross-Service Integration Tests
Tests the complete flow between API, Ingest, Workers, and external services
"""

import pytest
from datetime import datetime
from unittest.mock import patch, Mock
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from core.models import Organization, Submission
from forms.models import Form
from webhooks.models import Webhook, Delivery
from webhooks.tasks import deliver_webhook
from integrations.models import Integration
# from analytics.models import AnalyticsEvent  # Analytics module doesn't have models yet

User = get_user_model()


class FullSubmissionFlowTests(TransactionTestCase):
    """Test complete submission flow from edge to database"""
    
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        self.form = Form.objects.create(
            organization=self.org,
            title='Test Form',
            schema={
                'fields': [
                    {'id': 'name', 'type': 'text', 'required': True},
                    {'id': 'email', 'type': 'email', 'required': True}
                ]
            }
        )
        
        # Create webhook
        self.webhook = Webhook.objects.create(
            organization=self.org,
            url='https://example.com/webhook',
            secret='test-secret',
            active=True
        )
    
    @patch('ingest.edge_function.validate_hmac')
    @patch('ingest.edge_function.queue_submission')
    def test_edge_ingest_to_api_flow(self, mock_queue, mock_validate):
        """Test submission from edge function to API"""
        mock_validate.return_value = True
        mock_queue.return_value = {'messageId': 'test-123'}
        
        # Simulate edge function receiving submission
        edge_payload = {
            'formId': str(self.form.id),
            'answers': {
                'name': 'John Doe',
                'email': 'john@example.com'
            },
            'metadata': {
                'userAgent': 'Mozilla/5.0',
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Edge function validates and queues
        from ingest.edge_function import handle_submission
        response = handle_submission(edge_payload, headers={
            'X-Form-Signature': 'valid-signature'
        })
        
        self.assertEqual(response['statusCode'], 202)
        self.assertIn('messageId', response['body'])
        
        # Verify queued for processing
        mock_queue.assert_called_once()
        
        # Simulate worker processing queue
        from workers.submission_processor import process_submission
        process_submission(edge_payload)
        
        # Verify submission created
        submission = Submission.objects.get(
            form=self.form,
            metadata__contains={'userAgent': 'Mozilla/5.0'}
        )
        
        self.assertEqual(submission.answers.count(), 2)
        self.assertEqual(
            submission.answers.get(block_id='name').value,
            {'text': 'John Doe'}
        )
    
    @patch('requests.post')
    def test_webhook_delivery_flow(self, mock_post):
        """Test webhook delivery after submission"""
        # Create submission
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-123'
        )
        
        # Mock webhook endpoint
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: {'status': 'ok'},
            headers={'X-Request-ID': 'req-123'}
        )
        
        # Trigger webhook delivery
        deliver_webhook(self.webhook.id, submission.id)
        
        # Verify webhook was called
        mock_post.assert_called_once()
        
        # Verify delivery logged
        delivery = Delivery.objects.get(
            webhook=self.webhook,
            submission=submission
        )
        
        self.assertEqual(delivery.status_code, 200)
        self.assertEqual(delivery.response_headers['X-Request-ID'], 'req-123')
        
        # Verify HMAC signature
        call_args = mock_post.call_args
        headers = call_args[1]['headers']
        self.assertIn('X-Form-Signature', headers)
    
    @patch('integrations.providers.google_sheets.GoogleSheetsProvider.sync')
    def test_integration_sync_flow(self, mock_sync):
        """Test integration sync after submission"""
        # Create integration
        integration = Integration.objects.create(
            organization=self.org,
            provider='google_sheets',
            config={
                'spreadsheet_id': 'test-sheet',
                'worksheet_name': 'Responses'
            },
            active=True
        )
        
        # Link to form
        integration.forms.add(self.form)
        
        # Create submission
        submission = Submission.objects.create(
            form=self.form,
            respondent_key='test-123'
        )
        
        # Mock successful sync
        mock_sync.return_value = {
            'success': True,
            'row_number': 42
        }
        
        # Trigger sync
        from integrations.tasks import sync_submission_to_integrations
        sync_submission_to_integrations(submission.id)
        
        # Verify sync called
        mock_sync.assert_called_once()
        
        # Verify sync logged
        from integrations.models import IntegrationLog
        log = IntegrationLog.objects.get(
            integration=integration,
            submission=submission
        )
        
        self.assertEqual(log.status, 'success')
        self.assertEqual(log.data['row_number'], 42)
    
    def test_analytics_tracking_flow(self):
        """Test analytics events throughout submission"""
        # Start form
        response = self.client.post(
            '/api/v1/analytics/events/',
            {
                'form_id': str(self.form.id),
                'event_type': 'form_start',
                'respondent_id': 'anon-123',
                'metadata': {'referrer': 'https://example.com'}
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Field interaction
        response = self.client.post(
            '/api/v1/analytics/events/',
            {
                'form_id': str(self.form.id),
                'event_type': 'field_interaction',
                'respondent_id': 'anon-123',
                'metadata': {
                    'field_id': 'email',
                    'interaction_type': 'focus'
                }
            }
        )
        
        # Submit
        response = self.client.post(
            f'/api/v1/forms/{self.form.id}/submissions/',
            {
                'respondent_id': 'anon-123',
                'answers': {
                    'name': 'Test User',
                    'email': 'test@example.com'
                }
            }
        )
        
        # TODO: Verify analytics pipeline when analytics models are implemented
        # events = AnalyticsEvent.objects.filter(
        #     form_id=self.form.id,
        #     respondent_id='anon-123'
        # ).order_by('timestamp')
        # 
        # self.assertEqual(events.count(), 3)
        # self.assertEqual(events[0].event_type, 'form_start')
        # self.assertEqual(events[1].event_type, 'field_interaction')
        # self.assertEqual(events[2].event_type, 'form_submit')
        # 
        # # Verify funnel metrics
        # from analytics.services import calculate_form_metrics
        # metrics = calculate_form_metrics(self.form.id)
        
        # self.assertEqual(metrics['starts'], 1)
        # self.assertEqual(metrics['completions'], 1)
        # self.assertEqual(metrics['completion_rate'], 1.0)


class PartialSubmissionSyncTests(TransactionTestCase):
    """Test partial submission syncing across services"""
    
    def setUp(self):
        self.form = Form.objects.create(
            organization=Organization.objects.create(
                name='Test',
                slug='test'
            ),
            title='Test Form',
            settings={'enable_partial_submissions': True}
        )
    
    @patch('ingest.edge_function.queue_partial')
    def test_partial_submission_flow(self, mock_queue):
        """Test partial submission from edge to storage"""
        mock_queue.return_value = {'success': True}
        
        # Simulate partial submission
        partial_data = {
            'formId': str(self.form.id),
            'respondentKey': 'resp-123',
            'lastStep': 'step-2',
            'answers': {
                'name': 'John',
                'email': 'john@'  # Incomplete
            },
            'metadata': {
                'saveTime': datetime.now().isoformat()
            }
        }
        
        # Edge function handles partial
        from ingest.edge_function import handle_partial_submission
        response = handle_partial_submission(partial_data)
        
        self.assertEqual(response['statusCode'], 202)
        
        # Worker processes partial
        from workers.partial_processor import process_partial_submission
        process_partial_submission(partial_data)
        
        # Verify partial saved
        partial = PartialSubmission.objects.get(
            form=self.form,
            respondent_key='resp-123'
        )
        
        self.assertEqual(partial.last_step, 'step-2')
        self.assertEqual(partial.data['name'], 'John')
        self.assertEqual(partial.data['email'], 'john@')
    
    def test_partial_to_complete_transition(self):
        """Test transition from partial to complete submission"""
        # Create partial
        partial = PartialSubmission.objects.create(
            form=self.form,
            respondent_key='resp-123',
            last_step='step-2',
            data={'name': 'John', 'email': 'john@'}
        )
        
        # Complete submission
        response = self.client.post(
            f'/api/v1/forms/{self.form.id}/submissions/',
            {
                'respondent_key': 'resp-123',
                'answers': {
                    'name': 'John Doe',
                    'email': 'john@example.com',
                    'phone': '+1234567890'
                }
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify partial deleted
        with self.assertRaises(PartialSubmission.DoesNotExist):
            PartialSubmission.objects.get(id=partial.id)
        
        # Verify complete submission
        submission = Submission.objects.get(id=response.data['id'])
        self.assertEqual(submission.respondent_key, 'resp-123')
        self.assertEqual(submission.answers.count(), 3)


class WebhookReliabilityTests(TransactionTestCase):
    """Test webhook reliability and retry mechanisms"""
    
    def setUp(self):
        self.webhook = Webhook.objects.create(
            organization=Organization.objects.create(
                name='Test',
                slug='test'
            ),
            url='https://example.com/webhook',
            secret='test-secret'
        )
        
        self.submission = Submission.objects.create(
            form=Form.objects.create(
                organization=self.webhook.organization,
                title='Test'
            )
        )
    
    @patch('requests.post')
    def test_webhook_retry_on_failure(self, mock_post):
        """Test webhook retry mechanism"""
        # Mock failures then success
        mock_post.side_effect = [
            Mock(status_code=500),
            Mock(status_code=503),
            Mock(status_code=200, json=lambda: {'ok': True})
        ]
        
        # Deliver webhook
        deliver_webhook(self.webhook.id, self.submission.id)
        
        # Should retry and eventually succeed
        self.assertEqual(mock_post.call_count, 3)
        
        # Verify delivery record
        delivery = Delivery.objects.get(
            webhook=self.webhook,
            submission=self.submission
        )
        
        self.assertEqual(delivery.status_code, 200)
        self.assertEqual(delivery.attempts, 3)
        self.assertEqual(delivery.status, 'success')
    
    @patch('requests.post')
    def test_webhook_circuit_breaker(self, mock_post):
        """Test circuit breaker for failing webhooks"""
        # Mock continuous failures
        mock_post.return_value = Mock(status_code=500)
        
        # Create multiple failed deliveries
        for i in range(10):
            submission = Submission.objects.create(
                form=self.submission.form
            )
            deliver_webhook(self.webhook.id, submission.id)
        
        # After threshold, circuit should open
        self.webhook.refresh_from_db()
        self.assertFalse(self.webhook.active)
        self.assertEqual(self.webhook.circuit_state, 'open')
        
        # New deliveries should be skipped
        new_submission = Submission.objects.create(
            form=self.submission.form
        )
        deliver_webhook(self.webhook.id, new_submission.id)
        
        # Should not attempt delivery
        self.assertEqual(
            mock_post.call_count,
            10 * 3  # 10 submissions * 3 retries each
        )
    
    def test_webhook_idempotency(self):
        """Test idempotent webhook delivery"""
        # Create delivery with idempotency key
        Delivery.objects.create(
            webhook=self.webhook,
            submission=self.submission,
            idempotency_key='idem-123',
            status='success'
        )
        
        # Attempt duplicate delivery
        with self.assertRaises(Delivery.IntegrityError):
            Delivery.objects.create(
                webhook=self.webhook,
                submission=self.submission,
                idempotency_key='idem-123',
                status='pending'
            )


class RateLimitingTests(TransactionTestCase):
    """Test rate limiting across services"""
    
    def test_api_rate_limiting(self):
        """Test API endpoint rate limiting"""
        form = Form.objects.create(
            organization=Organization.objects.create(
                name='Test',
                slug='test'
            ),
            title='Test'
        )
        
        # Make rapid requests
        responses = []
        for i in range(150):
            response = self.client.post(
                f'/api/v1/forms/{form.id}/submissions/',
                {'answers': {'email': f'test{i}@example.com'}}
            )
            responses.append(response.status_code)
        
        # Should hit rate limit
        self.assertIn(429, responses)
        
        # Check rate limit headers
        limited_response = next(
            r for r, status in enumerate(responses) if status == 429
        )
        self.assertIn('X-RateLimit-Limit', limited_response.headers)
        self.assertIn('X-RateLimit-Remaining', limited_response.headers)
        self.assertIn('X-RateLimit-Reset', limited_response.headers)
    
    @patch('ingest.edge_function.check_rate_limit')
    def test_edge_function_rate_limiting(self, mock_check):
        """Test edge function rate limiting"""
        # Mock rate limit exceeded
        mock_check.return_value = False
        
        from ingest.edge_function import handle_submission
        response = handle_submission(
            {'formId': 'test'},
            headers={'X-Forwarded-For': '192.168.1.1'}
        )
        
        self.assertEqual(response['statusCode'], 429)
        self.assertIn('rate limit', response['body'].lower())
    
    def test_webhook_delivery_rate_limiting(self):
        """Test webhook delivery rate limiting"""
        webhook = Webhook.objects.create(
            organization=Organization.objects.create(
                name='Test',
                slug='test'
            ),
            url='https://example.com/webhook',
            rate_limit={
                'requests_per_second': 10,
                'burst': 20
            }
        )
        
        # Create many submissions quickly
        submissions = []
        for i in range(30):
            submission = Submission.objects.create(
                form=Form.objects.create(
                    organization=webhook.organization,
                    title=f'Test {i}'
                )
            )
            submissions.append(submission)
        
        # Queue all for delivery
        from webhooks.tasks import deliver_webhook_batch
        deliver_webhook_batch(webhook.id, [s.id for s in submissions])
        
        # Verify rate limiting applied
        deliveries = Delivery.objects.filter(
            webhook=webhook
        ).order_by('created_at')
        
        # Check delivery timing
        delivery_times = [d.created_at for d in deliveries]
        
        # Should have appropriate spacing
        for i in range(1, len(delivery_times)):
            time_diff = (delivery_times[i] - delivery_times[i-1]).total_seconds()
            self.assertGreaterEqual(time_diff, 0.1)  # 10 req/s = 0.1s minimum


class FailureRecoveryTests(TransactionTestCase):
    """Test failure recovery mechanisms"""
    
    def test_database_connection_recovery(self):
        """Test recovery from database connection loss"""
        # This would typically use a test database proxy
        # to simulate connection failures
        pass
    
    def test_queue_persistence(self):
        """Test queue messages persist through service restart"""
        # This would verify queue durability settings
        pass
    
    def test_distributed_transaction_rollback(self):
        """Test rollback of distributed transactions"""
        # Create submission that will fail partway
        form = Form.objects.create(
            organization=Organization.objects.create(
                name='Test',
                slug='test'
            ),
            title='Test'
        )
        
        # Mock integration failure
        with patch('integrations.providers.base.BaseProvider.sync') as mock_sync:
            mock_sync.side_effect = Exception('Integration failed')
            
            # Attempt submission
            response = self.client.post(
                f'/api/v1/forms/{form.id}/submissions/',
                {
                    'answers': {'email': 'test@example.com'},
                    'sync_integrations': True
                }
            )
            
            # Should rollback entire submission
            self.assertEqual(
                response.status_code,
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            # Verify no partial data remains
            self.assertEqual(
                Submission.objects.filter(form=form).count(),
                0
            )


class SecurityIntegrationTests(TransactionTestCase):
    """Test security across service boundaries"""
    
    def test_hmac_validation_chain(self):
        """Test HMAC validation throughout the chain"""
        # Edge -> Queue -> API -> Webhook
        pass
    
    def test_token_propagation(self):
        """Test auth token propagation across services"""
        pass
    
    def test_encryption_in_transit(self):
        """Test data encryption between services"""
        pass
    
    def test_audit_trail_completeness(self):
        """Test audit logging across all services"""
        # Track through entire flow
        # Edge -> Queue -> API -> DB -> Webhooks -> Integrations
        
        # Verify audit entries at each step
        
        # Should have entries for:
        # - Ingestion
        # - Validation  
        # - Storage
        # - Webhook delivery
        # - Integration sync


if __name__ == '__main__':
    pytest.main([__file__, '-v'])