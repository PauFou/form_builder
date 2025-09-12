"""
Webhook receiver with HMAC validation for incoming webhooks
"""
import hmac
import hashlib
import json
import time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status
import logging

logger = logging.getLogger('api.security')

# Tolerance for timestamp validation (5 minutes)
TIMESTAMP_TOLERANCE_SECONDS = 300


@csrf_exempt
@require_http_methods(["POST"])
def receive_webhook(request, webhook_id):
    """
    Receive and validate incoming webhooks with HMAC signature validation
    
    Expected headers:
    - X-Webhook-Signature: HMAC-SHA256 signature
    - X-Webhook-Timestamp: Unix timestamp
    - X-Webhook-Event: Event type (optional)
    """
    try:
        # Get webhook configuration
        from .models import Webhook
        try:
            webhook = Webhook.objects.get(id=webhook_id, active=True)
        except Webhook.DoesNotExist:
            logger.warning(f"Webhook not found or inactive: {webhook_id}")
            return JsonResponse(
                {"error": "Webhook not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get headers
        signature = request.headers.get('X-Webhook-Signature', '')
        timestamp = request.headers.get('X-Webhook-Timestamp', '')
        event_type = request.headers.get('X-Webhook-Event', 'webhook.received')
        
        # Validate timestamp
        if not timestamp:
            logger.warning(f"Missing timestamp for webhook {webhook_id}")
            return JsonResponse(
                {"error": "Missing timestamp"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            timestamp_int = int(timestamp)
            current_time = int(time.time())
            
            if abs(current_time - timestamp_int) > TIMESTAMP_TOLERANCE_SECONDS:
                logger.warning(f"Timestamp too old for webhook {webhook_id}")
                return JsonResponse(
                    {"error": "Timestamp too old"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            logger.warning(f"Invalid timestamp format for webhook {webhook_id}")
            return JsonResponse(
                {"error": "Invalid timestamp"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get request body
        body = request.body.decode('utf-8')
        
        # Calculate expected signature
        message = f"{timestamp}.{body}"
        expected_signature = hmac.new(
            webhook.secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Validate signature
        if not hmac.compare_digest(signature, expected_signature):
            logger.warning(
                f"Invalid signature for webhook {webhook_id}. "
                f"Expected: {expected_signature[:10]}..., Got: {signature[:10]}..."
            )
            return JsonResponse(
                {"error": "Invalid signature"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Parse JSON body
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON body for webhook {webhook_id}")
            return JsonResponse(
                {"error": "Invalid JSON"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log successful validation
        logger.info(
            f"Webhook {webhook_id} validated successfully. "
            f"Event: {event_type}, IP: {request.META.get('REMOTE_ADDR')}"
        )
        
        # Process webhook (queue for processing)
        from .tasks import process_incoming_webhook
        process_incoming_webhook.delay(
            webhook_id=webhook_id,
            event_type=event_type,
            payload=data,
            headers=dict(request.headers),
            source_ip=request.META.get('REMOTE_ADDR')
        )
        
        # Return success response
        return JsonResponse(
            {"status": "accepted", "webhook_id": str(webhook_id)}, 
            status=status.HTTP_202_ACCEPTED
        )
        
    except Exception as e:
        logger.error(f"Error processing webhook {webhook_id}: {str(e)}")
        return JsonResponse(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def generate_webhook_docs():
    """Generate webhook documentation for developers"""
    return {
        "webhook_validation": {
            "description": "All webhooks must be signed with HMAC-SHA256",
            "headers": {
                "X-Webhook-Signature": {
                    "type": "string",
                    "description": "HMAC-SHA256 signature of timestamp.body",
                    "required": True
                },
                "X-Webhook-Timestamp": {
                    "type": "string", 
                    "description": "Unix timestamp (must be within 5 minutes)",
                    "required": True
                },
                "X-Webhook-Event": {
                    "type": "string",
                    "description": "Event type (e.g., form.submitted)",
                    "required": False
                }
            },
            "signature_algorithm": "HMAC-SHA256",
            "signature_format": "hex(hmac-sha256(secret, timestamp + '.' + body))",
            "example": {
                "secret": "your_webhook_secret",
                "timestamp": "1634567890",
                "body": '{"form_id": "123", "data": {...}}',
                "signature": "abc123def456..."
            }
        }
    }