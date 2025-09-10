# Analytics Integration Guide

This guide explains how the Forms Platform integrates with ClickHouse for real-time analytics.

## Architecture Overview

The analytics system consists of three main components:

1. **Runtime Analytics Tracker** - Embedded in forms to track user interactions
2. **Django Analytics API** - Proxy endpoints with authentication
3. **ClickHouse Analytics Service** - FastAPI service for real-time analytics

```
Form Runtime → Django API → ClickHouse Service → ClickHouse DB
     ↓                                               ↓
  Events Batch                                   Materialized Views
```

## Components

### 1. Runtime Analytics Tracker

The form runtime automatically tracks user interactions:

```typescript
// Automatic tracking in useFormRuntime hook
const analytics = new AnalyticsService({
  apiUrl: config.analyticsApiUrl || "/api/v1/analytics/events",
  enableTracking: config.enableAnalytics !== false,
  enableDebug: config.enableAnalyticsDebug,
});
```

#### Events Tracked

- **form_view** - Initial form load with performance metrics
- **form_start** - First user interaction
- **step_view** - Each step/page displayed
- **step_complete** - Step completion with time spent
- **field_change** - Field value updates
- **field_error** - Validation errors
- **form_submit** - Successful submission
- **form_abandon** - User leaves without completing
- **outcome_reached** - Logic-based outcomes

#### Configuration

```typescript
const runtime = useFormRuntime(form, {
  enableAnalytics: true, // Enable/disable tracking
  analyticsApiUrl: "/api/v1/analytics/events", // Custom endpoint
  enableAnalyticsDebug: false, // Debug logging
});
```

### 2. Django Analytics API

Proxy endpoints that add authentication and organization context:

#### Endpoints

- `POST /v1/analytics/events/` - Track single event
- `POST /v1/analytics/events/batch/` - Track multiple events
- `GET /v1/analytics/forms/{form_id}/` - Get form analytics
- `GET /v1/analytics/forms/{form_id}/funnel/` - Get funnel analysis
- `GET /v1/analytics/forms/{form_id}/realtime/` - Get real-time stats
- `GET /v1/analytics/forms/{form_id}/questions/` - Get question performance

#### Configuration

```python
# settings.py
ANALYTICS_SERVICE_URL = "http://localhost:8002"
```

### 3. ClickHouse Analytics Service

FastAPI service that handles event ingestion and analytics queries:

#### Features

- Real-time event ingestion
- Event batching for performance
- Redis caching for frequently accessed data
- Materialized views for fast aggregations
- Custom dashboard support

#### ClickHouse Schema

```sql
CREATE TABLE events (
    event_type String,
    form_id UUID,
    organization_id UUID,
    respondent_id String,
    session_id String,
    timestamp DateTime64(3),
    step_id Nullable(String),
    field_id Nullable(String),
    -- ... additional fields
) ENGINE = MergeTree()
ORDER BY (form_id, timestamp);
```

## Analytics Dashboard

The builder app includes a comprehensive analytics dashboard:

### Features

- **Overview Tab**
  - Key metrics (views, submissions, completion rate)
  - Device breakdown
  - Top drop-off points
- **Question Performance Tab**
  - Response rates per question
  - Average time per question
  - Required vs optional field performance

- **Funnel Analysis Tab**
  - Visual funnel chart
  - Step-by-step conversion rates
  - Drop-off identification

### Usage

```tsx
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default function FormAnalyticsPage({ params }: { params: { id: string } }) {
  return <AnalyticsDashboard formId={params.id} />;
}
```

## Data Flow

1. **Event Generation**

   ```
   User Action → Analytics Service → Event Queue
   ```

2. **Event Batching**

   ```
   Event Queue → Batch (10 events or 5s) → API Call
   ```

3. **Processing**

   ```
   Django API → Validate Auth → Add Context → Forward to ClickHouse
   ```

4. **Storage**

   ```
   ClickHouse Service → Insert Events → Update Materialized Views
   ```

5. **Querying**
   ```
   Dashboard → Django API → ClickHouse Service → Redis Cache
   ```

## Performance Considerations

### Client-Side

- Events are batched (10 events or 5 seconds)
- Minimal impact on bundle size (<2KB gzipped)
- Non-blocking async tracking
- Graceful degradation on errors

### Server-Side

- ClickHouse handles millions of events/second
- Redis caching for frequent queries
- Materialized views for aggregations
- Async event processing

## Privacy & GDPR

- No PII in analytics events
- Anonymous respondent IDs
- Session-based tracking only
- Respects DNT headers
- EU data residency

## Development Setup

### 1. Start ClickHouse

```bash
docker-compose up clickhouse
```

### 2. Start Analytics Service

```bash
cd services/analytics
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 3. Configure Django

```bash
# .env
ANALYTICS_SERVICE_URL=http://localhost:8002
```

### 4. Enable in Runtime

```typescript
const runtime = useFormRuntime(form, {
  enableAnalytics: true,
  enableAnalyticsDebug: true, // See events in console
});
```

## Production Deployment

### ClickHouse

- Cluster with replication
- Separate ingestion and query nodes
- Backup strategy for analytics data
- Retention policies (e.g., 2 years)

### Analytics Service

- Deploy with multiple workers
- Load balancer for high availability
- Monitoring and alerts
- Rate limiting per organization

### Security

- HMAC signatures for webhook events
- API key authentication
- Organization-level data isolation
- IP allowlisting for ClickHouse

## Monitoring

### Metrics to Track

- Event ingestion rate
- Query response times
- Cache hit rates
- Error rates
- Storage usage

### Alerts

- Ingestion failures
- High query latency (>1s)
- Low cache hit rate (<80%)
- Storage threshold (>80%)

## Troubleshooting

### No Analytics Data

1. Check analytics enabled in runtime
2. Verify API endpoints accessible
3. Check browser console for errors
4. Verify ClickHouse service running

### Missing Events

1. Check event batching (may be delayed up to 5s)
2. Verify network requests in browser
3. Check Django logs for auth errors
4. Check ClickHouse logs for insert errors

### Slow Queries

1. Check materialized views are updated
2. Verify Redis cache is working
3. Check ClickHouse query performance
4. Consider adding indexes

## API Examples

### Track Custom Event

```typescript
// In form runtime
analytics.track({
  event_type: "custom_action",
  form_id: formId,
  respondent_id: respondentId,
  custom_data: { action: "clicked_help" },
});
```

### Query Analytics

```typescript
// Get form analytics
const response = await api.get(`/analytics/forms/${formId}/`, {
  params: {
    start_date: "2024-01-01",
    end_date: "2024-12-31",
  },
});
```

### Export Data

```typescript
// Export analytics as CSV
const data = await fetchAnalytics(formId);
exportToCSV(data);
```
