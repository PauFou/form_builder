import json
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Organization, Membership, Submission, Answer
from forms.models import Form


User = get_user_model()


class SubmissionExportTest(TestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create organization
        self.organization = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        
        # Add user as member
        self.membership = Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role='admin'
        )
        
        # Create form with pages structure
        self.form = Form.objects.create(
            organization=self.organization,
            title='Test Form',
            slug='test-form',
            status='published',
            pages=[
                {
                    'id': 'page1',
                    'blocks': [
                        {
                            'id': 'q1',
                            'type': 'text',
                            'question': 'What is your name?'
                        },
                        {
                            'id': 'q2',
                            'type': 'email',
                            'question': 'What is your email?'
                        },
                        {
                            'id': 'q3',
                            'type': 'select',
                            'question': 'How did you hear about us?',
                            'options': ['Google', 'Friend', 'Social Media']
                        }
                    ]
                }
            ]
        )
        
        # Create submissions with answers
        self.submission1 = Submission.objects.create(
            form=self.form,
            version=1,
            respondent_key='resp1',
            locale='en',
            completed_at=timezone.now()
        )
        
        Answer.objects.create(
            submission=self.submission1,
            block_id='q1',
            type='text',
            value_json={'value': 'John Doe'}
        )
        
        Answer.objects.create(
            submission=self.submission1,
            block_id='q2',
            type='email',
            value_json={'value': 'john@example.com'}
        )
        
        Answer.objects.create(
            submission=self.submission1,
            block_id='q3',
            type='select',
            value_json=['Google', 'Friend']  # Multiple selection
        )
        
        # Create incomplete submission
        self.submission2 = Submission.objects.create(
            form=self.form,
            version=1,
            respondent_key='resp2',
            locale='en'
        )
        
        Answer.objects.create(
            submission=self.submission2,
            block_id='q1',
            type='text',
            value_json={'value': 'Jane Smith'}
        )
        
        # Client setup
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.export_url = reverse('form-submission-export', kwargs={'form_id': str(self.form.id)})
    
    def test_export_csv_success(self):
        """Test successful CSV export of submissions"""
        response = self.client.post(self.export_url, {'format': 'csv'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename=', response['Content-Disposition'])
        self.assertIn('test-form_submissions_', response['Content-Disposition'])
        
        # Parse CSV content
        content = response.content.decode('utf-8')
        lines = content.strip().split('\n')
        
        # Check header
        header = lines[0]
        self.assertIn('Submission ID', header)
        self.assertIn('What is your name?', header)
        self.assertIn('What is your email?', header)
        self.assertIn('How did you hear about us?', header)
        
        # Check data rows
        self.assertEqual(len(lines), 3)  # Header + 2 submissions
        
        # Check that we have both submissions (order may vary)
        all_rows = '\n'.join(lines[1:])
        self.assertIn('John Doe', all_rows)
        self.assertIn('john@example.com', all_rows)
        self.assertIn('Google; Friend', all_rows)  # Multiple values joined
        self.assertIn('Jane Smith', all_rows)
    
    def test_export_with_filters(self):
        """Test CSV export with filters applied"""
        # Export only completed submissions
        response = self.client.post(
            self.export_url + '?completed=true',
            {'format': 'csv'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        content = response.content.decode('utf-8')
        lines = content.strip().split('\n')
        
        # Should have header + 1 completed submission
        self.assertEqual(len(lines), 2)
        self.assertIn('John Doe', lines[1])
        self.assertNotIn('Jane Smith', content)
    
    def test_export_unsupported_format(self):
        """Test export with unsupported format"""
        response = self.client.post(self.export_url, {'format': 'xlsx'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Only CSV format is currently supported', response.json()['error'])
    
    def test_export_no_submissions(self):
        """Test export when no submissions exist"""
        # Create form without submissions
        empty_form = Form.objects.create(
            organization=self.organization,
            title='Empty Form',
            slug='empty-form'
        )
        
        url = reverse('form-submission-export', kwargs={'form_id': str(empty_form.id)})
        response = self.client.post(url, {'format': 'csv'})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('No submissions found', response.json()['error'])
    
    def test_export_unauthorized(self):
        """Test export without authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.export_url, {'format': 'csv'})
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_export_different_organization(self):
        """Test export for form in different organization"""
        # Create another organization
        other_org = Organization.objects.create(
            name='Other Org',
            slug='other-org'
        )
        
        other_form = Form.objects.create(
            organization=other_org,
            title='Other Form',
            slug='other-form'
        )
        
        url = reverse('form-submission-export', kwargs={'form_id': str(other_form.id)})
        response = self.client.post(url, {'format': 'csv'})
        
        # Should return 404 as user doesn't have access
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_export_complex_answer_types(self):
        """Test export with various answer types"""
        # Add more complex answers
        submission = Submission.objects.create(
            form=self.form,
            version=1,
            respondent_key='resp3',
            locale='en',
            completed_at=timezone.now()
        )
        
        # Text answer
        Answer.objects.create(
            submission=submission,
            block_id='q1',
            type='text',
            value_json={'text': 'Complex Text Answer'}  # using 'text' key
        )
        
        # Dict without standard keys
        Answer.objects.create(
            submission=submission,
            block_id='q2',
            type='custom',
            value_json={'custom_key': 'custom_value', 'another': 'value'}
        )
        
        # Empty string value
        Answer.objects.create(
            submission=submission,
            block_id='q3',
            type='empty',
            value_json=''
        )
        
        response = self.client.post(self.export_url, {'format': 'csv'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode('utf-8')
        
        # Check that complex values are handled
        self.assertIn('Complex Text Answer', content)
        self.assertIn("{'custom_key': 'custom_value', 'another': 'value'}", content)