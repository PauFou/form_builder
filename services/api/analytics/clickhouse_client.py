"""
ClickHouse client for analytics data
"""
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class ClickHouseClient:
    """Client for interacting with ClickHouse analytics database"""
    
    def __init__(self):
        self.base_url = settings.CLICKHOUSE_URL or "http://localhost:8123"
        self.database = settings.CLICKHOUSE_DB or "forms_analytics"
        self.username = settings.CLICKHOUSE_USER or "forms_user"
        self.password = settings.CLICKHOUSE_PASSWORD or "forms_password"
        
    def _execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Execute a ClickHouse query and return results"""
        try:
            # Build query URL
            url = f"{self.base_url}/"
            
            # Prepare request
            headers = {
                'X-ClickHouse-User': self.username,
                'X-ClickHouse-Key': self.password,
                'X-ClickHouse-Database': self.database,
            }
            
            # Add parameters to query if provided
            if params:
                for key, value in params.items():
                    if isinstance(value, str):
                        value = f"'{value}'"
                    elif isinstance(value, datetime):
                        value = f"'{value.isoformat()}'"
                    elif isinstance(value, list):
                        value = f"[{','.join(str(v) for v in value)}]"
                    query = query.replace(f'{{{key}}}', str(value))
            
            # Execute query
            response = requests.post(
                url,
                data=query,
                headers=headers,
                params={'query': query} if not query else None
            )
            
            if response.status_code != 200:
                logger.error(f"ClickHouse query failed: {response.text}")
                raise ClickHouseError(f"Query failed: {response.text}")
            
            # Parse JSON response
            if response.text:
                lines = response.text.strip().split('\n')
                return [json.loads(line) for line in lines if line]
            return []
            
        except requests.RequestException as e:
            logger.error(f"ClickHouse connection error: {str(e)}")
            raise ClickHouseError(f"Connection error: {str(e)}")
    
    def insert_event(self, table: str, data: Dict[str, Any]) -> bool:
        """Insert a single event into ClickHouse"""
        try:
            columns = ', '.join(data.keys())
            values = ', '.join(
                f"'{v}'" if isinstance(v, str) else str(v) 
                for v in data.values()
            )
            
            query = f"INSERT INTO {table} ({columns}) VALUES ({values})"
            self._execute_query(query)
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert event: {str(e)}")
            return False
    
    def insert_batch(self, table: str, data: List[Dict[str, Any]]) -> bool:
        """Insert multiple events in batch"""
        if not data:
            return True
            
        try:
            # Get columns from first record
            columns = list(data[0].keys())
            
            # Build values
            values_list = []
            for record in data:
                values = []
                for col in columns:
                    val = record.get(col, '')
                    if isinstance(val, str):
                        val = val.replace("'", "\\'")
                        values.append(f"'{val}'")
                    elif val is None:
                        values.append('NULL')
                    else:
                        values.append(str(val))
                values_list.append(f"({', '.join(values)})")
            
            query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES {', '.join(values_list)}"
            self._execute_query(query)
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert batch: {str(e)}")
            return False
    
    def get_form_analytics(
        self, 
        form_id: str,
        start_date: datetime,
        end_date: datetime,
        metrics: List[str] = None
    ) -> Dict[str, Any]:
        """Get analytics for a specific form"""
        
        # Cache key
        cache_key = f"analytics:form:{form_id}:{start_date.date()}:{end_date.date()}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Default metrics if not specified
        if not metrics:
            metrics = ['views', 'submissions', 'completion_rate', 'avg_time', 'bounce_rate']
        
        result = {
            'form_id': form_id,
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }
        
        # Get view metrics
        if 'views' in metrics:
            query = """
                SELECT
                    count() as total_views,
                    uniq(session_id) as unique_sessions,
                    uniq(ip_address) as unique_visitors
                FROM form_views
                WHERE form_id = {form_id}
                    AND timestamp >= {start_date}
                    AND timestamp <= {end_date}
            """
            views_data = self._execute_query(query, {
                'form_id': form_id,
                'start_date': start_date,
                'end_date': end_date
            })
            if views_data:
                result['views'] = views_data[0]
        
        # Get submission metrics
        if 'submissions' in metrics or 'completion_rate' in metrics:
            query = """
                SELECT
                    count() as total_submissions,
                    countIf(is_complete = 1) as completed_submissions,
                    countIf(is_partial = 1) as partial_submissions,
                    avg(completion_rate) as avg_completion_rate
                FROM form_submissions
                WHERE form_id = {form_id}
                    AND timestamp >= {start_date}
                    AND timestamp <= {end_date}
            """
            submission_data = self._execute_query(query, {
                'form_id': form_id,
                'start_date': start_date,
                'end_date': end_date
            })
            if submission_data:
                result['submissions'] = submission_data[0]
                if 'completion_rate' in metrics and result.get('views'):
                    total_views = result['views'].get('unique_sessions', 1)
                    completed = submission_data[0].get('completed_submissions', 0)
                    result['completion_rate'] = (completed / total_views * 100) if total_views > 0 else 0
        
        # Get time metrics
        if 'avg_time' in metrics:
            query = """
                SELECT
                    avg(total_time_ms) / 1000 as avg_time_seconds,
                    quantile(0.5)(total_time_ms) / 1000 as median_time_seconds,
                    quantile(0.95)(total_time_ms) / 1000 as p95_time_seconds
                FROM form_submissions
                WHERE form_id = {form_id}
                    AND timestamp >= {start_date}
                    AND timestamp <= {end_date}
                    AND total_time_ms > 0
            """
            time_data = self._execute_query(query, {
                'form_id': form_id,
                'start_date': start_date,
                'end_date': end_date
            })
            if time_data:
                result['time_metrics'] = time_data[0]
        
        # Get bounce rate
        if 'bounce_rate' in metrics:
            query = """
                WITH sessions_with_interactions AS (
                    SELECT DISTINCT session_id
                    FROM form_interactions
                    WHERE form_id = {form_id}
                        AND timestamp >= {start_date}
                        AND timestamp <= {end_date}
                )
                SELECT
                    (1 - (SELECT count() FROM sessions_with_interactions) / 
                     (SELECT uniq(session_id) FROM form_views 
                      WHERE form_id = {form_id} 
                        AND timestamp >= {start_date}
                        AND timestamp <= {end_date})) * 100 as bounce_rate
            """
            bounce_data = self._execute_query(query, {
                'form_id': form_id,
                'start_date': start_date,
                'end_date': end_date
            })
            if bounce_data:
                result['bounce_rate'] = bounce_data[0].get('bounce_rate', 0)
        
        # Cache results for 5 minutes
        cache.set(cache_key, result, 300)
        
        return result
    
    def get_field_analytics(
        self,
        form_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get field-level analytics"""
        
        query = """
            SELECT
                field_id,
                field_type,
                count() as total_interactions,
                uniq(session_id) as unique_sessions,
                countIf(interaction_type = 'field_change') as changes,
                countIf(interaction_type = 'validation_error') as errors,
                avg(time_on_field_ms) / 1000 as avg_time_seconds,
                quantile(0.95)(time_on_field_ms) / 1000 as p95_time_seconds,
                groupArray((error_type, error_message)) as error_details
            FROM form_interactions
            WHERE form_id = {form_id}
                AND timestamp >= {start_date}
                AND timestamp <= {end_date}
                AND field_id != ''
            GROUP BY field_id, field_type
            ORDER BY total_interactions DESC
        """
        
        results = self._execute_query(query, {
            'form_id': form_id,
            'start_date': start_date,
            'end_date': end_date
        })
        
        return results
    
    def get_funnel_analytics(
        self,
        form_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get funnel analytics for multi-step forms"""
        
        query = """
            WITH funnel_data AS (
                SELECT
                    session_id,
                    max(page_number) as max_page_reached,
                    maxIf(page_number, interaction_type = 'step_complete') as max_page_completed,
                    any(interaction_type = 'submit_attempt') as attempted_submit,
                    any(interaction_type = 'step_complete' AND page_number = 
                        (SELECT max(page_number) FROM form_interactions WHERE form_id = {form_id})
                    ) as completed_form
                FROM form_interactions
                WHERE form_id = {form_id}
                    AND timestamp >= {start_date}
                    AND timestamp <= {end_date}
                GROUP BY session_id
            )
            SELECT
                count() as total_sessions,
                countIf(max_page_reached >= 1) as reached_page_1,
                countIf(max_page_reached >= 2) as reached_page_2,
                countIf(max_page_reached >= 3) as reached_page_3,
                countIf(max_page_reached >= 4) as reached_page_4,
                countIf(max_page_completed >= 1) as completed_page_1,
                countIf(max_page_completed >= 2) as completed_page_2,
                countIf(max_page_completed >= 3) as completed_page_3,
                countIf(max_page_completed >= 4) as completed_page_4,
                countIf(attempted_submit) as submit_attempts,
                countIf(completed_form) as completions
            FROM funnel_data
        """
        
        results = self._execute_query(query, {
            'form_id': form_id,
            'start_date': start_date,
            'end_date': end_date
        })
        
        if not results:
            return {}
        
        # Calculate funnel steps
        data = results[0]
        funnel_steps = []
        
        for i in range(1, 5):  # Support up to 4 pages
            if data.get(f'reached_page_{i}', 0) > 0:
                funnel_steps.append({
                    'step': i,
                    'name': f'Page {i}',
                    'reached': data.get(f'reached_page_{i}', 0),
                    'completed': data.get(f'completed_page_{i}', 0),
                    'drop_off_rate': 1 - (data.get(f'completed_page_{i}', 0) / 
                                         data.get(f'reached_page_{i}', 1))
                })
        
        return {
            'total_sessions': data.get('total_sessions', 0),
            'submit_attempts': data.get('submit_attempts', 0),
            'completions': data.get('completions', 0),
            'overall_conversion_rate': (data.get('completions', 0) / 
                                       data.get('total_sessions', 1)) * 100,
            'funnel_steps': funnel_steps
        }
    
    def get_time_series_data(
        self,
        form_id: str,
        metric: str,
        start_date: datetime,
        end_date: datetime,
        interval: str = 'day'
    ) -> List[Dict[str, Any]]:
        """Get time series data for a specific metric"""
        
        # Map interval to ClickHouse function
        interval_func = {
            'hour': 'toStartOfHour',
            'day': 'toDate',
            'week': 'toMonday',
            'month': 'toStartOfMonth'
        }.get(interval, 'toDate')
        
        # Build query based on metric
        if metric == 'views':
            query = f"""
                SELECT
                    {interval_func}(timestamp) as period,
                    count() as value
                FROM form_views
                WHERE form_id = {{form_id}}
                    AND timestamp >= {{start_date}}
                    AND timestamp <= {{end_date}}
                GROUP BY period
                ORDER BY period
            """
        elif metric == 'submissions':
            query = f"""
                SELECT
                    {interval_func}(timestamp) as period,
                    countIf(is_complete) as value
                FROM form_submissions
                WHERE form_id = {{form_id}}
                    AND timestamp >= {{start_date}}
                    AND timestamp <= {{end_date}}
                GROUP BY period
                ORDER BY period
            """
        elif metric == 'completion_rate':
            query = f"""
                SELECT
                    {interval_func}(timestamp) as period,
                    countIf(is_complete) / count() * 100 as value
                FROM form_submissions
                WHERE form_id = {{form_id}}
                    AND timestamp >= {{start_date}}
                    AND timestamp <= {{end_date}}
                GROUP BY period
                ORDER BY period
            """
        else:
            raise ValueError(f"Unsupported metric: {metric}")
        
        results = self._execute_query(query, {
            'form_id': form_id,
            'start_date': start_date,
            'end_date': end_date
        })
        
        return results
    
    def get_top_referrers(
        self,
        form_id: str,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top referrers for a form"""
        
        query = """
            SELECT
                referrer_domain,
                count() as visits,
                uniq(session_id) as unique_sessions,
                countIf(session_id IN (
                    SELECT session_id FROM form_submissions 
                    WHERE form_id = {form_id} AND is_complete = 1
                )) as conversions
            FROM form_views
            WHERE form_id = {form_id}
                AND timestamp >= {start_date}
                AND timestamp <= {end_date}
                AND referrer_domain != ''
            GROUP BY referrer_domain
            ORDER BY visits DESC
            LIMIT {limit}
        """
        
        results = self._execute_query(query, {
            'form_id': form_id,
            'start_date': start_date,
            'end_date': end_date,
            'limit': limit
        })
        
        # Calculate conversion rates
        for result in results:
            sessions = result.get('unique_sessions', 1)
            conversions = result.get('conversions', 0)
            result['conversion_rate'] = (conversions / sessions * 100) if sessions > 0 else 0
        
        return results
    
    def get_device_breakdown(
        self,
        form_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get device and browser breakdown"""
        
        query = """
            SELECT
                device_type,
                browser,
                os,
                count() as views,
                countIf(session_id IN (
                    SELECT session_id FROM form_submissions 
                    WHERE form_id = {form_id} AND is_complete = 1
                )) as conversions
            FROM form_views
            WHERE form_id = {form_id}
                AND timestamp >= {start_date}
                AND timestamp <= {end_date}
            GROUP BY device_type, browser, os
            ORDER BY views DESC
        """
        
        results = self._execute_query(query, {
            'form_id': form_id,
            'start_date': start_date,
            'end_date': end_date
        })
        
        # Aggregate by device type
        device_stats = {}
        browser_stats = {}
        os_stats = {}
        
        for row in results:
            device = row.get('device_type', 'unknown')
            browser = row.get('browser', 'unknown')
            os = row.get('os', 'unknown')
            views = row.get('views', 0)
            conversions = row.get('conversions', 0)
            
            # Device stats
            if device not in device_stats:
                device_stats[device] = {'views': 0, 'conversions': 0}
            device_stats[device]['views'] += views
            device_stats[device]['conversions'] += conversions
            
            # Browser stats
            if browser not in browser_stats:
                browser_stats[browser] = {'views': 0, 'conversions': 0}
            browser_stats[browser]['views'] += views
            browser_stats[browser]['conversions'] += conversions
            
            # OS stats
            if os not in os_stats:
                os_stats[os] = {'views': 0, 'conversions': 0}
            os_stats[os]['views'] += views
            os_stats[os]['conversions'] += conversions
        
        # Calculate conversion rates
        for stats_dict in [device_stats, browser_stats, os_stats]:
            for key, stats in stats_dict.items():
                views = stats['views']
                conversions = stats['conversions']
                stats['conversion_rate'] = (conversions / views * 100) if views > 0 else 0
        
        return {
            'devices': device_stats,
            'browsers': browser_stats,
            'operating_systems': os_stats
        }


class ClickHouseError(Exception):
    """Custom exception for ClickHouse errors"""
    pass