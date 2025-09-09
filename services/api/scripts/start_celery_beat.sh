#!/bin/bash

# Start Celery beat scheduler
echo "Starting Celery beat scheduler..."
celery -A api beat \
    --loglevel=${CELERY_LOG_LEVEL:-info} \
    --scheduler=django_celery_beat.schedulers:DatabaseScheduler