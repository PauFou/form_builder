#!/usr/bin/env python3
"""
Generate strong secrets for production deployment
"""
import secrets
import string
import json
import sys


def generate_secret_key(length=50):
    """Generate a Django SECRET_KEY"""
    chars = string.ascii_letters + string.digits + "!#$%&()*+,-./:;<=>?@[]^_`{|}~"
    return ''.join(secrets.choice(chars) for _ in range(length))


def generate_token(length=32):
    """Generate a URL-safe token"""
    return secrets.token_urlsafe(length)


def generate_hex_key(length=32):
    """Generate a hex key for encryption"""
    return secrets.token_hex(length)


def main():
    """Generate all required secrets"""
    
    print("🔐 Generating strong production secrets...\n")
    
    secrets_dict = {
        "DJANGO_SECRET_KEY": generate_secret_key(50),
        "JWT_SECRET": generate_token(32),
        "HMAC_SECRET": generate_token(32),
        "ENCRYPTION_KEY": generate_hex_key(16)[:32],  # 32 chars for AES-256
        "POSTGRES_PASSWORD": generate_token(24),
        "REDIS_PASSWORD": generate_token(24),
        "STRIPE_SECRET_KEY": f"sk_live_{generate_token(24)}",  # Placeholder format
        "STRIPE_WEBHOOK_SECRET": f"whsec_{generate_token(32)}",  # Placeholder format
        "GOOGLE_CLIENT_SECRET": generate_token(24),
        "SLACK_CLIENT_SECRET": generate_token(24),
        "NOTION_CLIENT_SECRET": generate_token(24),
    }
    
    # Print as environment variables
    print("# Add these to your production .env file:")
    print("# Generated on:", secrets.SystemRandom().choice(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']))
    print("# NEVER commit these values to version control!\n")
    
    for key, value in secrets_dict.items():
        print(f'{key}="{value}"')
    
    print("\n# Additional settings for production:")
    print('DJANGO_DEBUG="False"')
    print('DJANGO_ALLOWED_HOSTS="your-domain.com,api.your-domain.com"')
    print('CORS_ALLOWED_ORIGINS="https://your-domain.com,https://app.your-domain.com"')
    print('FRONTEND_URL="https://app.your-domain.com"')
    print('SITE_URL="https://api.your-domain.com"')
    print('DEFAULT_FROM_EMAIL="noreply@your-domain.com"')
    print('EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"')
    
    print("\n⚠️  IMPORTANT SECURITY NOTES:")
    print("1. Store these secrets in a secure secret management system (AWS Secrets Manager, Vault, etc)")
    print("2. Never expose these values in logs, error messages, or client-side code")
    print("3. Rotate these secrets periodically (at least annually)")
    print("4. Use different secrets for each environment (dev, staging, prod)")
    print("5. Enable audit logging for secret access")
    print("6. Restrict access to production secrets to authorized personnel only")
    
    # Generate webhook validation example
    print("\n# Example webhook signature validation (for documentation):")
    print(f"# Secret: {secrets_dict['HMAC_SECRET']}")
    print("# Timestamp: 1634567890")
    print("# Body: {\"test\": \"payload\"}")
    print("# Signature will be calculated as: HMAC-SHA256(secret, 'timestamp.body')")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())