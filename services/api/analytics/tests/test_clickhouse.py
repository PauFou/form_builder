"""
Tests for ClickHouse analytics integration
"""
from datetime import datetime, timedelta
from uuid import uuid4
from django.test import TestCase
from unittest.mock import patch, MagicMock

from analytics.clickhouse_client import ClickHouseClient, ClickHouseError


class ClickHouseClientTestCase(TestCase):
    """Test ClickHouse client functionality"""
    
    def setUp(self):
        """Set up test client"""
        # Mock settings
        self.mock_settings = {
            'CLICKHOUSE_URL': 'http://localhost:8123',
            'CLICKHOUSE_DB': 'test_analytics',
            'CLICKHOUSE_USER': 'test_user',
            'CLICKHOUSE_PASSWORD': 'test_password'
        }
        
        with patch('analytics.clickhouse_client.settings') as mock_settings:
            for key, value in self.mock_settings.items():
                setattr(mock_settings, key, value)
            self.client = ClickHouseClient()
    
    @patch('analytics.clickhouse_client.requests.post')
    def test_insert_event(self, mock_post):
        """Test inserting a single event"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ''
        mock_post.return_value = mock_response
        
        # Test data
        event_data = {
            'form_id': str(uuid4()),
            'session_id': 'test_session_123',
            'timestamp': datetime.now(),
            'page_load_time_ms': 250
        }
        
        # Insert event
        result = self.client.insert_event('form_views', event_data)
        
        # Verify
        self.assertTrue(result)
        mock_post.assert_called_once()
        
        # Check the request was formed correctly
        call_args = mock_post.call_args
        self.assertEqual(call_args.kwargs['headers']['X-ClickHouse-Database'], 'test_analytics')
        self.assertIn('INSERT INTO form_views', call_args.kwargs['data'])
    
    @patch('analytics.clickhouse_client.requests.post')
    def test_insert_batch(self, mock_post):
        """Test batch insert"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ''
        mock_post.return_value = mock_response
        
        # Test data
        events = [
            {
                'form_id': str(uuid4()),
                'session_id': f'session_{i}',
                'timestamp': datetime.now(),
                'interaction_type': 'field_change',
                'field_id': f'field_{i}'
            }
            for i in range(5)
        ]
        
        # Insert batch
        result = self.client.insert_batch('form_interactions', events)
        
        # Verify
        self.assertTrue(result)
        mock_post.assert_called_once()
        
        # Check batch insert format
        call_data = mock_post.call_args.kwargs['data']
        self.assertIn('INSERT INTO form_interactions', call_data)
        self.assertIn('VALUES', call_data)
        # Should have 6 opening parens: 1 for columns list + 5 for value tuples
        self.assertEqual(call_data.count('('), 6)
    
    @patch('analytics.clickhouse_client.requests.post')
    def test_get_form_analytics(self, mock_post):
        """Test getting form analytics"""
        # Mock response with analytics data
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '''{"total_views": 1500, "unique_sessions": 450, "unique_visitors": 400}
{"total_submissions": 120, "completed_submissions": 100, "partial_submissions": 20, "avg_completion_rate": 0.83}'''
        mock_post.return_value = mock_response
        
        # Get analytics
        form_id = str(uuid4())
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()
        
        result = self.client.get_form_analytics(form_id, start_date, end_date)
        
        # Verify structure
        self.assertIn('form_id', result)
        self.assertIn('period', result)
        self.assertIn('views', result)
        self.assertIn('submissions', result)
        self.assertEqual(result['form_id'], form_id)
    
    @patch('analytics.clickhouse_client.requests.post')
    def test_get_funnel_analytics(self, mock_post):
        """Test getting funnel analytics"""
        # Mock funnel data
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '''{"total_sessions": 500, "reached_page_1": 500, "reached_page_2": 380, "reached_page_3": 250, "reached_page_4": 180, "completed_page_1": 480, "completed_page_2": 350, "completed_page_3": 230, "completed_page_4": 170, "submit_attempts": 175, "completions": 170}'''
        mock_post.return_value = mock_response
        
        # Get funnel
        form_id = str(uuid4())
        result = self.client.get_funnel_analytics(
            form_id,
            datetime.now() - timedelta(days=7),
            datetime.now()
        )
        
        # Verify structure
        self.assertIn('total_sessions', result)
        self.assertIn('funnel_steps', result)
        self.assertIn('overall_conversion_rate', result)
        self.assertIsInstance(result['funnel_steps'], list)
        
        # Check conversion rate calculation
        self.assertEqual(
            result['overall_conversion_rate'],
            (170 / 500) * 100
        )
    
    @patch('analytics.clickhouse_client.requests.post')
    def test_error_handling(self, mock_post):
        """Test error handling"""
        # Mock error response
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = 'Internal server error'
        mock_post.return_value = mock_response
        
        # Test insert should return False
        result = self.client.insert_event('form_views', {'test': 'data'})
        self.assertFalse(result)
        
        # Test query should raise ClickHouseError
        with self.assertRaises(ClickHouseError):
            self.client._execute_query("SELECT * FROM form_views")
    
    def test_cache_usage(self):
        """Test that results are cached"""
        with patch('analytics.clickhouse_client.requests.post') as mock_post:
            # Mock response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.text = '{"total_views": 100}'
            mock_post.return_value = mock_response
            
            # First call
            form_id = str(uuid4())
            start_date = datetime.now().date() - timedelta(days=1)
            end_date = datetime.now().date()
            
            with patch('analytics.clickhouse_client.cache') as mock_cache:
                mock_cache.get.return_value = None

                _result = self.client.get_form_analytics(
                    form_id,
                    datetime.combine(start_date, datetime.min.time()),
                    datetime.combine(end_date, datetime.max.time())
                )

                # Cache should be set
                mock_cache.set.assert_called_once()
                cache_key = mock_cache.set.call_args[0][0]
                self.assertIn('analytics:form:', cache_key)
                self.assertIn(form_id, cache_key)