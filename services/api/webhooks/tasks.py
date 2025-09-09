from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from datetime import timedelta
import requests
import hmac
import hashlib
import json
from .models import Webhook, Delivery

logger = get_task_logger(__name__)

RETRY_DELAYS = [0, 30, 120, 600, 3600, 21600, 86400]  # seconds


@shared_task(bind=True, max_retries=7)
def deliver_webhook(self, delivery_id):
    try:
        delivery = Delivery.objects.select_related(
            "webhook", "submission", "partial"
        ).get(id=delivery_id)
        
        if not delivery.webhook.active:
            delivery.status = "failed"
            delivery.error = "Webhook is inactive"
            delivery.save()
            return
        
        # Prepare payload
        payload = prepare_webhook_payload(delivery)
        
        # Calculate signature
        signature = calculate_hmac_signature(
            delivery.webhook.secret,
            json.dumps(payload)
        )
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Forms-Signature": f"sha256={signature}",
            "X-Forms-Timestamp": str(int(timezone.now().timestamp())),
            "X-Forms-Delivery-Id": str(delivery.id),
            **delivery.webhook.headers_json
        }
        
        # Make request
        response = requests.post(
            delivery.webhook.url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        delivery.response_code = response.status_code
        
        if response.ok:
            delivery.status = "success"
            delivery.delivered_at = timezone.now()
            delivery.save()
            logger.info(f"Webhook delivered successfully: {delivery_id}")
        else:
            raise Exception(f"HTTP {response.status_code}: {response.text[:500]}")
            
    except Exception as e:
        delivery.attempt = self.request.retries + 1
        delivery.error = str(e)
        
        if self.request.retries < len(RETRY_DELAYS) - 1:
            # Schedule retry
            retry_delay = RETRY_DELAYS[self.request.retries + 1]
            delivery.next_retry_at = timezone.now() + timedelta(seconds=retry_delay)
            delivery.save()
            
            logger.warning(
                f"Webhook delivery failed, retrying in {retry_delay}s: {delivery_id}"
            )
            raise self.retry(countdown=retry_delay, exc=e)
        else:
            # Max retries reached
            delivery.status = "failed"
            delivery.save()
            logger.error(f"Webhook delivery failed after max retries: {delivery_id}")


@shared_task
def test_webhook_delivery(webhook_id):
    webhook = Webhook.objects.get(id=webhook_id)
    
    delivery = Delivery.objects.create(
        webhook=webhook,
        submission=None,
        partial=None
    )
    
    deliver_webhook.delay(delivery.id)


@shared_task
def retry_webhook_delivery(delivery_id):
    delivery = Delivery.objects.get(id=delivery_id)
    delivery.status = "pending"
    delivery.next_retry_at = None
    delivery.save()
    
    deliver_webhook.delay(delivery.id)


def prepare_webhook_payload(delivery):
    if delivery.submission:
        return {
            "type": "submission.completed",
            "form_id": str(delivery.submission.form_id),
            "submission": {
                "id": str(delivery.submission.id),
                "respondent_key": delivery.submission.respondent_key,
                "completed_at": delivery.submission.completed_at.isoformat(),
                "answers": [
                    {
                        "block_id": answer.block_id,
                        "type": answer.type,
                        "value": answer.value_json
                    }
                    for answer in delivery.submission.answers.all()
                ]
            }
        }
    elif delivery.partial:
        return {
            "type": "submission.partial",
            "form_id": str(delivery.partial.form_id),
            "partial": {
                "id": str(delivery.partial.id),
                "respondent_key": delivery.partial.respondent_key,
                "last_step": delivery.partial.last_step,
                "updated_at": delivery.partial.updated_at.isoformat(),
                "data": delivery.partial.value_json
            }
        }
    else:
        # Test webhook
        return {
            "type": "webhook.test",
            "webhook_id": str(delivery.webhook.id),
            "timestamp": timezone.now().isoformat()
        }


def calculate_hmac_signature(secret, payload):
    return hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()