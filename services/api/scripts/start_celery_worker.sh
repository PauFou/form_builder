#!/bin/bash

# Start Celery worker only (for multi-instance deployments)
echo "Starting Celery worker..."
celery -A api worker \
    --loglevel=${CELERY_LOG_LEVEL:-info} \
    --concurrency=${CELERY_CONCURRENCY:-4} \
    --queues=${CELERY_QUEUES:-default,webhooks,integrations} \
    --max-tasks-per-child=${CELERY_MAX_TASKS_PER_CHILD:-1000} \
    --time-limit=${CELERY_TIME_LIMIT:-600} \
    --soft-time-limit=${CELERY_SOFT_TIME_LIMIT:-300}