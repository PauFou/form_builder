"""
Webhook delivery service with HMAC signing and retry logic
"""
import json
import logging
import requests
from datetime import timedelta
from typing import Dict, Any, Optional
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from django.db import transaction

from .models import Webhook, Delivery, DeadLetterQueue, WebhookLog
from .signing import WebhookSigner
from core.models import Submission, Partial

logger = logging.getLogger(__name__)


class WebhookDeliveryService:
    """Handle webhook delivery with retries and error handling"""
    
    # Default timeout for webhook requests (10 seconds)
    DEFAULT_TIMEOUT = 10
    
    # Maximum payload size (1MB)
    MAX_PAYLOAD_SIZE = 1024 * 1024
    
    def __init__(self):
        self.session = requests.Session()
        # Set default headers
        self.session.headers.update({
            'User-Agent': f'FormsWebhook/{settings.VERSION}',
        })
    
    def prepare_payload(self, webhook: Webhook, event: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare webhook payload with standard structure"""
        payload = {
            'event': event,
            'timestamp': timezone.now().isoformat(),
            'data': data,
            'webhook': {
                'id': str(webhook.id),
                'version': '1.0',
            }
        }
        
        # Add metadata if available
        if 'form_id' in data:
            payload['form'] = {'id': data['form_id']}
            
        return payload
    
    def send_webhook(
        self, 
        webhook: Webhook, 
        event: str, 
        data: Dict[str, Any],
        idempotency_key: Optional[str] = None,
        delivery_id: Optional[str] = None
    ) -> Delivery:
        """
        Send a webhook with HMAC signing
        
        Args:
            webhook: Webhook configuration
            event: Event type
            data: Event data
            idempotency_key: Optional idempotency key
            delivery_id: Optional delivery ID to retry
            
        Returns:
            Delivery object
        """
        # Get or create delivery record
        if delivery_id:
            try:
                delivery = Delivery.objects.get(id=delivery_id, webhook=webhook)
                delivery.attempt += 1
            except Delivery.DoesNotExist:
                logger.error(f"Delivery {delivery_id} not found")
                raise
        else:
            # Check for duplicate delivery using idempotency key
            if idempotency_key:
                existing = Delivery.objects.filter(
                    webhook=webhook,
                    payload__idempotency_key=idempotency_key
                ).first()
                if existing:
                    logger.info(f"Duplicate delivery for idempotency key {idempotency_key}")
                    return existing
                    
            delivery = Delivery.objects.create(
                webhook=webhook,
                event=event,
                status='processing',
            )
        
        # Prepare payload
        payload = self.prepare_payload(webhook, event, data)
        if idempotency_key:
            payload['idempotency_key'] = idempotency_key
            
        # Check payload size
        payload_json = json.dumps(payload)
        payload_size = len(payload_json.encode('utf-8'))
        if payload_size > self.MAX_PAYLOAD_SIZE:
            self._mark_delivery_failed(
                delivery, 
                f"Payload too large: {payload_size} bytes",
                send_to_dlq=True
            )
            return delivery
            
        delivery.payload = payload
        delivery.payload_size = payload_size
        delivery.save()
        
        # Sign payload
        signer = WebhookSigner(webhook.secret)
        headers = signer.generate_webhook_headers(payload_json, str(delivery.id))
        
        # Add custom headers if configured
        if webhook.headers_json:
            headers.update(webhook.headers_json)
            
        # Create log entry
        log = WebhookLog.objects.create(
            delivery=delivery,
            attempt=delivery.attempt,
            request_headers=headers,
            request_body=payload_json,
        )
        
        # Send the request
        try:
            start_time = timezone.now()
            response = self.session.post(
                webhook.url,
                data=payload_json,
                headers=headers,
                timeout=self.DEFAULT_TIMEOUT,
                allow_redirects=False
            )
            duration_ms = int((timezone.now() - start_time).total_seconds() * 1000)
            
            # Update log with response
            log.response_status = response.status_code
            log.response_headers = dict(response.headers)
            log.response_body = response.text[:10000]  # Limit response size
            log.duration_ms = duration_ms
            log.save()
            
            # Update delivery
            delivery.response_code = response.status_code
            delivery.response_time_ms = duration_ms
            delivery.delivered_at = timezone.now()
            
            # Check if successful
            if 200 <= response.status_code < 300:
                self._mark_delivery_success(delivery)
            else:
                error_msg = f"HTTP {response.status_code}: {response.text[:500]}"
                should_retry = response.status_code >= 500 or response.status_code == 429
                self._mark_delivery_failed(
                    delivery, 
                    error_msg,
                    retry=should_retry and webhook.retry_enabled
                )
                
        except requests.exceptions.Timeout:
            error_msg = f"Request timeout after {self.DEFAULT_TIMEOUT}s"
            log.error_message = error_msg
            log.duration_ms = self.DEFAULT_TIMEOUT * 1000
            log.save()
            self._mark_delivery_failed(delivery, error_msg, retry=webhook.retry_enabled)
            
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error: {str(e)}"
            log.error_message = error_msg
            log.save()
            self._mark_delivery_failed(delivery, error_msg, retry=webhook.retry_enabled)
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.exception(f"Webhook delivery error for {webhook.id}")
            log.error_message = error_msg
            log.save()
            self._mark_delivery_failed(delivery, error_msg, retry=False)
            
        return delivery
    
    def _mark_delivery_success(self, delivery: Delivery):
        """Mark delivery as successful and update stats"""
        with transaction.atomic():
            delivery.status = 'success'
            delivery.save()
            
            # Update webhook stats
            webhook = delivery.webhook
            webhook.total_deliveries += 1
            webhook.successful_deliveries += 1
            webhook.save()
            
    def _mark_delivery_failed(
        self, 
        delivery: Delivery, 
        error_msg: str,
        retry: bool = True,
        send_to_dlq: bool = False
    ):
        """Mark delivery as failed and schedule retry if needed"""
        delivery.error = error_msg
        
        with transaction.atomic():
            if retry and delivery.attempt < delivery.webhook.max_retries:
                # Calculate next retry time
                retry_delays = [0, 30, 120, 600, 3600, 21600, 86400]  # 0s, 30s, 2m, 10m, 1h, 6h, 24h
                delay_index = min(delivery.attempt, len(retry_delays) - 1)
                delay_seconds = retry_delays[delay_index]
                
                delivery.status = 'failed'
                delivery.next_retry_at = timezone.now() + timedelta(seconds=delay_seconds)
                delivery.save()
                
                # Schedule retry
                schedule_webhook_retry.apply_async(
                    args=[str(delivery.id)],
                    eta=delivery.next_retry_at
                )
                
            else:
                # Max retries exceeded or retry disabled
                delivery.status = 'dlq' if send_to_dlq else 'failed'
                delivery.save()
                
                # Update webhook stats
                webhook = delivery.webhook
                webhook.total_deliveries += 1
                webhook.failed_deliveries += 1
                webhook.save()
                
                # Add to DLQ if needed
                if send_to_dlq or (retry and delivery.attempt >= delivery.webhook.max_retries):
                    DeadLetterQueue.objects.create(
                        delivery=delivery,
                        reason=f"Max retries exceeded: {error_msg}",
                        payload_json=delivery.payload
                    )


# Celery tasks
@shared_task(bind=True, max_retries=3)
def deliver_webhook(self, webhook_id: str, event: str, data: Dict[str, Any], idempotency_key: Optional[str] = None):
    """Celery task to deliver webhook"""
    try:
        webhook = Webhook.objects.get(id=webhook_id, active=True)
        service = WebhookDeliveryService()
        service.send_webhook(webhook, event, data, idempotency_key)
    except Webhook.DoesNotExist:
        logger.error(f"Webhook {webhook_id} not found or inactive")
    except Exception as e:
        logger.exception(f"Error delivering webhook {webhook_id}")
        # Retry the task
        raise self.retry(exc=e, countdown=60)


@shared_task
def schedule_webhook_retry(delivery_id: str):
    """Celery task to retry webhook delivery"""
    try:
        delivery = Delivery.objects.get(id=delivery_id)
        if delivery.status != 'failed' or not delivery.next_retry_at:
            logger.info(f"Delivery {delivery_id} no longer needs retry")
            return
            
        # Check if it's time to retry
        if timezone.now() < delivery.next_retry_at:
            logger.info(f"Delivery {delivery_id} not ready for retry yet")
            return
            
        service = WebhookDeliveryService()
        service.send_webhook(
            delivery.webhook,
            delivery.event,
            delivery.payload['data'],
            delivery.payload.get('idempotency_key'),
            delivery_id
        )
    except Delivery.DoesNotExist:
        logger.error(f"Delivery {delivery_id} not found")
    except Exception:
        logger.exception(f"Error retrying webhook delivery {delivery_id}")


@shared_task
def process_dlq_redrives():
    """Process webhook redrives from DLQ"""
    # Get entries ready for redrive
    entries = DeadLetterQueue.objects.filter(
        redriven_at__isnull=True,
        delivery__webhook__active=True
    ).select_related('delivery__webhook')[:100]
    
    for entry in entries:
        try:
            # Create new delivery for redrive
            service = WebhookDeliveryService()
            new_delivery = service.send_webhook(
                entry.delivery.webhook,
                entry.payload_json['event'],
                entry.payload_json['data'],
                entry.payload_json.get('idempotency_key')
            )
            
            # Mark as redriven
            entry.redriven_at = timezone.now()
            entry.save()
            
            logger.info(f"Redrove DLQ entry {entry.id} as delivery {new_delivery.id}")
            
        except Exception:
            logger.exception(f"Error redriving DLQ entry {entry.id}")


def trigger_webhook_for_submission(submission: Submission):
    """Trigger webhooks for a form submission"""
    webhooks = Webhook.objects.filter(
        organization=submission.form.organization,
        active=True
    )
    
    # Prepare submission data
    data = {
        'submission_id': str(submission.id),
        'form_id': str(submission.form_id),
        'completed_at': submission.completed_at.isoformat(),
        'answers': submission.data,
        'metadata': submission.metadata,
    }
    
    # Trigger webhooks
    for webhook in webhooks:
        if webhook.events and 'submission.created' not in webhook.events:
            continue
            
        deliver_webhook.delay(
            str(webhook.id),
            'submission.created',
            data,
            f"submission-{submission.id}"
        )


def trigger_webhook_for_partial(partial: Partial):
    """Trigger webhooks for a partial submission"""
    webhooks = Webhook.objects.filter(
        organization=partial.form.organization,
        active=True,
        include_partials=True
    )
    
    # Prepare partial data
    data = {
        'partial_id': str(partial.id),
        'form_id': str(partial.form_id),
        'respondent_key': partial.respondent_key,
        'last_step': partial.last_step,
        'updated_at': partial.updated_at.isoformat(),
        'data': partial.data,
    }
    
    # Trigger webhooks
    for webhook in webhooks:
        if webhook.events and 'submission.partial' not in webhook.events:
            continue
            
        deliver_webhook.delay(
            str(webhook.id),
            'submission.partial',
            data,
            f"partial-{partial.id}-{partial.updated_at.timestamp()}"
        )