"""
HMAC signing utilities for webhooks
"""
import hmac
import hashlib
import time
import json
from typing import Dict, Any, Optional, Union
from django.conf import settings


class WebhookSigner:
    """Handle HMAC signing for webhook payloads"""
    
    SIGNATURE_HEADER = 'X-Forms-Signature'
    TIMESTAMP_HEADER = 'X-Forms-Timestamp'
    REQUEST_ID_HEADER = 'X-Forms-Request-ID'
    
    # Tolerance for timestamp validation (5 minutes)
    TIMESTAMP_TOLERANCE_SECONDS = 300
    
    def __init__(self, secret: Optional[str] = None):
        """Initialize with secret key"""
        self.secret = secret or settings.WEBHOOK_HMAC_SECRET
        if not self.secret:
            raise ValueError("Webhook HMAC secret is not configured")
    
    def sign_payload(self, payload: Union[Dict[Any, Any], str], timestamp: Optional[int] = None) -> Dict[str, str]:
        """
        Sign a webhook payload and return headers
        
        Args:
            payload: The payload to sign (dict or string)
            timestamp: Optional timestamp (defaults to current time)
            
        Returns:
            Dictionary of headers to include with the webhook
        """
        # Convert payload to string if needed
        if isinstance(payload, dict):
            payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
        else:
            payload_str = payload
            
        # Use current timestamp if not provided
        if timestamp is None:
            timestamp = int(time.time())
            
        # Create the signature base string
        signature_base = f"{timestamp}.{payload_str}"
        
        # Calculate HMAC signature
        signature = hmac.new(
            self.secret.encode('utf-8'),
            signature_base.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Return headers
        return {
            self.SIGNATURE_HEADER: f"sha256={signature}",
            self.TIMESTAMP_HEADER: str(timestamp),
        }
    
    def verify_signature(
        self, 
        payload: Union[Dict[Any, Any], str], 
        signature: str, 
        timestamp: Union[str, int],
        enforce_timestamp: bool = True
    ) -> bool:
        """
        Verify a webhook signature
        
        Args:
            payload: The payload that was signed
            signature: The signature to verify (with or without 'sha256=' prefix)
            timestamp: The timestamp from the request
            enforce_timestamp: Whether to enforce timestamp validation
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Convert payload to string if needed
            if isinstance(payload, dict):
                payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
            else:
                payload_str = payload
                
            # Convert timestamp to int
            timestamp_int = int(timestamp)
            
            # Check timestamp tolerance if enforced
            if enforce_timestamp:
                current_time = int(time.time())
                if abs(current_time - timestamp_int) > self.TIMESTAMP_TOLERANCE_SECONDS:
                    return False
            
            # Remove 'sha256=' prefix if present
            if signature.startswith('sha256='):
                signature = signature[7:]
                
            # Create the expected signature
            expected = self.sign_payload(payload_str, timestamp_int)
            expected_signature = expected[self.SIGNATURE_HEADER].replace('sha256=', '')
            
            # Compare signatures using constant-time comparison
            return hmac.compare_digest(expected_signature, signature)
            
        except (ValueError, TypeError, AttributeError):
            return False
    
    def generate_webhook_headers(
        self, 
        payload: Union[Dict[Any, Any], str],
        request_id: Optional[str] = None,
        custom_headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Generate all required webhook headers
        
        Args:
            payload: The payload to send
            request_id: Optional request ID for tracking
            custom_headers: Additional custom headers
            
        Returns:
            Complete set of headers for the webhook request
        """
        import uuid
        
        # Get signature headers
        headers = self.sign_payload(payload)
        
        # Add request ID
        if request_id:
            headers[self.REQUEST_ID_HEADER] = request_id
        else:
            headers[self.REQUEST_ID_HEADER] = str(uuid.uuid4())
            
        # Add content type
        headers['Content-Type'] = 'application/json'
        
        # Add custom headers if provided
        if custom_headers:
            headers.update(custom_headers)
            
        return headers


def rotate_webhook_secret(organization_id: str, new_secret: Optional[str] = None) -> str:
    """
    Rotate webhook secret for an organization
    
    Args:
        organization_id: The organization ID
        new_secret: Optional new secret (will generate if not provided)
        
    Returns:
        The new webhook secret
    """
    import secrets
    from webhooks.models import WebhookEndpoint
    
    # Generate new secret if not provided
    if not new_secret:
        new_secret = secrets.token_urlsafe(32)
    
    # Update all webhooks for the organization
    WebhookEndpoint.objects.filter(
        organization_id=organization_id
    ).update(secret=new_secret)
    
    return new_secret


def validate_webhook_request(request) -> tuple[bool, Optional[str]]:
    """
    Validate an incoming webhook callback request
    
    Args:
        request: Django request object
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    
    # Check required headers
    signature = request.headers.get('X-Forms-Signature')
    timestamp = request.headers.get('X-Forms-Timestamp')
    
    if not signature or not timestamp:
        return False, "Missing required signature headers"
    
    # Get the webhook endpoint based on the URL
    # This would need to be implemented based on your URL structure
    webhook_id = request.resolver_match.kwargs.get('webhook_id')
    if not webhook_id:
        return False, "Invalid webhook URL"
    
    try:
        from webhooks.models import WebhookEndpoint
        webhook = WebhookEndpoint.objects.get(id=webhook_id, active=True)
    except WebhookEndpoint.DoesNotExist:
        return False, "Webhook not found or inactive"
    
    # Verify signature
    signer = WebhookSigner(webhook.secret)
    if not signer.verify_signature(request.body.decode('utf-8'), signature, timestamp):
        return False, "Invalid signature"
    
    return True, None