# Production Runbook

## 🚨 Incident Response

### Severity Levels

| Level | Description       | Response Time | Examples                         |
| ----- | ----------------- | ------------- | -------------------------------- |
| SEV1  | Complete outage   | < 15 mins     | API down, data loss              |
| SEV2  | Major degradation | < 1 hour      | Submissions failing, auth broken |
| SEV3  | Minor issues      | < 4 hours     | Slow queries, UI glitches        |

### On-Call Rotation

- Primary: Rotate weekly
- Secondary: Always available
- Escalation: Engineering lead → CTO

### Incident Commander Checklist

1. **Assess Impact**
   - Check status page
   - Review error rates in monitoring
   - Check customer reports

2. **Communicate**
   - Update status page
   - Notify stakeholders via Slack
   - Start incident channel

3. **Mitigate**
   - Apply temporary fix if available
   - Consider rollback
   - Scale resources if needed

4. **Resolve**
   - Deploy permanent fix
   - Verify resolution
   - Update status page

5. **Post-Mortem**
   - Schedule within 48 hours
   - Document timeline
   - Identify action items

## 🔄 Common Operations

### Deployment

#### API Deployment

```bash
# 1. Run migrations (if needed)
kubectl exec -it deployment/api -- python manage.py migrate

# 2. Deploy new version
kubectl set image deployment/api api=forms/api:$VERSION

# 3. Monitor rollout
kubectl rollout status deployment/api

# 4. Rollback if needed
kubectl rollout undo deployment/api
```

#### Frontend Deployment

```bash
# 1. Build and push to CDN
pnpm build:prod
aws s3 sync apps/builder/out s3://forms-builder-prod/
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# 2. Update edge functions
wrangler publish --env production
```

### Database Operations

#### Emergency Queries

```sql
-- Find stuck webhooks
SELECT * FROM webhook_deliveries
WHERE status = 'pending'
AND next_retry_at < NOW() - INTERVAL '1 hour';

-- Check submission rate
SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*)
FROM submissions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Find large forms causing issues
SELECT f.id, f.title, COUNT(s.id) as submission_count
FROM forms f
JOIN submissions s ON s.form_id = f.id
WHERE f.created_at > NOW() - INTERVAL '7 days'
GROUP BY f.id, f.title
HAVING COUNT(s.id) > 10000;
```

#### Backup & Restore

```bash
# Manual backup
pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $POSTGRES_URL < backup_20240315_143022.sql

# Point-in-time recovery
pgbackrest --stanza=prod --type=time --target="2024-03-15 14:00:00" restore
```

### Scaling Operations

#### Horizontal Scaling

```bash
# Scale API pods
kubectl scale deployment/api --replicas=10

# Scale workers
kubectl scale deployment/celery-worker --replicas=5

# Auto-scaling (already configured)
kubectl get hpa
```

#### Vertical Scaling

```yaml
# Update resources in k8s
kubectl edit deployment/api
# Change resources.limits.memory and cpu
```

### Cache Operations

#### Redis Operations

```bash
# Connect to Redis
redis-cli -h $REDIS_HOST

# Clear specific cache pattern
redis-cli --scan --pattern "form:*" | xargs redis-cli DEL

# Monitor cache hit rate
redis-cli INFO stats | grep keyspace_hits

# Emergency flush (CAREFUL!)
redis-cli FLUSHDB
```

## 🔍 Troubleshooting

### High Error Rate

1. **Check Logs**

   ```bash
   kubectl logs -f deployment/api --tail=100
   kubectl logs -f deployment/celery-worker --tail=100
   ```

2. **Check Metrics**
   - CPU/Memory usage
   - Database connections
   - Queue depth

3. **Common Causes**
   - Database connection exhaustion
   - Memory leaks
   - Third-party API failures

### Slow Performance

1. **Identify Bottleneck**

   ```bash
   # Check slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;

   # Check queue depth
   celery -A api inspect active_queues
   ```

2. **Quick Fixes**
   - Scale horizontally
   - Increase cache TTL
   - Enable read replicas

### Webhook Failures

1. **Check Delivery Status**

   ```sql
   SELECT webhook_id, COUNT(*), AVG(attempt)
   FROM webhook_deliveries
   WHERE status = 'failed'
   AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY webhook_id;
   ```

2. **Retry Failed Webhooks**

   ```bash
   python manage.py retry_webhooks --hours=24
   ```

3. **Common Issues**
   - Customer endpoint down
   - SSL certificate issues
   - Timeout (increase to 30s)

### Authentication Issues

1. **Check JWT Settings**

   ```bash
   echo $JWT_SECRET | wc -c  # Should be > 32
   ```

2. **Token Validation**

   ```python
   # Debug token issues
   python manage.py shell
   from rest_framework_simplejwt.tokens import AccessToken
   token = AccessToken('eyJ...')
   print(token.payload)
   ```

3. **Emergency Access**
   ```bash
   # Create superuser
   python manage.py createsuperuser
   ```

## 📊 Monitoring

### Key Metrics

| Metric            | Target  | Alert Threshold |
| ----------------- | ------- | --------------- |
| API Latency (p95) | < 200ms | > 500ms         |
| Error Rate        | < 0.1%  | > 1%            |
| Queue Depth       | < 1000  | > 5000          |
| DB Connections    | < 80%   | > 90%           |
| Disk Usage        | < 80%   | > 90%           |

### Dashboard Links

- [System Overview](https://grafana.forms.io/d/system-overview)
- [API Performance](https://grafana.forms.io/d/api-performance)
- [Database Metrics](https://grafana.forms.io/d/postgres-metrics)
- [Queue Dashboard](https://grafana.forms.io/d/celery-metrics)

### Alert Runbooks

#### High Memory Usage

1. Check for memory leaks: `kubectl top pods`
2. Review recent deployments
3. Restart pods if needed: `kubectl rollout restart deployment/api`

#### Database Connection Exhaustion

1. Check active connections: `SELECT count(*) FROM pg_stat_activity;`
2. Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';`
3. Increase connection pool size

#### Queue Backup

1. Check worker status: `celery -A api inspect stats`
2. Check for stuck tasks: `celery -A api inspect active`
3. Scale workers: `kubectl scale deployment/celery-worker --replicas=10`
4. Purge if necessary: `celery -A api purge -f`

## 🔐 Security

### Emergency Procedures

#### Suspected Breach

1. **Immediately**:
   - Rotate all secrets
   - Review audit logs
   - Enable emergency mode (read-only)

2. **Within 1 hour**:
   - Identify affected accounts
   - Notify security team
   - Begin forensics

3. **Follow-up**:
   - Patch vulnerability
   - Notify affected users
   - Update security measures

#### Key Rotation

```bash
# Rotate JWT secret
kubectl create secret generic jwt-secret --from-literal=secret=$NEW_SECRET --dry-run=client -o yaml | kubectl apply -f -

# Rotate database password
ALTER USER forms WITH PASSWORD 'new_password';

# Rotate webhook secrets
python manage.py rotate_webhook_secrets
```

### Compliance

#### GDPR Data Requests

```bash
# Export user data
python manage.py export_user_data --email=user@example.com

# Delete user data
python manage.py delete_user_data --email=user@example.com --confirm

# Anonymize old data
python manage.py anonymize_old_submissions --days=365
```

## 📞 Contacts

### Escalation Path

1. **On-Call Engineer**: Check PagerDuty
2. **Team Lead**: +33 6 XX XX XX XX
3. **CTO**: +33 6 XX XX XX XX
4. **Infrastructure Provider**: support@cloud-provider.com

### Key Services

| Service    | Contact                | Account # |
| ---------- | ---------------------- | --------- |
| AWS        | support.aws.com        | 123456    |
| Cloudflare | support.cloudflare.com | CF-789    |
| PagerDuty  | support.pagerduty.com  | PD-456    |
| Sentry     | support.sentry.io      | SEN-123   |

## 🔄 Maintenance Windows

- **Regular**: Sundays 02:00-04:00 UTC
- **Emergency**: As needed with 30min notice
- **Major Upgrades**: Scheduled 2 weeks in advance

### Pre-Maintenance Checklist

- [ ] Notify customers (email + status page)
- [ ] Backup database
- [ ] Prepare rollback plan
- [ ] Test in staging
- [ ] Update runbook if needed

### During Maintenance

- [ ] Enable maintenance mode
- [ ] Monitor error rates
- [ ] Keep status page updated
- [ ] Test critical paths

### Post-Maintenance

- [ ] Verify all services operational
- [ ] Run smoke tests
- [ ] Update status page
- [ ] Send all-clear notification
