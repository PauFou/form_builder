import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from unittest.mock import patch, Mock
from organizations.models import Organization
from forms.models import Form
from analytics.models import AnalyticsEvent
from analytics.services import AnalyticsService
from analytics.tasks import process_analytics_batch

User = get_user_model()


class AnalyticsEventTestCase(TestCase):
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

    def test_create_analytics_event(self):
        """Test creating an analytics event"""
        event = AnalyticsEvent.objects.create(
            form=self.form,
            event_type='form_view',
            session_id='session123',
            user_agent='Mozilla/5.0...',
            ip_address='192.168.1.1',
            properties={'page': 'landing'}
        )
        
        self.assertEqual(event.form, self.form)
        self.assertEqual(event.event_type, 'form_view')
        self.assertEqual(event.session_id, 'session123')
        self.assertEqual(event.properties['page'], 'landing')

    def test_event_timestamp_auto_set(self):
        """Test that timestamp is automatically set"""
        before = timezone.now()
        event = AnalyticsEvent.objects.create(
            form=self.form,
            event_type='form_view',
            session_id='session123'
        )
        after = timezone.now()
        
        self.assertGreaterEqual(event.timestamp, before)
        self.assertLessEqual(event.timestamp, after)


class AnalyticsServiceTestCase(TestCase):
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
        self.service = AnalyticsService()

    def test_track_event(self):
        """Test tracking an analytics event"""
        self.service.track_event(
            form_id=self.form.id,
            event_type='form_view',
            session_id='session123',
            properties={'page': 'landing'}
        )
        
        event = AnalyticsEvent.objects.get(form=self.form)
        self.assertEqual(event.event_type, 'form_view')
        self.assertEqual(event.session_id, 'session123')
        self.assertEqual(event.properties['page'], 'landing')

    @patch('analytics.services.requests.post')
    def test_send_to_clickhouse(self, mock_post):
        """Test sending events to ClickHouse"""
        mock_post.return_value.status_code = 200
        
        events = [
            {
                'form_id': str(self.form.id),
                'event_type': 'form_view',
                'timestamp': timezone.now().isoformat(),
                'session_id': 'session123',
                'properties': {'page': 'landing'}
            }
        ]
        
        self.service.send_to_clickhouse(events)
        
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        
        self.assertIn('clickhouse', args[0])  # ClickHouse URL
        self.assertIn('INSERT INTO analytics_events', kwargs['data'])

    def test_get_form_analytics(self):
        """Test getting analytics for a form"""
        # Create test events
        now = timezone.now()
        
        # Form views
        for i in range(5):
            AnalyticsEvent.objects.create(
                form=self.form,
                event_type='form_view',
                session_id=f'session{i}',
                timestamp=now - timedelta(days=i)
            )
        
        # Submissions
        for i in range(2):
            AnalyticsEvent.objects.create(
                form=self.form,
                event_type='form_submit',
                session_id=f'session{i}',
                timestamp=now - timedelta(days=i)
            )
        
        analytics = self.service.get_form_analytics(
            self.form.id,
            start_date=now - timedelta(days=7),
            end_date=now
        )
        
        self.assertIn('overview', analytics)
        self.assertIn('views_over_time', analytics)
        self.assertEqual(analytics['overview']['total_views'], 5)
        self.assertEqual(analytics['overview']['total_submissions'], 2)
        self.assertEqual(analytics['overview']['conversion_rate'], 40.0)  # 2/5 * 100

    def test_get_funnel_analytics(self):
        """Test getting funnel analytics"""
        # Create events representing a funnel
        session = 'session123'
        
        AnalyticsEvent.objects.create(
            form=self.form,
            event_type='form_view',
            session_id=session
        )
        
        AnalyticsEvent.objects.create(
            form=self.form,
            event_type='step_view',
            session_id=session,
            properties={'step': 1}
        )
        
        AnalyticsEvent.objects.create(
            form=self.form,
            event_type='step_view',
            session_id=session,
            properties={'step': 2}
        )
        
        AnalyticsEvent.objects.create(
            form=self.form,
            event_type='form_submit',
            session_id=session
        )
        
        funnel = self.service.get_funnel_analytics(self.form.id)
        
        self.assertIsInstance(funnel, list)
        self.assertEqual(len(funnel), 4)  # View, Step 1, Step 2, Submit
        
        # Check that counts decrease through funnel
        self.assertEqual(funnel[0]['count'], 1)  # Form view
        self.assertEqual(funnel[-1]['count'], 1)  # Submit

    def test_get_completion_rates(self):
        """Test getting field completion rates"""
        # Create events for different fields
        session1 = 'session1'
        session2 = 'session2'
        
        # Both sessions view form
        for session in [session1, session2]:
            AnalyticsEvent.objects.create(
                form=self.form,
                event_type='form_view',
                session_id=session
            )
        
        # Both sessions fill field1
        for session in [session1, session2]:
            AnalyticsEvent.objects.create(
                form=self.form,
                event_type='field_change',
                session_id=session,
                properties={'field': 'field1'}
            )
        
        # Only session1 fills field2
        AnalyticsEvent.objects.create(
            form=self.form,
            event_type='field_change',
            session_id=session1,
            properties={'field': 'field2'}
        )
        
        completion_rates = self.service.get_completion_rates(self.form.id)
        
        self.assertIsInstance(completion_rates, list)
        # Should show 100% completion for field1, 50% for field2

    @patch('analytics.services.cache.get')
    @patch('analytics.services.cache.set')
    def test_analytics_caching(self, mock_cache_set, mock_cache_get):
        """Test that analytics results are cached"""
        mock_cache_get.return_value = None  # Cache miss
        
        self.service.get_form_analytics(self.form.id)
        
        # Check that cache.set was called
        mock_cache_set.assert_called_once()
        cache_key = mock_cache_set.call_args[0][0]
        self.assertIn(str(self.form.id), cache_key)

    def test_real_time_analytics(self):
        """Test real-time analytics updates"""
        # Track events in real-time
        self.service.track_event(
            form_id=self.form.id,
            event_type='form_view',
            session_id='session123',
            real_time=True
        )
        
        # Should create event immediately
        self.assertEqual(AnalyticsEvent.objects.count(), 1)

    def test_batch_processing(self):
        """Test batch processing of analytics events"""
        # Create multiple events
        events = []
        for i in range(10):
            events.append({
                'form_id': str(self.form.id),
                'event_type': 'form_view',
                'session_id': f'session{i}',
                'timestamp': timezone.now().isoformat()
            })
        
        # Process batch
        self.service.process_batch(events)
        
        # Check events were created
        self.assertEqual(AnalyticsEvent.objects.count(), 10)


class AnalyticsTaskTestCase(TestCase):
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

    @patch('analytics.tasks.AnalyticsService.process_batch')
    def test_process_analytics_batch_task(self, mock_process):
        """Test processing analytics batch task"""
        events = [
            {
                'form_id': str(self.form.id),
                'event_type': 'form_view',
                'session_id': 'session123',
                'timestamp': timezone.now().isoformat()
            }
        ]
        
        # Run the task
        process_analytics_batch(events)
        
        # Check that service method was called
        mock_process.assert_called_once_with(events)

    def test_event_deduplication(self):
        """Test that duplicate events are not processed twice"""
        event_data = {
            'form_id': str(self.form.id),
            'event_type': 'form_view',
            'session_id': 'session123',
            'timestamp': timezone.now().isoformat(),
            'event_id': 'unique123'  # Unique identifier
        }
        
        service = AnalyticsService()
        
        # Process same event twice
        service.process_batch([event_data])
        service.process_batch([event_data])
        
        # Should only create one event
        self.assertEqual(AnalyticsEvent.objects.count(), 1)

    def test_analytics_retention_cleanup(self):
        """Test cleanup of old analytics events"""
        # Create old events
        old_date = timezone.now() - timedelta(days=400)  # Older than retention period
        
        AnalyticsEvent.objects.create(
            form=self.form,
            event_type='form_view',
            session_id='session123',
            timestamp=old_date
        )
        
        # Create recent events
        AnalyticsEvent.objects.create(
            form=self.form,
            event_type='form_view',
            session_id='session456'
        )
        
        service = AnalyticsService()
        service.cleanup_old_events(retention_days=365)
        
        # Should only have recent event
        self.assertEqual(AnalyticsEvent.objects.count(), 1)
        remaining_event = AnalyticsEvent.objects.first()
        self.assertEqual(remaining_event.session_id, 'session456')