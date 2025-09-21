#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from core.models import User, Organization, Membership  # noqa: E402

# Create test organization
org, created = Organization.objects.get_or_create(
    slug='test-org',
    defaults={
        'name': 'Test Organization',
        'plan': 'free',
    }
)
print(f"Organization: {org.name} ({'created' if created else 'exists'})")

# Create test user
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={
        'is_active': True,
        'is_staff': True,
    }
)
if created:
    user.set_password('password123')
    user.save()
print(f"User: {user.email} ({'created' if created else 'exists'})")

# Create membership
membership, created = Membership.objects.get_or_create(
    user=user,
    organization=org,
    defaults={'role': 'owner'}
)
print(f"Membership: {membership.role} ({'created' if created else 'exists'})")

print("\nTest credentials:")
print(f"Email: {user.email}")
print("Password: password123")
print(f"Organization: {org.slug}")