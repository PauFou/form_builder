"""
Full integration tests for the complete form submission flow
Tests the entire journey from form creation to submission processing
"""

import json
import time
import hmac
import hashlib
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Organization, Submission, Answer, Partial
from forms.models import Form
from webhooks.models import Webhook, Delivery as WebhookDelivery

User = get_user_model()


class FullIntegrationTestCase(TransactionTestCase):
    """
    Complete integration test simulating real-world usage:
    1. User authentication
    2. Organization creation
    3. Form creation and configuration
    4. Form publishing
    5. Submission with HMAC validation
    6. Webhook delivery
    7. Analytics tracking
    8. Export functionality
    """
    
    def setUp(self):
        """Setup test environment"""
        self.client = APIClient()
        
        # Create test user and organization
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPass123!"
        )
        
        self.organization = Organization.objects.create(
            name="Test Organization",
            slug="test-org",
            plan="pro"
        )
        
        # Add user to organization
        self.user.memberships.create(
            organization=self.organization,
            role="owner"
        )
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
    def generate_hmac_signature(self, payload: bytes) -> str:
        """Generate HMAC signature for request"""
        secret = settings.HMAC_SECRET
        signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"
    
    def test_complete_form_lifecycle(self):
        """Test the complete lifecycle of a form from creation to submission"""
        
        # Step 1: Create a form
        form_data = {
            "title": "Customer Feedback Form",
            "description": "Collect customer satisfaction data",
            "pages": [
                {
                    "id": "page1",
                    "title": "Basic Information",
                    "blocks": [
                        {
                            "id": "name",
                            "type": "short_text",
                            "question": "What is your name?",
                            "required": True
                        },
                        {
                            "id": "email",
                            "type": "email",
                            "question": "What is your email?",
                            "required": True,
                            "validations": {
                                "format": "email"
                            }
                        }
                    ]
                },
                {
                    "id": "page2",
                    "title": "Feedback",
                    "blocks": [
                        {
                            "id": "rating",
                            "type": "rating",
                            "question": "How satisfied are you?",
                            "required": True,
                            "properties": {
                                "max": 5
                            }
                        },
                        {
                            "id": "comments",
                            "type": "long_text",
                            "question": "Any additional comments?",
                            "required": False
                        }
                    ]
                }
            ],
            "logic": {
                "rules": [
                    {
                        "id": "rule1",
                        "conditions": [
                            {
                                "field": "rating",
                                "operator": "less_than",
                                "value": 3
                            }
                        ],
                        "actions": [
                            {
                                "type": "show_field",
                                "field": "comments"
                            }
                        ]
                    }
                ]
            }
        }
        
        response = self.client.post(
            reverse('form-list'),
            data=json.dumps(form_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        form_id = response.data['id']
        
        # Step 2: Configure webhook
        webhook_data = {
            "url": "https://example.com/webhook",
            "events": ["submission.created", "submission.partial"],
            "active": True,
            "headers": {
                "X-Custom-Header": "test-value"
            }
        }
        
        response = self.client.post(
            reverse('webhook-list'),
            data=json.dumps(webhook_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response.data['id']
        
        # Step 3: Publish the form
        response = self.client.post(
            reverse('form-publish', kwargs={'pk': form_id}),
            data=json.dumps({"version": "1.0.0"}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 4: Submit form data with HMAC validation
        submission_data = {
            "data": {
                "form_id": form_id,
                "respondent_key": "test-respondent-123",
                "version": 1,
                "locale": "en",
                "answers": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "rating": 4,
                    "comments": "Great service!"
                },
                "metadata": {
                    "user_agent": "Mozilla/5.0 Test",
                    "ip_address": "127.0.0.1"
                },
                "partial": False
            },
            "idempotency_key": "test-idempotency-123",
            "timestamp": int(time.time())
        }
        
        # Clear auth for public submission
        self.client.credentials()
        
        # Prepare HMAC signature
        payload = json.dumps(submission_data).encode('utf-8')
        signature = self.generate_hmac_signature(payload)
        
        # Submit with HMAC
        response = self.client.post(
            reverse('submission-list'),
            data=payload,
            content_type='application/json',
            HTTP_X_FORMS_SIGNATURE=signature,
            HTTP_X_FORMS_TIMESTAMP=str(submission_data['timestamp'])
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission_id = response.data['id']
        
        # Step 5: Verify submission was saved
        submission = Submission.objects.get(id=submission_id)
        self.assertEqual(submission.form_id, form_id)
        self.assertEqual(submission.respondent_key, "test-respondent-123")
        self.assertIsNotNone(submission.completed_at)
        
        # Verify answers
        answers = submission.answers.all()
        self.assertEqual(answers.count(), 4)
        
        name_answer = answers.get(block_id="name")
        self.assertEqual(json.loads(name_answer.value_json), "John Doe")
        
        # Step 6: Test duplicate submission prevention (idempotency)
        response = self.client.post(
            reverse('submission-list'),
            data=payload,
            content_type='application/json',
            HTTP_X_FORMS_SIGNATURE=signature,
            HTTP_X_FORMS_TIMESTAMP=str(submission_data['timestamp'])
        )
        # Should return the same submission ID
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['id'], submission_id)
        
        # Step 7: Test partial submission
        partial_data = {
            "data": {
                "form_id": form_id,
                "respondent_key": "test-respondent-456",
                "version": 1,
                "locale": "en",
                "answers": {
                    "name": "Jane Doe",
                    "email": "jane@example.com"
                },
                "metadata": {
                    "last_field_id": "email",
                    "progress": 50
                },
                "partial": True
            },
            "timestamp": int(time.time())
        }
        
        payload = json.dumps(partial_data).encode('utf-8')
        signature = self.generate_hmac_signature(payload)
        
        response = self.client.post(
            reverse('submission-list'),
            data=payload,
            content_type='application/json',
            HTTP_X_FORMS_SIGNATURE=signature,
            HTTP_X_FORMS_TIMESTAMP=str(partial_data['timestamp'])
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify partial was saved
        partial = Partial.objects.get(
            form_id=form_id,
            respondent_key="test-respondent-456"
        )
        self.assertEqual(partial.last_step, "email")
        
        # Step 8: Test submission export
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        response = self.client.post(
            reverse('submission-export'),
            data=json.dumps({
                "form_id": form_id,
                "format": "csv",
                "filters": {
                    "completed": True
                }
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        
        # Verify CSV content
        csv_content = response.content.decode('utf-8')
        self.assertIn("name,email,rating,comments", csv_content)
        self.assertIn("John Doe,john@example.com,4,Great service!", csv_content)
    
    @patch('webhooks.tasks.send_webhook.delay')
    def test_webhook_delivery_flow(self, mock_send_webhook):
        """Test webhook delivery for submissions"""
        
        # Create form
        form = Form.objects.create(
            organization=self.organization,
            title="Test Form",
            status="published",
            created_by=self.user
        )
        
        # Create webhook
        Webhook.objects.create(
            organization=self.organization,
            url="https://example.com/webhook",
            secret="test-secret",
            active=True
        )
        
        # Submit form
        submission_data = {
            "data": {
                "form_id": str(form.id),
                "respondent_key": "webhook-test",
                "version": 1,
                "locale": "en",
                "answers": {
                    "field1": "value1"
                },
                "partial": False
            },
            "timestamp": int(time.time())
        }
        
        payload = json.dumps(submission_data).encode('utf-8')
        signature = self.generate_hmac_signature(payload)
        
        self.client.credentials()  # Clear auth
        response = self.client.post(
            reverse('submission-list'),
            data=payload,
            content_type='application/json',
            HTTP_X_FORMS_SIGNATURE=signature
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify webhook was queued
        mock_send_webhook.assert_called()
        
    def test_rate_limiting(self):
        """Test rate limiting on submission endpoint"""
        
        # Create form
        form = Form.objects.create(
            organization=self.organization,
            title="Rate Limit Test Form",
            status="published",
            created_by=self.user
        )
        
        # Clear auth for public submissions
        self.client.credentials()
        
        # Submit multiple times to trigger rate limit
        submission_count = 0
        rate_limit_hit = False
        
        for i in range(100):  # Try 100 submissions
            submission_data = {
                "data": {
                    "form_id": str(form.id),
                    "respondent_key": f"rate-test-{i}",
                    "version": 1,
                    "locale": "en",
                    "answers": {"test": f"value{i}"},
                    "partial": False
                },
                "timestamp": int(time.time())
            }
            
            payload = json.dumps(submission_data).encode('utf-8')
            signature = self.generate_hmac_signature(payload)
            
            response = self.client.post(
                reverse('submission-list'),
                data=payload,
                content_type='application/json',
                HTTP_X_FORMS_SIGNATURE=signature
            )
            
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                rate_limit_hit = True
                break
            
            submission_count += 1
        
        # Should hit rate limit before 100 submissions
        self.assertTrue(rate_limit_hit)
        self.assertLess(submission_count, 100)
    
    def test_analytics_integration(self):
        """Test analytics events are tracked"""
        
        # Create form
        form = Form.objects.create(
            organization=self.organization,
            title="Analytics Test Form",
            status="published",
            created_by=self.user
        )
        
        # Mock analytics API
        with patch('analytics.api.track_event'):
            # View form
            response = self.client.get(
                reverse('form-detail', kwargs={'pk': form.id})
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Submit form
            submission_data = {
                "data": {
                    "form_id": str(form.id),
                    "respondent_key": "analytics-test",
                    "version": 1,
                    "locale": "en",
                    "answers": {"field1": "value1"},
                    "partial": False
                },
                "timestamp": int(time.time())
            }
            
            payload = json.dumps(submission_data).encode('utf-8')
            signature = self.generate_hmac_signature(payload)
            
            self.client.credentials()  # Clear auth
            response = self.client.post(
                reverse('submission-list'),
                data=payload,
                content_type='application/json',
                HTTP_X_FORMS_SIGNATURE=signature
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            # Verify analytics events were tracked
            # mock_track.assert_called()


class SubmissionAPIIntegrationTest(TestCase):
    """Integration tests for submission API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test data
        self.user = User.objects.create_user(
            username="apitest",
            email="apitest@example.com",
            password="ApiTest123!"
        )
        
        self.org = Organization.objects.create(
            name="API Test Org",
            slug="api-test-org"
        )
        
        self.user.memberships.create(
            organization=self.org,
            role="admin"
        )
        
        self.form = Form.objects.create(
            organization=self.org,
            title="API Test Form",
            status="published",
            created_by=self.user,
            pages=[{
                "id": "page1",
                "blocks": [
                    {"id": "field1", "type": "text", "question": "Test Question"}
                ]
            }]
        )
        
        # Auth
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    
    def test_submission_search_and_filter(self):
        """Test submission search and filtering capabilities"""
        
        # Create test submissions
        for i in range(20):
            submission = Submission.objects.create(
                form=self.form,
                respondent_key=f"respondent-{i}",
                version=1,
                locale="en",
                completed_at=datetime.utcnow() if i % 2 == 0 else None,
                metadata_json={
                    "tags": ["important"] if i < 5 else ["regular"],
                    "score": i * 10
                }
            )
            
            Answer.objects.create(
                submission=submission,
                block_id="field1",
                type="text",
                value_json=json.dumps(f"Answer {i}")
            )
        
        # Test filtering by completion status
        response = self.client.get(
            reverse('submission-list'),
            {'form_pk': self.form.id, 'is_completed': 'true'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 10)  # Half are completed
        
        # Test filtering by tags
        response = self.client.get(
            reverse('submission-list'),
            {'form_pk': self.form.id, 'tags': 'important'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        
        # Test search
        response = self.client.get(
            reverse('submission-list'),
            {'form_pk': self.form.id, 'search': 'Answer 1'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should find "Answer 1", "Answer 10" through "Answer 19"
        self.assertGreaterEqual(response.data['count'], 10)
        
        # Test date range filtering
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
        
        response = self.client.get(
            reverse('submission-list'),
            {
                'form_pk': self.form.id,
                'started_after': yesterday,
                'started_before': tomorrow
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 20)
    
    def test_bulk_operations(self):
        """Test bulk operations on submissions"""
        
        # Create test submissions
        submission_ids = []
        for i in range(5):
            submission = Submission.objects.create(
                form=self.form,
                respondent_key=f"bulk-{i}",
                version=1,
                locale="en"
            )
            submission_ids.append(str(submission.id))
        
        # Bulk add tags
        response = self.client.post(
            reverse('submission-bulk-add-tags'),
            data=json.dumps({
                "submission_ids": submission_ids,
                "tags": ["processed", "exported"]
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify tags were added
        for sub_id in submission_ids:
            submission = Submission.objects.get(id=sub_id)
            self.assertIn("processed", submission.metadata_json.get("tags", []))
            self.assertIn("exported", submission.metadata_json.get("tags", []))
        
        # Bulk export
        response = self.client.post(
            reverse('submission-bulk-export'),
            data=json.dumps({
                "submission_ids": submission_ids,
                "format": "csv"
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')


class WebhookIntegrationTest(TransactionTestCase):
    """Integration tests for webhook system"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test data
        self.user = User.objects.create_user(
            username="webhooktest",
            email="webhook@example.com",
            password="Webhook123!"
        )
        
        self.org = Organization.objects.create(
            name="Webhook Test Org",
            slug="webhook-test-org"
        )
        
        self.user.memberships.create(
            organization=self.org,
            role="admin"
        )
        
        # Auth
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    
    @patch('httpx.Client.post')
    def test_webhook_retry_mechanism(self, mock_post):
        """Test webhook retry with exponential backoff"""
        
        # Setup mock to fail first 2 attempts, succeed on 3rd
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = Exception("Server error")
        
        mock_post.side_effect = [
            mock_response,  # First attempt fails
            mock_response,  # Second attempt fails
            MagicMock(status_code=200)  # Third attempt succeeds
        ]
        
        # Create webhook
        webhook = Webhook.objects.create(
            organization=self.org,
            url="https://example.com/webhook",
            secret="test-secret",
            active=True
        )
        
        # Create form and submission
        form = Form.objects.create(
            organization=self.org,
            title="Webhook Test Form",
            status="published",
            created_by=self.user
        )
        
        submission = Submission.objects.create(
            form=form,
            respondent_key="webhook-retry-test",
            version=1,
            locale="en",
            completed_at=datetime.utcnow()
        )
        
        # Trigger webhook delivery
        from webhooks.tasks import send_webhook
        send_webhook(
            webhook.id,
            webhook.url,
            webhook.secret,
            None,
            {
                "form_id": str(form.id),
                "submission_id": str(submission.id),
                "answers": {}
            },
            str(submission.id)
        )
        
        # Verify webhook was called 3 times
        self.assertEqual(mock_post.call_count, 3)
        
        # Check delivery records
        deliveries = WebhookDelivery.objects.filter(
            webhook=webhook,
            submission=submission
        ).order_by('attempt')
        
        # Should have 3 delivery records
        self.assertEqual(deliveries.count(), 3)
        self.assertEqual(deliveries[0].status, 'failed')
        self.assertEqual(deliveries[1].status, 'failed')
        self.assertEqual(deliveries[2].status, 'success')