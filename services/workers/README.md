# Queue Workers Service

Background workers for processing form events, submissions, and webhooks with reliable delivery.

## Architecture

```
Redis Queue (BullMQ)
    ├── Event Worker → ClickHouse Analytics
    ├── Submission Worker → Django API → Webhooks
    ├── Webhook Worker → External URLs (with retries)
    └── Partial Worker → Django API → Analytics/Webhooks
```

## Workers

### Event Worker

Processes analytics events and inserts them into ClickHouse.

- **Queue**: `events`
- **Concurrency**: 10 (configurable)
- **Purpose**: Batch insert analytics data
- **Features**:
  - Groups events by type for efficient insertion
  - Handles both single events and batches
  - Automatic retry on ClickHouse errors

### Submission Worker

Processes form submissions and triggers webhooks.

- **Queue**: `submissions`
- **Concurrency**: 10 (configurable)
- **Purpose**: Save submissions and trigger integrations
- **Features**:
  - Saves to Django API
  - Triggers webhooks for completed submissions
  - Handles payment status updates from Stripe

### Webhook Worker

Delivers webhooks with exponential backoff retry.

- **Queue**: `webhooks`
- **Concurrency**: 10 (configurable)
- **Purpose**: Reliable webhook delivery
- **Features**:
  - HMAC signature generation
  - Configurable retry delays
  - Dead letter queue for failed deliveries
  - Detailed delivery logging

### Partial Worker

Processes partial submissions (autosave).

- **Queue**: `partials`
- **Concurrency**: 10 (configurable)
- **Purpose**: Save form progress
- **Features**:
  - Idempotent processing
  - Analytics tracking
  - Optional webhook triggers

## Configuration

### Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379

# API
API_URL=http://localhost:8000
API_TOKEN=your-api-token

# ClickHouse
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DATABASE=forms_analytics
CLICKHOUSE_USER=forms_user
CLICKHOUSE_PASSWORD=your-password

# Worker settings
WORKER_CONCURRENCY=10
LOG_LEVEL=info

# Webhook settings
WEBHOOK_MAX_RETRIES=7
```

### Retry Configuration

Default retry delays for webhooks:

- Immediate (0s)
- 30 seconds
- 2 minutes
- 10 minutes
- 1 hour
- 6 hours
- 24 hours

## Development

### Local Development

```bash
# Install dependencies
pnpm install

# Run workers in development mode
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

### Docker Development

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## Queue Management

### Monitor Queues

```typescript
import { Queue, QueueEvents } from "bullmq";

const queue = new Queue("events");
const counts = await queue.getJobCounts();
console.log(counts);
// { active: 5, completed: 1000, failed: 2, ... }
```

### Retry Failed Jobs

```typescript
const failedJobs = await queue.getJobs(["failed"]);
for (const job of failedJobs) {
  await job.retry();
}
```

### Clear Queue

```typescript
await queue.obliterate({ force: true });
```

## Monitoring

### Health Check

The workers expose health metrics through the API:

```bash
curl http://localhost:8000/api/v1/workers/health
```

### Metrics

- **Queue depth**: Number of pending jobs
- **Processing rate**: Jobs/second by worker type
- **Error rate**: Failed jobs percentage
- **Latency**: Job processing time distribution

### Logging

Structured JSON logging with Pino:

```json
{
  "level": "info",
  "time": "2024-01-01T10:00:00Z",
  "worker": "webhooks",
  "jobId": "123",
  "duration": 1234,
  "msg": "Job completed"
}
```

## Error Handling

### Retry Strategy

1. **Transient failures**: Automatic retry with backoff
2. **Permanent failures**: Move to dead letter queue
3. **Rate limiting**: Honor Retry-After headers

### Dead Letter Queue

Failed webhooks after all retries:

```typescript
const dlq = new Queue("webhooks-dlq");
const failedJobs = await dlq.getJobs();
```

### Alerting

Configure alerts for:

- Queue depth > threshold
- Error rate > 5%
- Worker crashes
- ClickHouse connection failures

## Performance

### Optimization Tips

1. **Batch processing**: Group similar operations
2. **Connection pooling**: Reuse HTTP connections
3. **Concurrency tuning**: Adjust based on workload
4. **Memory limits**: Monitor worker memory usage

### Scaling

Horizontal scaling strategies:

```yaml
# docker-compose.yml
services:
  worker:
    image: forms-workers
    deploy:
      replicas: 3
    environment:
      WORKER_CONCURRENCY: 5
```

## Security

### API Authentication

- Bearer token authentication
- Rotate tokens regularly
- Use environment variables

### Webhook Security

- HMAC-SHA256 signatures
- Timestamp validation (5-minute window)
- TLS 1.2+ required

### Data Privacy

- No PII in logs
- Truncate response bodies
- Encrypt sensitive data in transit

## Troubleshooting

### Common Issues

1. **Jobs stuck in active state**
   - Check worker logs for crashes
   - Verify Redis connection
   - Review stalled job settings

2. **High memory usage**
   - Reduce concurrency
   - Enable job result pruning
   - Check for memory leaks

3. **Webhook timeouts**
   - Increase timeout setting
   - Check endpoint performance
   - Review network connectivity

### Debug Mode

Enable verbose logging:

```bash
LOG_LEVEL=debug pnpm dev
```

### Manual Job Inspection

```typescript
const job = await queue.getJob("123");
console.log({
  id: job.id,
  data: job.data,
  attempts: job.attemptsMade,
  error: job.failedReason,
});
```

## Best Practices

1. **Idempotency**: Design jobs to be safely retried
2. **Monitoring**: Set up comprehensive monitoring
3. **Graceful shutdown**: Handle SIGTERM properly
4. **Error handling**: Log errors with context
5. **Testing**: Test retry scenarios
6. **Documentation**: Document job data schemas
