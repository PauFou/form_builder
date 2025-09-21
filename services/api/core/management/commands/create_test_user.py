from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Organization, Membership

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a test user for development'

    def handle(self, *args, **options):
        # Test user credentials
        email = 'test@example.com'
        password = 'Test1234!'
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'User {email} already exists'))
            user = User.objects.get(email=email)
        else:
            # Create user
            user = User.objects.create_user(
                email=email,
                username='testuser',
                password=password,
                first_name='Test',
                last_name='User'
            )
            user.verified_at = user.date_joined
            user.save()
            
            self.stdout.write(self.style.SUCCESS(f'Created test user: {email}'))
        
        # Create organization if it doesn't exist
        org_slug = 'test-workspace'
        if not Organization.objects.filter(slug=org_slug).exists():
            org = Organization.objects.create(
                name='Test Workspace',
                slug=org_slug,
                plan='free'
            )
            
            # Create membership
            Membership.objects.create(
                user=user,
                organization=org,
                role='owner'
            )
            
            self.stdout.write(self.style.SUCCESS(f'Created organization: {org.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nTest credentials:\nEmail: {email}\nPassword: {password}'))