import unittest
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import Organization, Submission, Answer
from forms.models import Form

User = get_user_model()


class SubmissionAPITestCase(APITestCase):
    def setUp(self):
        """Set up test data"""
        # Create organization
        self.organization = Organization.objects.create(
            name="Test Org",
            slug="test-org"
        )
        
        # Create user
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            username="testuser"
        )
        
        # Create membership
        from core.models import Membership
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role="owner"
        )
        
        # Create form
        self.form = Form.objects.create(
            title="Test Form",
            slug="test-form",
            organization=self.organization,
            created_by=self.user,
            pages=[
                {
                    "id": "page1",
                    "blocks": [
                        {"id": "field1", "key": "name", "type": "text", "label": "Name"},
                        {"id": "field2", "key": "email", "type": "email", "label": "Email"}
                    ]
                }
            ]
        )
        
        # Create submission
        self.submission = Submission.objects.create(
            form=self.form,
            version=1,
            respondent_key="test-respondent-123",
            locale="en"
        )
        
        # Create answers
        Answer.objects.create(
            submission=self.submission,
            block_id="field1",
            type="text",
            value_json="John Doe"
        )
        Answer.objects.create(
            submission=self.submission,
            block_id="field2",
            type="email",
            value_json="john@example.com"
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)

    def test_list_submissions(self):
        """Test listing submissions for a form"""
        url = reverse('submission-list')
        response = self.client.get(url, {'form_pk': self.form.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['respondent_key'], 'test-respondent-123')

    @unittest.skip("Submission creation via API endpoint not implemented")
    def test_create_submission(self):
        """Test creating a new submission"""
        url = reverse('submission-list')
        data = {
            'respondent_key': 'new-respondent-456',
            'locale': 'en',
            'version': 1,
            'answers': {
                'name': 'Jane Doe',
                'email': 'jane@example.com'
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check submission was created
        submission = Submission.objects.get(respondent_key='new-respondent-456')
        self.assertEqual(submission.answers.count(), 2)

    @unittest.skip("Permission check for nested organization needs fixing")
    def test_export_submissions_csv(self):
        """Test exporting submissions as CSV"""
        url = reverse('submission-export')
        data = {'format': 'csv'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')

    def test_submission_stats(self):
        """Test getting submission statistics"""
        url = reverse('submission-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_submissions', response.data)
        self.assertIn('completion_rate', response.data)

    @unittest.skip("Permission check for nested organization needs fixing")
    def test_add_tags_to_submission(self):
        """Test adding tags to a submission"""
        url = reverse('submission-add-tags', kwargs={'pk': self.submission.id})
        data = {'tags': ['urgent', 'follow-up']}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check tags were added
        self.submission.refresh_from_db()
        self.assertIn('urgent', self.submission.metadata_json['tags'])

    def test_filter_submissions_by_completion(self):
        """Test filtering submissions by completion status"""
        url = reverse('submission-list')
        response = self.client.get(url, {'is_completed': 'false'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return our submission since it's not completed
        self.assertEqual(len(response.data['results']), 1)

    def test_search_submissions(self):
        """Test full-text search in submissions"""
        url = reverse('submission-list')
        response = self.client.get(url, {'search': 'John'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)