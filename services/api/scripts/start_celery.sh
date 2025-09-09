#!/bin/bash

# Start Celery worker
echo "Starting Celery worker..."
celery -A api worker -l info --concurrency=4 -Q default,webhooks,integrations &
WORKER_PID=$!

# Start Celery beat
echo "Starting Celery beat..."
celery -A api beat -l info &
BEAT_PID=$!

# Wait for interrupt
trap "kill $WORKER_PID $BEAT_PID; exit" INT

# Wait for processes
wait $WORKER_PID
wait $BEAT_PID