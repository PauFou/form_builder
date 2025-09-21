"""
Middleware for HMAC validation and rate limiting
"""

import hashlib
import hmac
import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.utils.encoding import force_bytes


class HMACValidationMiddleware(MiddlewareMixin):
    """
    Middleware to validate HMAC signatures on sensitive endpoints
    """
    
    # Endpoints that require HMAC validation
    PROTECTED_ENDPOINTS = [
        '/v1/submissions/',
        '/v1/webhooks/receive/',
    ]
    
    def process_request(self, request):
        """
        Validate HMAC signature for protected endpoints
        """
        # Skip validation for non-protected endpoints
        if not any(request.path.startswith(endpoint) for endpoint in self.PROTECTED_ENDPOINTS):
            return None
        
        # Skip validation for GET requests (read-only)
        if request.method == 'GET':
            return None
        
        # Get HMAC signature from headers
        signature = request.headers.get('X-Forms-Signature')
        if not signature:
            return JsonResponse({
                'error': 'Missing HMAC signature',
                'code': 'MISSING_SIGNATURE'
            }, status=401)
        
        # Get HMAC secret from settings
        hmac_secret = getattr(settings, 'HMAC_SECRET', None)
        if not hmac_secret:
            return JsonResponse({
                'error': 'HMAC validation not configured',
                'code': 'SERVER_ERROR'
            }, status=500)
        
        # Validate signature format
        if not signature.startswith('sha256='):
            return JsonResponse({
                'error': 'Invalid signature format',
                'code': 'INVALID_SIGNATURE_FORMAT'
            }, status=401)
        
        # Get request body
        try:
            body = request.body
        except Exception:
            return JsonResponse({
                'error': 'Cannot read request body',
                'code': 'INVALID_REQUEST'
            }, status=400)
        
        # Calculate expected signature
        expected_signature = hmac.new(
            force_bytes(hmac_secret),
            body,
            hashlib.sha256
        ).hexdigest()
        
        # Extract provided signature (remove 'sha256=' prefix)
        provided_signature = signature[7:]
        
        # Compare signatures using timing-safe comparison
        if not hmac.compare_digest(expected_signature, provided_signature):
            return JsonResponse({
                'error': 'Invalid HMAC signature',
                'code': 'INVALID_SIGNATURE'
            }, status=401)
        
        # Validate timestamp if present
        timestamp_header = request.headers.get('X-Forms-Timestamp')
        if timestamp_header:
            try:
                timestamp = int(timestamp_header)
                current_time = int(time.time())
                tolerance = getattr(settings, 'HMAC_TOLERANCE_SECONDS', 300)
                
                if abs(current_time - timestamp) > tolerance:
                    return JsonResponse({
                        'error': 'Request timestamp outside tolerance window',
                        'code': 'TIMESTAMP_INVALID'
                    }, status=401)
            except ValueError:
                return JsonResponse({
                    'error': 'Invalid timestamp format',
                    'code': 'INVALID_TIMESTAMP'
                }, status=401)
        
        return None


class RateLimitMiddleware(MiddlewareMixin):
    """
    Simple rate limiting middleware using Django cache
    """
    
    def get_cache_key(self, request):
        """Generate cache key for rate limiting"""
        client_ip = self.get_client_ip(request)
        return f"rate_limit:{client_ip}:{request.path}"
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def process_request(self, request):
        """
        Check rate limits for submission endpoints
        """
        # Only apply rate limiting to submission endpoints
        if not request.path.startswith('/v1/submissions/'):
            return None
        
        # Skip rate limiting for GET requests
        if request.method == 'GET':
            return None
        
        # Get rate limit settings
        rate_limit = getattr(settings, 'SUBMISSION_RATE_LIMIT_PER_MINUTE', 60)
        
        # Get current count
        cache_key = self.get_cache_key(request)
        current_minute = int(time.time() // 60)
        cache_key_with_minute = f"{cache_key}:{current_minute}"
        
        current_count = cache.get(cache_key_with_minute, 0)
        
        if current_count >= rate_limit:
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'code': 'RATE_LIMIT_EXCEEDED',
                'retry_after': 60 - (int(time.time()) % 60)
            }, status=429)
        
        # Increment counter
        cache.set(cache_key_with_minute, current_count + 1, timeout=60)
        
        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to responses
    """
    
    def process_response(self, request, response):
        """Add security headers"""
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add CORS headers for ingest service
        if request.path.startswith('/v1/submissions/'):
            origin = request.headers.get('Origin')
            allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
            
            if origin in allowed_origins:
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Forms-Signature, X-Forms-Timestamp'
                response['Access-Control-Allow-Credentials'] = 'true'
        
        return response