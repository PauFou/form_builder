import json
import requests
import hmac
import hashlib
from typing import Dict, Any, List
from django.conf import settings
from django.utils import timezone

from .base import BaseProvider


class WebhookProvider(BaseProvider):
    """Custom webhook integration provider"""
    
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test webhook endpoint"""
        config = integration.config
        
        if not config.get('url'):
            raise ValueError("Webhook URL is required")
        
        # Send test request
        headers = self._build_headers(config, sample_data)
        
        response = requests.request(
            method=config.get('method', 'POST'),
            url=config['url'],
            headers=headers,
            json={'test': True, 'data': sample_data},
            timeout=30
        )
        
        return {
            'status_code': response.status_code,
            'headers': dict(response.headers),
            'body': response.text[:1000] if response.text else None
        }
    
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to webhook endpoint"""
        config = integration.config
        
        # Build request
        headers = self._build_headers(config, data)
        
        # Add custom headers from settings
        if settings.get('custom_headers'):
            headers.update(settings['custom_headers'])
        
        # Send request
        response = requests.request(
            method=config.get('method', 'POST'),
            url=config['url'],
            headers=headers,
            json=data,
            timeout=30
        )
        
        # Check response
        if response.status_code >= 400:
            raise ValueError(f"Webhook returned error status: {response.status_code}")
        
        return {
            'status_code': response.status_code,
            'headers': dict(response.headers),
            'body': response.text[:1000] if response.text else None
        }
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate webhook configuration"""
        if not config.get('url'):
            raise ValueError("Webhook URL is required")
        
        # Validate URL
        url = config['url']
        if not url.startswith(('http://', 'https://')):
            raise ValueError("Webhook URL must start with http:// or https://")
        
        # Validate method
        method = config.get('method', 'POST')
        if method not in ['GET', 'POST', 'PUT', 'PATCH']:
            raise ValueError(f"Invalid HTTP method: {method}")
        
        return True
    
    def _build_headers(self, config: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, str]:
        """Build request headers including signature"""
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Forms-Webhook/1.0',
            'X-Forms-Timestamp': str(int(timezone.now().timestamp()))
        }
        
        # Add signature if secret is configured
        if config.get('secret'):
            signature = self._generate_signature(config['secret'], data)
            headers['X-Forms-Signature'] = signature
        
        # Add custom headers
        if config.get('headers'):
            headers.update(config['headers'])
        
        return headers
    
    def _generate_signature(self, secret: str, data: Dict[str, Any]) -> str:
        """Generate HMAC signature for webhook payload"""
        payload = json.dumps(data, sort_keys=True, separators=(',', ':'))
        
        signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return f"sha256={signature}"