import pytest
from unittest.mock import patch, Mock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization, Membership
from forms.models import Form

User = get_user_model()


class AnalyticsAPITestCase(TestCase):
    """Test the analytics API endpoints that proxy to ClickHouse"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser'
        )
        self.organization = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        # Create owner membership
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
        self.client.force_authenticate(user=self.user)

    @patch('analytics.views.httpx.Client')
    def test_track_event(self, mock_httpx):
        """Test tracking an analytics event"""
        # Mock the httpx response
        mock_response = Mock()
        mock_response.json.return_value = {'status': 'ok'}
        mock_response.status_code = 200
        mock_client = Mock()
        mock_client.post.return_value = mock_response
        mock_httpx.return_value.__enter__.return_value = mock_client
        
        # Send track event request
        response = self.client.post('/api/analytics/events', {
            'form_id': str(self.form.id),
            'event_type': 'form_view',
            'session_id': 'session123',
            'properties': {'page': 'landing'}
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
        
        # Verify the request was forwarded to analytics service
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        self.assertIn('/events', call_args[0][0])
        self.assertEqual(call_args[1]['json']['form_id'], str(self.form.id))
        self.assertEqual(call_args[1]['json']['organization_id'], str(self.organization.id))

    @patch('analytics.views.httpx.Client')
    def test_track_events_batch(self, mock_httpx):
        """Test tracking multiple analytics events"""
        # Mock the httpx response
        mock_response = Mock()
        mock_response.json.return_value = {'status': 'ok'}
        mock_response.status_code = 200
        mock_client = Mock()
        mock_client.post.return_value = mock_response
        mock_httpx.return_value.__enter__.return_value = mock_client
        
        # Send batch track request
        response = self.client.post('/api/analytics/events/batch', {
            'events': [
                {
                    'form_id': str(self.form.id),
                    'event_type': 'form_view',
                    'session_id': 'session123'
                },
                {
                    'form_id': str(self.form.id),
                    'event_type': 'form_submit',
                    'session_id': 'session123'
                }
            ]
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')

    @patch('analytics.views.httpx.Client')
    def test_get_form_analytics(self, mock_httpx):
        """Test getting analytics for a form"""
        # Mock the httpx response
        mock_response = Mock()
        mock_response.json.return_value = {
            'views': 100,
            'submissions': 25,
            'conversion_rate': 25.0
        }
        mock_response.status_code = 200
        mock_client = Mock()
        mock_client.get.return_value = mock_response
        mock_httpx.return_value.__enter__.return_value = mock_client
        
        # Get form analytics
        response = self.client.get(f'/api/analytics/forms/{self.form.id}/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['views'], 100)
        self.assertEqual(response.data['submissions'], 25)
        self.assertEqual(response.data['conversion_rate'], 25.0)
        
        # Verify the request was forwarded to analytics service
        mock_client.get.assert_called_once()
        call_args = mock_client.get.call_args
        self.assertIn(f'/analytics/form/{self.form.id}', call_args[0][0])

    @patch('analytics.views.httpx.Client')
    def test_get_form_funnel(self, mock_httpx):
        """Test getting funnel analytics for a form"""
        # Mock the httpx response
        mock_response = Mock()
        mock_response.json.return_value = {
            'funnel': [
                {'step': 'view', 'count': 100},
                {'step': 'start', 'count': 80},
                {'step': 'complete', 'count': 25}
            ]
        }
        mock_response.status_code = 200
        mock_client = Mock()
        mock_client.get.return_value = mock_response
        mock_httpx.return_value.__enter__.return_value = mock_client
        
        # Get funnel analytics
        response = self.client.get(f'/api/analytics/forms/{self.form.id}/funnel/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['funnel']), 3)
        self.assertEqual(response.data['funnel'][0]['step'], 'view')
        
    def test_analytics_permission_denied(self):
        """Test that users without access to form can't track events"""
        # Create another user without access
        other_user = User.objects.create_user(
            email='other@example.com',
            password='otherpass123',
            username='otheruser'
        )
        self.client.force_authenticate(user=other_user)
        
        # Try to track event
        response = self.client.post('/api/analytics/events', {
            'form_id': str(self.form.id),
            'event_type': 'form_view',
            'session_id': 'session123'
        }, format='json')
        
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], 'Permission denied')

    def test_analytics_form_not_found(self):
        """Test tracking event for non-existent form"""
        response = self.client.post('/api/analytics/events', {
            'form_id': 'non-existent-id',
            'event_type': 'form_view',
            'session_id': 'session123'
        }, format='json')
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error'], 'Form not found')