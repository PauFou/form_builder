from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Organization, Membership, Form, FormVersion
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with test data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=3,
            help='Number of users to create'
        )
        parser.add_argument(
            '--forms',
            type=int,
            default=5,
            help='Number of forms to create per organization'
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Create demo users
        demo_user = User.objects.create_user(
            email='demo@forms.example',
            username='demo',
            password='demopass123',
            first_name='Demo',
            last_name='User'
        )
        
        # Create demo organization
        demo_org = Organization.objects.create(
            name='Demo Organization',
            slug='demo-org',
            plan='pro'
        )
        
        Membership.objects.create(
            user=demo_user,
            organization=demo_org,
            role='owner'
        )
        
        # Create additional users
        users = [demo_user]
        for i in range(1, options['users']):
            user = User.objects.create_user(
                email=f'user{i}@forms.example',
                username=f'user{i}',
                password='password123',
                first_name=f'User',
                last_name=f'{i}'
            )
            users.append(user)
            
            # Add to demo org with different roles
            roles = ['admin', 'editor', 'viewer']
            role = roles[(i - 1) % len(roles)]
            
            Membership.objects.create(
                user=user,
                organization=demo_org,
                role=role
            )
        
        # Create demo forms
        form_templates = [
            {
                'title': 'Customer Feedback Survey',
                'description': 'Collect feedback from your customers',
                'blocks': [
                    {'id': 'name', 'type': 'text', 'question': 'What is your name?', 'required': True},
                    {'id': 'email', 'type': 'email', 'question': 'What is your email?', 'required': True},
                    {'id': 'rating', 'type': 'rating', 'question': 'How would you rate our service?', 'scale': 5},
                    {'id': 'feedback', 'type': 'long_text', 'question': 'Any additional feedback?'}
                ]
            },
            {
                'title': 'Event Registration',
                'description': 'Register for our upcoming event',
                'blocks': [
                    {'id': 'name', 'type': 'text', 'question': 'Full Name', 'required': True},
                    {'id': 'email', 'type': 'email', 'question': 'Email Address', 'required': True},
                    {'id': 'phone', 'type': 'phone', 'question': 'Phone Number'},
                    {'id': 'dietary', 'type': 'dropdown', 'question': 'Dietary Requirements', 
                     'options': ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other']}
                ]
            },
            {
                'title': 'Job Application',
                'description': 'Apply for open positions',
                'blocks': [
                    {'id': 'name', 'type': 'text', 'question': 'Full Name', 'required': True},
                    {'id': 'email', 'type': 'email', 'question': 'Email', 'required': True},
                    {'id': 'position', 'type': 'dropdown', 'question': 'Position', 
                     'options': ['Frontend Developer', 'Backend Developer', 'Designer', 'Product Manager']},
                    {'id': 'resume', 'type': 'file_upload', 'question': 'Upload Resume', 'required': True},
                    {'id': 'cover_letter', 'type': 'long_text', 'question': 'Cover Letter'}
                ]
            },
            {
                'title': 'Product Waitlist',
                'description': 'Join our product waitlist',
                'blocks': [
                    {'id': 'email', 'type': 'email', 'question': 'Email address', 'required': True},
                    {'id': 'company', 'type': 'text', 'question': 'Company name'},
                    {'id': 'use_case', 'type': 'long_text', 'question': 'How do you plan to use our product?'}
                ]
            },
            {
                'title': 'Contact Form',
                'description': 'Get in touch with us',
                'blocks': [
                    {'id': 'name', 'type': 'text', 'question': 'Name', 'required': True},
                    {'id': 'email', 'type': 'email', 'question': 'Email', 'required': True},
                    {'id': 'subject', 'type': 'text', 'question': 'Subject', 'required': True},
                    {'id': 'message', 'type': 'long_text', 'question': 'Message', 'required': True}
                ]
            }
        ]
        
        for i in range(min(options['forms'], len(form_templates))):
            template = form_templates[i]
            
            form = Form.objects.create(
                organization=demo_org,
                title=template['title'],
                slug=template['title'].lower().replace(' ', '-'),
                description=template['description'],
                status='published' if i < 2 else 'draft',
                created_by=demo_user
            )
            
            FormVersion.objects.create(
                form=form,
                version=1,
                schema_json={
                    'blocks': template['blocks'],
                    'settings': {
                        'submitText': 'Submit',
                        'showProgressBar': True
                    }
                },
                theme_json={
                    'primaryColor': '#4F46E5',
                    'fontFamily': 'Inter'
                }
            )
            
            self.stdout.write(f'Created form: {form.title}')
        
        self.stdout.write(self.style.SUCCESS(
            f'\nSeeding complete!\n'
            f'Created {len(users)} users\n'
            f'Created {Form.objects.count()} forms\n'
            f'\nDemo credentials:\n'
            f'Email: demo@forms.example\n'
            f'Password: demopass123'
        ))