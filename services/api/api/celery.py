import os
from celery import Celery, Task
from celery.signals import task_failure, task_retry, task_success
from django.conf import settings
import logging

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

app = Celery("api")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

logger = logging.getLogger(__name__)


class CallbackTask(Task):
    """Task that sends callbacks on completion"""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Success callback"""
        logger.info(f"Task {task_id} succeeded with result: {retval}")
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Failure callback"""
        logger.error(f"Task {task_id} failed with exception: {exc}")
        
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Retry callback"""
        logger.warning(f"Task {task_id} is being retried due to: {exc}")


# Celery beat schedule for periodic tasks
app.conf.beat_schedule = {
    'process-pending-webhooks': {
        'task': 'webhooks.tasks.process_pending_webhooks',
        'schedule': 60.0,  # Every minute
    },
    'cleanup-old-deliveries': {
        'task': 'webhooks.tasks.cleanup_old_deliveries',
        'schedule': 3600.0,  # Every hour
    },
    'retry-failed-webhooks': {
        'task': 'webhooks.tasks.retry_failed_webhooks',
        'schedule': 300.0,  # Every 5 minutes
    },
}

# Task routing
app.conf.task_routes = {
    'webhooks.tasks.*': {'queue': 'webhooks'},
    'core.tasks.*': {'queue': 'default'},
    'integrations.tasks.*': {'queue': 'integrations'},
}

# DLQ configuration
app.conf.task_acks_late = True
app.conf.task_reject_on_worker_lost = True
app.conf.task_acks_on_failure_or_timeout = False

# Performance optimizations
app.conf.worker_prefetch_multiplier = 4
app.conf.worker_max_tasks_per_child = 1000


@task_failure.connect
def handle_task_failure(sender=None, task_id=None, exception=None, args=None, kwargs=None, **kw):
    """Handle task failures and send to DLQ if needed"""
    from webhooks.models import Delivery
    
    # Check if this is a webhook delivery task
    if sender.name == 'webhooks.tasks.deliver_webhook' and args:
        delivery_id = args[0]
        try:
            delivery = Delivery.objects.get(id=delivery_id)
            if delivery.attempt >= 7:  # Max retries reached
                # Move to DLQ
                from webhooks.tasks import send_to_dlq
                send_to_dlq.delay(delivery_id, str(exception))
        except Delivery.DoesNotExist:
            pass


@task_retry.connect
def handle_task_retry(sender=None, task_id=None, reason=None, **kw):
    """Log task retries"""
    logger.warning(f"Task {task_id} ({sender.name}) is being retried. Reason: {reason}")