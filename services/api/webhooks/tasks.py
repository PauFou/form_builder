from celery import shared_task, group, chord
from celery.utils.log import get_task_logger
from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, F
from django.core.cache import cache
from datetime import timedelta
import requests
import hmac
import hashlib
import json
import time
from urllib.parse import urlparse
from .models import Webhook, Delivery, DeadLetterQueue, WebhookLog
from core.models import Submission, Partial
from api.celery import CallbackTask

logger = get_task_logger(__name__)

RETRY_DELAYS = [0, 30, 120, 600, 3600, 21600, 86400]  # seconds
MAX_PAYLOAD_SIZE = 1024 * 1024  # 1MB
WEBHOOK_TIMEOUT = 30
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100


@shared_task(bind=True, base=CallbackTask, max_retries=7, soft_time_limit=45, time_limit=60)
def deliver_webhook(self, delivery_id):
    """Main task to deliver a webhook with retries and circuit breaker"""
    start_time = time.time()
    
    try:
        with transaction.atomic():
            # Use only() to get just the fields we need with select_for_update
            delivery = Delivery.objects.select_for_update().only('id', 'status', 'webhook_id').get(id=delivery_id)
            
            # Check if already processed
            if delivery.status in ['success', 'dlq']:
                logger.info(f"Delivery {delivery_id} already processed with status {delivery.status}")
                return
            
            # Update status to processing
            delivery.status = 'processing'
            delivery.save()
        
        # Now fetch the full delivery with related objects outside the transaction
        delivery = Delivery.objects.select_related(
            'webhook', 'submission', 'partial'
        ).get(id=delivery_id)
        
        # Check webhook is active
        if not delivery.webhook.active:
            raise Exception("Webhook is inactive")
        
        # Check rate limit
        if not check_rate_limit(delivery.webhook):
            # Reschedule for later
            raise self.retry(countdown=60, exc=Exception("Rate limit exceeded"))
        
        # Prepare payload
        payload = prepare_webhook_payload(delivery)
        payload_json = json.dumps(payload)
        
        # Check payload size
        payload_size = len(payload_json.encode('utf-8'))
        if payload_size > MAX_PAYLOAD_SIZE:
            raise Exception(f"Payload too large: {payload_size} bytes")
        
        delivery.payload_size = payload_size
        
        # Calculate signature
        signature = calculate_hmac_signature(
            delivery.webhook.secret,
            payload_json
        )
        
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'FormsPlatform-Webhook/1.0',
            'X-Forms-Signature': f'sha256={signature}',
            'X-Forms-Timestamp': str(int(timezone.now().timestamp())),
            'X-Forms-Delivery-Id': str(delivery.id),
            'X-Forms-Attempt': str(delivery.attempt),
            **delivery.webhook.headers_json
        }
        
        # Log the attempt
        webhook_log = WebhookLog.objects.create(
            delivery=delivery,
            attempt=delivery.attempt,
            request_headers=headers,
            request_body=payload_json[:10000]  # Limit stored body size
        )
        
        # Make the request
        response = None
        error_message = None
        
        try:
            response = requests.post(
                delivery.webhook.url,
                data=payload_json,
                headers=headers,
                timeout=WEBHOOK_TIMEOUT,
                verify=True,
                allow_redirects=False
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Update log with response
            webhook_log.response_status = response.status_code
            webhook_log.response_headers = dict(response.headers)
            webhook_log.response_body = response.text[:10000]
            webhook_log.duration_ms = duration_ms
            webhook_log.save()
            
            delivery.response_code = response.status_code
            delivery.response_time_ms = duration_ms
            
            if response.ok:
                # Success!
                handle_webhook_success(delivery)
                return {'status': 'success', 'status_code': response.status_code}
            else:
                error_message = f"HTTP {response.status_code}: {response.text[:500]}"
                
        except requests.exceptions.Timeout:
            error_message = f"Request timed out after {WEBHOOK_TIMEOUT} seconds"
        except requests.exceptions.ConnectionError as e:
            error_message = f"Connection error: {str(e)}"
        except requests.exceptions.RequestException as e:
            error_message = f"Request error: {str(e)}"
        
        # Handle failure
        if error_message:
            webhook_log.error_message = error_message
            webhook_log.duration_ms = int((time.time() - start_time) * 1000)
            webhook_log.save()
            
            handle_webhook_failure(self, delivery, error_message)
            
    except SoftTimeLimitExceeded:
        logger.error(f"Task timeout for delivery {delivery_id}")
        if 'delivery' in locals():
            handle_webhook_failure(self, delivery, "Task timeout exceeded")
    except Exception as e:
        logger.exception(f"Unexpected error delivering webhook {delivery_id}: {e}")
        if 'delivery' in locals():
            handle_webhook_failure(self, delivery, str(e))
        raise


def handle_webhook_success(delivery):
    """Handle successful webhook delivery"""
    with transaction.atomic():
        delivery.status = 'success'
        delivery.delivered_at = timezone.now()
        delivery.save()
        
        # Update webhook stats
        Webhook.objects.filter(id=delivery.webhook_id).update(
            total_deliveries=F('total_deliveries') + 1,
            successful_deliveries=F('successful_deliveries') + 1
        )
    
    logger.info(f"Webhook delivered successfully: {delivery.id}")


def handle_webhook_failure(task, delivery, error_message):
    """Handle failed webhook delivery with retry logic"""
    delivery.error = error_message
    delivery.attempt = task.request.retries + 1
    
    # Check if we should retry
    if delivery.webhook.retry_enabled and delivery.attempt < delivery.webhook.max_retries:
        # Calculate next retry time
        retry_delay = RETRY_DELAYS[min(delivery.attempt, len(RETRY_DELAYS) - 1)]
        delivery.next_retry_at = timezone.now() + timedelta(seconds=retry_delay)
        delivery.status = 'pending'
        delivery.save()
        
        logger.warning(
            f"Webhook delivery {delivery.id} failed (attempt {delivery.attempt}), "
            f"retrying in {retry_delay}s: {error_message}"
        )
        
        # Schedule retry
        raise task.retry(countdown=retry_delay, exc=Exception(error_message))
    else:
        # Max retries reached or retries disabled
        delivery.status = 'failed'
        delivery.save()
        
        # Update webhook stats
        Webhook.objects.filter(id=delivery.webhook_id).update(
            total_deliveries=F('total_deliveries') + 1,
            failed_deliveries=F('failed_deliveries') + 1
        )
        
        # Send to DLQ
        send_to_dlq.delay(delivery.id, error_message)
        
        logger.error(f"Webhook delivery {delivery.id} failed after {delivery.attempt} attempts")


@shared_task
def send_to_dlq(delivery_id, reason):
    """Send failed delivery to Dead Letter Queue"""
    try:
        delivery = Delivery.objects.select_related('webhook', 'submission', 'partial').get(id=delivery_id)
        
        # Prepare the payload that would have been sent
        payload = prepare_webhook_payload(delivery)
        
        # Create DLQ entry
        DeadLetterQueue.objects.create(
            delivery=delivery,
            reason=reason,
            payload_json=payload
        )
        
        # Update delivery status
        delivery.status = 'dlq'
        delivery.save()
        
        logger.info(f"Delivery {delivery_id} moved to DLQ: {reason}")
        
    except Delivery.DoesNotExist:
        logger.error(f"Delivery {delivery_id} not found for DLQ")


@shared_task
def process_submission_webhooks(submission_id):
    """Process all webhooks for a new submission"""
    submission = Submission.objects.select_related('form__organization').get(id=submission_id)
    
    # Get active webhooks for the organization
    webhooks = Webhook.objects.filter(
        organization=submission.form.organization,
        active=True
    )
    
    # Create delivery tasks
    delivery_tasks = []
    
    for webhook in webhooks:
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=submission,
            partial=None
        )
        delivery_tasks.append(deliver_webhook.s(delivery.id))
    
    # Execute all deliveries in parallel
    if delivery_tasks:
        group(delivery_tasks).apply_async()
    
    logger.info(f"Created {len(delivery_tasks)} webhook deliveries for submission {submission_id}")


@shared_task
def process_partial_webhooks(partial_id):
    """Process webhooks for partial submission"""
    partial = Partial.objects.select_related('form__organization').get(id=partial_id)
    
    # Get webhooks that include partials
    webhooks = Webhook.objects.filter(
        organization=partial.form.organization,
        active=True,
        include_partials=True
    )
    
    delivery_tasks = []
    
    for webhook in webhooks:
        delivery = Delivery.objects.create(
            webhook=webhook,
            submission=None,
            partial=partial
        )
        delivery_tasks.append(deliver_webhook.s(delivery.id))
    
    if delivery_tasks:
        group(delivery_tasks).apply_async()
    
    logger.info(f"Created {len(delivery_tasks)} webhook deliveries for partial {partial_id}")


@shared_task
def test_webhook_delivery(webhook_id):
    """Send a test delivery for a webhook"""
    webhook = Webhook.objects.get(id=webhook_id)
    
    delivery = Delivery.objects.create(
        webhook=webhook,
        submission=None,
        partial=None
    )
    
    deliver_webhook.delay(delivery.id)
    
    return str(delivery.id)


@shared_task
def retry_webhook_delivery(delivery_id):
    """Manually retry a failed delivery"""
    delivery = Delivery.objects.get(id=delivery_id)
    
    if delivery.status not in ['failed', 'dlq']:
        logger.warning(f"Cannot retry delivery {delivery_id} with status {delivery.status}")
        return
    
    # Reset for retry
    delivery.status = 'pending'
    delivery.next_retry_at = None
    delivery.attempt = 0
    delivery.error = ''
    delivery.save()
    
    deliver_webhook.delay(delivery.id)
    
    logger.info(f"Manually retrying delivery {delivery_id}")


@shared_task
def retry_failed_webhooks():
    """Periodic task to retry failed webhooks"""
    now = timezone.now()
    
    # Find deliveries that need retry
    deliveries = Delivery.objects.filter(
        status='pending',
        next_retry_at__lte=now
    ).values_list('id', flat=True)[:100]  # Process in batches
    
    for delivery_id in deliveries:
        deliver_webhook.delay(delivery_id)
    
    if deliveries:
        logger.info(f"Scheduled {len(deliveries)} webhook retries")


@shared_task
def process_pending_webhooks():
    """Process any pending webhooks that might have been missed"""
    # Find old pending webhooks without a retry time
    cutoff = timezone.now() - timedelta(minutes=5)
    
    deliveries = Delivery.objects.filter(
        status='pending',
        next_retry_at__isnull=True,
        created_at__lt=cutoff
    ).values_list('id', flat=True)[:50]
    
    for delivery_id in deliveries:
        deliver_webhook.delay(delivery_id)
    
    if deliveries:
        logger.info(f"Found and scheduled {len(deliveries)} stuck webhooks")


@shared_task
def cleanup_old_deliveries():
    """Clean up old delivery logs"""
    cutoff = timezone.now() - timedelta(days=30)
    
    # Delete old successful deliveries
    deleted, _ = Delivery.objects.filter(
        status='success',
        delivered_at__lt=cutoff
    ).delete()
    
    if deleted:
        logger.info(f"Cleaned up {deleted} old successful deliveries")
    
    # Clean up old logs
    log_cutoff = timezone.now() - timedelta(days=7)
    deleted, _ = WebhookLog.objects.filter(
        timestamp__lt=log_cutoff
    ).delete()
    
    if deleted:
        logger.info(f"Cleaned up {deleted} old webhook logs")


@shared_task
def redrive_dlq_entry(dlq_id):
    """Redrive a single DLQ entry"""
    try:
        dlq_entry = DeadLetterQueue.objects.get(id=dlq_id)
        
        if dlq_entry.redriven_at:
            logger.warning(f"DLQ entry {dlq_id} already redriven")
            return
        
        # Create new delivery from DLQ
        delivery = dlq_entry.delivery
        new_delivery = Delivery.objects.create(
            webhook=delivery.webhook,
            submission=delivery.submission,
            partial=delivery.partial,
            attempt=0
        )
        
        # Mark as redriven
        dlq_entry.redriven_at = timezone.now()
        dlq_entry.save()
        
        # Process the new delivery
        deliver_webhook.delay(new_delivery.id)
        
        logger.info(f"Redriving DLQ entry {dlq_id} as delivery {new_delivery.id}")
        
    except DeadLetterQueue.DoesNotExist:
        logger.error(f"DLQ entry {dlq_id} not found")


@shared_task
def bulk_redrive_dlq(webhook_id=None, limit=100):
    """Bulk redrive DLQ entries"""
    query = DeadLetterQueue.objects.filter(redriven_at__isnull=True)
    
    if webhook_id:
        query = query.filter(delivery__webhook_id=webhook_id)
    
    dlq_entries = query.values_list('id', flat=True)[:limit]
    
    tasks = [redrive_dlq_entry.s(dlq_id) for dlq_id in dlq_entries]
    
    if tasks:
        group(tasks).apply_async()
        logger.info(f"Scheduled {len(tasks)} DLQ entries for redrive")
    
    return len(tasks)


def prepare_webhook_payload(delivery):
    """Prepare webhook payload based on delivery type"""
    base_payload = {
        'webhook_id': str(delivery.webhook.id),
        'delivery_id': str(delivery.id),
        'timestamp': timezone.now().isoformat(),
    }
    
    if delivery.submission:
        base_payload.update({
            'type': 'submission.completed',
            'form_id': str(delivery.submission.form_id),
            'submission': {
                'id': str(delivery.submission.id),
                'form_version': delivery.submission.version,
                'respondent_key': delivery.submission.respondent_key,
                'locale': delivery.submission.locale,
                'started_at': delivery.submission.started_at.isoformat(),
                'completed_at': delivery.submission.completed_at.isoformat() if delivery.submission.completed_at else None,
                'metadata': delivery.submission.metadata_json,
                'answers': [
                    {
                        'block_id': answer.block_id,
                        'type': answer.type,
                        'value': answer.value_json
                    }
                    for answer in delivery.submission.answers.all()
                ]
            }
        })
    elif delivery.partial:
        base_payload.update({
            'type': 'submission.partial',
            'form_id': str(delivery.partial.form_id),
            'partial': {
                'id': str(delivery.partial.id),
                'respondent_key': delivery.partial.respondent_key,
                'last_step': delivery.partial.last_step,
                'updated_at': delivery.partial.updated_at.isoformat(),
                'data': delivery.partial.value_json
            }
        })
    else:
        # Test webhook
        base_payload.update({
            'type': 'webhook.test',
            'message': 'This is a test webhook delivery'
        })
    
    return base_payload


def calculate_hmac_signature(secret, payload):
    """Calculate HMAC-SHA256 signature"""
    return hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def check_rate_limit(webhook):
    """Check if webhook is within rate limit"""
    cache_key = f'webhook_rate_limit:{webhook.id}'
    
    # Get current count
    current_count = cache.get(cache_key, 0)
    
    if current_count >= RATE_LIMIT_MAX_REQUESTS:
        logger.warning(f"Rate limit exceeded for webhook {webhook.id}")
        return False
    
    # Increment count
    cache.set(cache_key, current_count + 1, RATE_LIMIT_WINDOW)
    
    return True