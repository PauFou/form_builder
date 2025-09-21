from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Organization, Membership

User = get_user_model()

class Command(BaseCommand):
    help = 'Ensure test user has an organization'

    def handle(self, *args, **kwargs):
        try:
            # Get the test user
            user = User.objects.get(email='test@example.com')
            self.stdout.write(f"Found test user: {user.email}")
            
            # Check if user has any organizations
            memberships = Membership.objects.filter(user=user)
            if memberships.exists():
                self.stdout.write(self.style.SUCCESS("Test user already has organizations:"))
                for membership in memberships:
                    self.stdout.write(f"  - {membership.organization.name} ({membership.role})")
            else:
                # Create a default organization for the test user
                org = Organization.objects.create(
                    name="Test Organization",
                    slug="test-org"
                )
                
                # Add user as owner
                Membership.objects.create(
                    user=user,
                    organization=org,
                    role='owner'
                )
                
                self.stdout.write(self.style.SUCCESS(f"Created organization '{org.name}' for test user"))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Test user not found! Run 'python manage.py create_test_user' first"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))