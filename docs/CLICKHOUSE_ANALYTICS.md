# ClickHouse Analytics Configuration

## Overview

The form platform uses ClickHouse for real-time analytics and event tracking. This provides high-performance time-series analytics with minimal latency.

## Architecture

```
Form Runtime → Edge Ingest → Queue → Django API → ClickHouse
                                          ↓
                                    Analytics API → Frontend Dashboard
```

## Setup

### 1. Start ClickHouse

```bash
cd docker/clickhouse
docker-compose up -d
```

### 2. Initialize Database

```bash
cd services/api
python manage.py setup_clickhouse
```

### 3. Configure Environment

Add to `.env`:

```env
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=forms_analytics
CLICKHOUSE_USER=forms_user
CLICKHOUSE_PASSWORD=your_secure_password
```

## Data Model

### Core Tables

#### form_views
- Tracks every form view/load
- Includes device, browser, location, referrer data
- Page load performance metrics

#### form_interactions
- Field-level interactions (focus, blur, change)
- Step/page navigation events
- Validation errors
- Time spent on each field

#### form_submissions
- Complete and partial submissions
- Completion rate and timing metrics
- Drop-off analysis data

### Aggregated Tables

#### form_performance_hourly
- Pre-aggregated hourly metrics
- Views, submissions, completion rates
- Device breakdowns
- Top countries and referrers

#### field_analytics
- Daily field-level performance
- Completion rates, error rates
- Time to complete distributions

## API Endpoints

### Event Tracking

```http
POST /api/v1/analytics/events/track/
{
  "event_type": "view|interaction|submission",
  "form_id": "uuid",
  "session_id": "string",
  "timestamp": "2024-01-01T00:00:00Z",
  // Additional fields based on event_type
}
```

### Batch Events

```http
POST /api/v1/analytics/events/batch/
{
  "events": [
    { /* event 1 */ },
    { /* event 2 */ },
    // ...
  ]
}
```

### Analytics Queries

#### Form Analytics
```http
GET /api/v1/analytics/forms/{form_id}/analytics/
  ?start_date=2024-01-01
  &end_date=2024-01-31
  &metrics=views,submissions,completion_rate
```

#### Field Analytics
```http
GET /api/v1/analytics/forms/{form_id}/analytics/fields/
  ?start_date=2024-01-01
  &end_date=2024-01-31
```

#### Time Series
```http
GET /api/v1/analytics/forms/{form_id}/analytics/time-series/
  ?metric=submissions
  &interval=day
  &start_date=2024-01-01
  &end_date=2024-01-31
```

#### Funnel Analysis
```http
GET /api/v1/analytics/forms/{form_id}/analytics/funnel/
  ?start_date=2024-01-01
  &end_date=2024-01-31
```

## Frontend Integration

### Event Tracking Hook

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function FormComponent() {
  const { trackEvent } = useAnalytics();
  
  // Track form view
  useEffect(() => {
    trackEvent('view', {
      form_id: formId,
      page_load_time_ms: performance.now()
    });
  }, []);
  
  // Track field interactions
  const handleFieldChange = (fieldId: string, value: any) => {
    trackEvent('interaction', {
      form_id: formId,
      interaction_type: 'field_change',
      field_id: fieldId,
      time_on_field_ms: getFieldTime(fieldId)
    });
  };
}
```

### Analytics Dashboard

```typescript
import { useFormAnalytics } from '@/hooks/useFormAnalytics';

function AnalyticsDashboard({ formId }) {
  const { data, loading } = useFormAnalytics(formId, {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    metrics: ['views', 'submissions', 'completion_rate']
  });
  
  return (
    <div>
      <MetricCard title="Views" value={data?.views.total_views} />
      <MetricCard title="Submissions" value={data?.submissions.total_submissions} />
      <MetricCard title="Completion Rate" value={`${data?.completion_rate}%`} />
    </div>
  );
}
```

## Performance Considerations

### Data Retention

- Raw events: 1-2 years (configurable via TTL)
- Aggregated data: 2+ years
- Real-time queries: Last 90 days optimized

### Query Optimization

1. **Use time ranges**: Always include date filters
2. **Leverage aggregates**: Use pre-computed tables when possible
3. **Batch events**: Send multiple events in one request
4. **Cache results**: 5-minute cache for dashboard queries

### Scaling

- Partition by month for time-series data
- Automatic data compression (LZ4)
- Distributed setup ready (replicas/shards)

## Security

### Data Privacy

- IP addresses anonymized (last octet removed)
- No PII in analytics events
- Session IDs rotated daily
- GDPR compliant data deletion

### Access Control

- Read access requires form ownership
- Write access via API tokens only
- Rate limiting on event ingestion

## Monitoring

### Health Checks

```bash
# Check ClickHouse status
curl http://localhost:8123/ping

# Check table sizes
curl http://localhost:8123 --data "SELECT table, sum(bytes) FROM system.parts GROUP BY table"
```

### Metrics to Monitor

- Insert rate (events/second)
- Query latency (P50, P95, P99)
- Disk usage growth
- Memory consumption

## Troubleshooting

### Common Issues

1. **High query latency**
   - Check date range filters
   - Review query complexity
   - Consider using aggregated tables

2. **Missing data**
   - Verify event tracking implementation
   - Check network/CORS issues
   - Review server logs

3. **Storage growth**
   - Verify TTL policies are applied
   - Check for duplicate events
   - Review retention settings

### Debug Mode

Enable debug logging:

```python
# settings.py
LOGGING = {
    'loggers': {
        'analytics.clickhouse_client': {
            'level': 'DEBUG',
        }
    }
}
```

## Migration from Existing Analytics

If migrating from another analytics system:

1. Export historical data as CSV
2. Transform to ClickHouse schema
3. Bulk import using clickhouse-client
4. Verify data integrity
5. Switch tracking to new endpoints

## Future Enhancements

- Real-time dashboards with WebSocket updates
- Machine learning for anomaly detection
- Advanced funnel analysis with cohorts
- A/B testing metrics integration
- Custom event types for business metrics