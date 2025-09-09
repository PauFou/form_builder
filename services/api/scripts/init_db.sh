#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z localhost 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
from core.models import Organization, Membership

User = get_user_model()

if not User.objects.filter(email='admin@forms.local').exists():
    superuser = User.objects.create_superuser(
        email='admin@forms.local',
        username='admin',
        password='admin123'
    )
    print("Superuser created: admin@forms.local / admin123")
    
    # Create organization for superuser
    org = Organization.objects.create(
        name='Admin Organization',
        slug='admin-org',
        plan='scale'
    )
    
    Membership.objects.create(
        user=superuser,
        organization=org,
        role='owner'
    )
    print("Admin organization created")
else:
    print("Superuser already exists")
EOF

# Seed demo data
echo "Seeding demo data..."
python manage.py seed_data

echo "Database initialization complete!"