# Edge Ingest Service

High-performance edge service for ingesting form events and submissions with global distribution.

## Architecture

```
Users → Edge Workers (30+ locations) → Queues → Backend API
                ↓
          Rate Limiting (KV)
                ↓
          HMAC Validation
```

## Features

- **Global Edge Deployment**: Sub-50ms latency worldwide
- **Rate Limiting**: Per-IP rate limiting using KV storage
- **HMAC Validation**: Webhook security with timestamp verification
- **Queue-Based**: Reliable delivery with automatic retries
- **Batch Support**: Process up to 1000 events per request
- **CORS Support**: Configurable allowed origins
- **EU Compliance**: Data routing to EU regions

## Endpoints

### Analytics Events

#### Single Event
```http
POST /events/track
Content-Type: application/json

{
  "event_type": "view|interaction|submission",
  "form_id": "uuid",
  "session_id": "string",
  "timestamp": "2024-01-01T00:00:00Z",
  // Additional fields based on event_type
}
```

#### Batch Events
```http
POST /events/batch
Content-Type: application/json

{
  "events": [
    { /* event 1 */ },
    { /* event 2 */ },
    // ... up to 1000 events
  ]
}
```

### Form Submissions

#### Complete Submission
```http
POST /forms/{formId}/submit
Content-Type: application/json

{
  "session_id": "string",
  "data": {
    "field1": "value1",
    "field2": "value2"
  },
  "metadata": {
    "started_at": "2024-01-01T10:00:00Z",
    "completed_at": "2024-01-01T10:05:00Z"
  }
}
```

#### Partial Submission (Autosave)
```http
POST /forms/{formId}/partial
Content-Type: application/json

{
  "session_id": "string",
  "current_step": 2,
  "data": {
    "field1": "value1"
  }
}
```

### Webhooks

#### Stripe Webhooks
```http
POST /webhooks/stripe
X-Webhook-Signature: sha256=...
X-Webhook-Timestamp: 1234567890

{
  "id": "evt_...",
  "type": "payment_intent.succeeded",
  // Stripe event data
}
```

## Development

### Local Development
```bash
# Install dependencies
pnpm install

# Run locally with Wrangler
pnpm dev

# Run tests
pnpm test
```

### Environment Variables
```toml
# wrangler.toml
[vars]
ALLOWED_ORIGINS = "https://localhost:3000"
MAX_EVENTS_PER_BATCH = "1000"
MAX_REQUEST_SIZE = "1048576"

[env.production.vars]
HMAC_SECRET = "your-secret-here"
API_ENDPOINT = "https://api.forms.eu"
CLICKHOUSE_ENDPOINT = "https://analytics.forms.eu"
```

## Rate Limiting

Default limits:
- 100 requests per minute per IP
- Configurable via KV namespace
- Headers included: `X-RateLimit-*`

## Security

### CORS
- Configurable allowed origins
- Credentials supported for same-origin
- Preflight caching: 24 hours

### HMAC Validation
- SHA-256 signatures required for webhooks
- 5-minute timestamp tolerance
- Constant-time comparison

### Data Privacy
- IP anonymization available
- No PII logging
- EU data residency

## Queue Processing

### Event Queue
- Analytics events batched by type
- 100 events per batch to ClickHouse
- Automatic retries with exponential backoff

### Submission Queue
- Individual submission processing
- Idempotency via session keys
- Dead letter queue for failures

## Monitoring

### Metrics
- Request count by endpoint
- Queue depth and processing time
- Error rates by type
- Geographic distribution

### Health Check
```bash
curl https://ingest.forms.eu/health
```

### Logs
- Structured JSON logging
- Correlation IDs for tracing
- Error sampling for high volume

## Deployment

### Production Deployment
```bash
# Deploy to production
pnpm deploy

# Verify deployment
wrangler tail
```

### Rollback
```bash
# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback
```

## Error Handling

### Client Errors (4xx)
- `400`: Validation errors with details
- `429`: Rate limit exceeded
- `401`: Invalid HMAC signature

### Server Errors (5xx)
- Automatic retries for transient failures
- Dead letter queue for persistent failures
- Graceful degradation

## Performance

### Latency Targets
- P50: < 25ms
- P95: < 50ms
- P99: < 100ms

### Throughput
- 10,000+ events/second per worker
- Horizontal scaling via Cloudflare

### Optimization
- Minimal dependencies (300KB total)
- Streaming request/response bodies
- Early validation and rejection