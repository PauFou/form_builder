"""
Comprehensive tests for Form Management API.
"""

import json
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Organization, Membership
from forms.models import Form, FormVersion

User = get_user_model()


class FormManagementTestCase(TestCase):
    """Test case for form management endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!',
            verified_at=timezone.now()
        )
        
        # Create organization
        self.org = Organization.objects.create(
            name='Test Organization',
            slug='test-org',
            plan='pro'
        )
        
        # Create membership
        self.membership = Membership.objects.create(
            user=self.user,
            organization=self.org,
            role='owner'
        )
        
        # Create another user for permission tests
        self.viewer_user = User.objects.create_user(
            username='viewer',
            email='viewer@example.com',
            password='ViewerPass123!'
        )
        
        Membership.objects.create(
            user=self.viewer_user,
            organization=self.org,
            role='viewer'
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
    
    def test_list_forms(self):
        """Test listing forms."""
        # Create test forms
        form1 = Form.objects.create(
            organization=self.org,
            title='Form 1',
            slug='form-1',
            description='Test form 1',
            created_by=self.user
        )
        
        form2 = Form.objects.create(
            organization=self.org,
            title='Form 2',
            slug='form-2',
            description='Test form 2',
            created_by=self.user
        )
        
        response = self.client.get(reverse('form-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_form(self):
        """Test creating a new form."""
        data = {
            'title': 'New Form',
            'description': 'A new test form',
            'slug': 'new-form',
            'organization_id': str(self.org.id)
        }
        
        response = self.client.post(
            reverse('form-list'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], data['title'])
        self.assertEqual(response.data['status'], 'draft')
        
        # Verify form was created
        form = Form.objects.get(id=response.data['id'])
        self.assertEqual(form.title, data['title'])
        self.assertEqual(form.created_by, self.user)
        
        # Verify initial version was created
        self.assertEqual(form.versions.count(), 1)
        version = form.versions.first()
        self.assertEqual(version.version, 1)
    
    def test_create_form_viewer_permission(self):
        """Test that viewers cannot create forms."""
        self.client.force_authenticate(user=self.viewer_user)
        
        data = {
            'title': 'New Form',
            'description': 'A new test form',
            'organization_id': str(self.org.id)
        }
        
        response = self.client.post(
            reverse('form-list'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_form(self):
        """Test updating a form."""
        form = Form.objects.create(
            organization=self.org,
            title='Original Title',
            created_by=self.user
        )
        
        data = {
            'title': 'Updated Title',
            'description': 'Updated description'
        }
        
        response = self.client.patch(
            reverse('form-detail', kwargs={'id': form.id}),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], data['title'])
        
        # Verify form was updated
        form.refresh_from_db()
        self.assertEqual(form.title, data['title'])
        self.assertEqual(form.description, data['description'])
    
    def test_delete_form(self):
        """Test deleting a form."""
        form = Form.objects.create(
            organization=self.org,
            title='Form to Delete',
            created_by=self.user
        )
        
        response = self.client.delete(
            reverse('form-detail', kwargs={'id': form.id})
        )
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify form was deleted
        self.assertFalse(Form.objects.filter(id=form.id).exists())
    
    def test_publish_form(self):
        """Test publishing a form."""
        form = Form.objects.create(
            organization=self.org,
            title='Form to Publish',
            created_by=self.user,
            status='draft'
        )
        
        # Create version
        version = FormVersion.objects.create(
            form=form,
            version=1,
            schema={'blocks': [{'type': 'text', 'label': 'Name'}]}
        )
        
        response = self.client.post(
            reverse('form-publish', kwargs={'id': form.id}),
            data={'canary_percentage': 10},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'published')
        self.assertEqual(response.data['canary_percentage'], 10)
        
        # Verify form status
        form.refresh_from_db()
        self.assertEqual(form.status, 'published')
        
        # Verify version was published
        version.refresh_from_db()
        self.assertIsNotNone(version.published_at)
        self.assertEqual(version.canary_percentage, 10)
    
    def test_duplicate_form(self):
        """Test duplicating a form."""
        original = Form.objects.create(
            organization=self.org,
            title='Original Form',
            description='Original description',
            slug='original-form',
            created_by=self.user
        )
        
        # Create version
        FormVersion.objects.create(
            form=original,
            version=1,
            schema={'blocks': [{'type': 'text', 'label': 'Name'}]},
            theme={'primaryColor': '#000000'}
        )
        
        response = self.client.post(
            reverse('form-duplicate', kwargs={'id': original.id})
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('(Copy)', response.data['title'])
        self.assertEqual(response.data['status'], 'draft')
        
        # Verify new form was created
        new_form = Form.objects.get(id=response.data['id'])
        self.assertNotEqual(new_form.id, original.id)
        self.assertIn('-copy-', new_form.slug)
        
        # Verify version was copied
        self.assertEqual(new_form.versions.count(), 1)
        new_version = new_form.versions.first()
        self.assertEqual(new_version.schema, {'blocks': [{'type': 'text', 'label': 'Name'}]})
    
    def test_search_forms(self):
        """Test searching forms."""
        Form.objects.create(
            organization=self.org,
            title='Contact Form',
            slug='contact-form',
            description='A contact form',
            created_by=self.user
        )
        
        Form.objects.create(
            organization=self.org,
            title='Survey Form',
            slug='survey-form',
            description='A survey about products',
            created_by=self.user
        )
        
        Form.objects.create(
            organization=self.org,
            title='Registration',
            slug='registration',
            description='User registration form',
            created_by=self.user
        )
        
        # Search by title
        response = self.client.get(
            reverse('form-list'),
            {'search': 'form'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # Contact Form and Survey Form
        
        # Search by description
        response = self.client.get(
            reverse('form-list'),
            {'search': 'products'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
    
    def test_filter_forms_by_status(self):
        """Test filtering forms by status."""
        Form.objects.create(
            organization=self.org,
            title='Draft Form',
            slug='draft-form',
            status='draft',
            created_by=self.user
        )
        
        Form.objects.create(
            organization=self.org,
            title='Published Form',
            slug='published-form',
            status='published',
            created_by=self.user
        )
        
        Form.objects.create(
            organization=self.org,
            title='Archived Form',
            slug='archived-form',
            status='archived',
            created_by=self.user
        )
        
        # Filter by status
        response = self.client.get(
            reverse('form-list'),
            {'status': 'published'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], 'Published Form')
    
    def test_ordering_forms(self):
        """Test ordering forms."""
        form1 = Form.objects.create(
            organization=self.org,
            title='A Form',
            slug='a-form',
            created_by=self.user,
            created_at=timezone.now() - timedelta(days=2)
        )
        
        form2 = Form.objects.create(
            organization=self.org,
            title='B Form',
            slug='b-form',
            created_by=self.user,
            created_at=timezone.now() - timedelta(days=1)
        )
        
        form3 = Form.objects.create(
            organization=self.org,
            title='C Form',
            slug='c-form',
            created_by=self.user,
            created_at=timezone.now()
        )
        
        # Order by title ascending
        response = self.client.get(
            reverse('form-list'),
            {'ordering': 'title'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [f['title'] for f in response.data['results']]
        self.assertEqual(titles, ['A Form', 'B Form', 'C Form'])
        
        # Order by created_at descending (default)
        response = self.client.get(
            reverse('form-list')
        )
        
        titles = [f['title'] for f in response.data['results']]
        self.assertEqual(titles, ['C Form', 'B Form', 'A Form'])
    
    def test_form_pages_validation(self):
        """Test form pages structure validation."""
        data = {
            'title': 'Form with Pages',
            'organization_id': str(self.org.id),
            'pages': [
                {
                    'id': 'page1',
                    'blocks': [
                        {
                            'id': 'block1',
                            'type': 'text',
                            'label': 'Name'
                        }
                    ]
                }
            ]
        }
        
        response = self.client.post(
            reverse('form-list'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test invalid pages structure
        data['pages'] = 'not a list'
        
        response = self.client.post(
            reverse('form-list'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('pages', response.data)
    
    def test_slug_uniqueness(self):
        """Test slug uniqueness within organization."""
        Form.objects.create(
            organization=self.org,
            title='First Form',
            slug='unique-slug',
            created_by=self.user
        )
        
        data = {
            'title': 'Second Form',
            'slug': 'unique-slug',
            'organization_id': str(self.org.id)
        }
        
        response = self.client.post(
            reverse('form-list'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('slug', response.data)
    
    def test_form_versions(self):
        """Test form versioning."""
        form = Form.objects.create(
            organization=self.org,
            title='Versioned Form',
            created_by=self.user
        )
        
        # Create initial version
        v1 = FormVersion.objects.create(
            form=form,
            version=1,
            schema={'blocks': [{'type': 'text', 'label': 'V1'}]}
        )
        
        # Create new version
        data = {
            'schema': {'blocks': [{'type': 'text', 'label': 'V2'}]},
            'changelog': 'Updated label to V2'
        }
        
        response = self.client.post(
            reverse('form-version-list', kwargs={'form_id': form.id}),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['version'], 2)
        self.assertEqual(response.data['changelog'], data['changelog'])
        
        # List versions
        response = self.client.get(
            reverse('form-version-list', kwargs={'form_id': form.id})
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
    
    def test_cross_organization_isolation(self):
        """Test that users cannot access forms from other organizations."""
        # Create another organization
        other_org = Organization.objects.create(
            name='Other Organization',
            slug='other-org'
        )
        
        # Create form in other organization
        other_form = Form.objects.create(
            organization=other_org,
            title='Other Org Form',
            created_by=self.user  # Even though created by same user
        )
        
        # Try to access form
        response = self.client.get(
            reverse('form-detail', kwargs={'id': other_form.id})
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify it doesn't appear in list
        response = self.client.get(reverse('form-list'))
        
        form_ids = [f['id'] for f in response.data['results']]
        self.assertNotIn(str(other_form.id), form_ids)


class FormImportTestCase(TestCase):
    """Test case for form import functionality."""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test user and organization
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        self.org = Organization.objects.create(
            name='Test Organization',
            slug='test-org'
        )
        
        Membership.objects.create(
            user=self.user,
            organization=self.org,
            role='owner'
        )
        
        self.client.force_authenticate(user=self.user)
    
    @patch('importers.service.ImportService.import_form')
    def test_import_typeform(self, mock_import):
        """Test importing from Typeform."""
        mock_import.return_value = {
            'success': True,
            'form_id': 'imported-form-id',
            'parity_report': {
                'supported': ['text', 'choice'],
                'unsupported': []
            }
        }
        
        data = {
            'type': 'typeform',
            'source': 'https://typeform.com/to/abc123',
            'organization_id': str(self.org.id)
        }
        
        response = self.client.post(
            reverse('form-import-form'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify import service was called
        mock_import.assert_called_once_with(
            source_type='typeform',
            source='https://typeform.com/to/abc123',
            credentials={},
            organization=self.org,
            user=self.user
        )
    
    @patch('importers.service.ImportService.validate_source')
    def test_validate_import_source(self, mock_validate):
        """Test validating import source."""
        mock_validate.return_value = {
            'valid': True,
            'form_title': 'Contact Form',
            'questions_count': 5
        }
        
        data = {
            'type': 'typeform',
            'source': 'https://typeform.com/to/abc123'
        }
        
        response = self.client.post(
            reverse('form-validate-import'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
    
    @patch('importers.service.ImportService.preview_import')
    def test_preview_import(self, mock_preview):
        """Test previewing import."""
        mock_preview.return_value = {
            'success': True,
            'preview': {
                'title': 'Contact Form',
                'pages': [
                    {
                        'blocks': [
                            {'type': 'text', 'label': 'Name'}
                        ]
                    }
                ]
            }
        }
        
        data = {
            'type': 'google_forms',
            'source': 'form-id-123'
        }
        
        response = self.client.post(
            reverse('form-preview-import'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('preview', response.data)
    
    def test_import_requirements(self):
        """Test getting import requirements."""
        response = self.client.get(
            reverse('form-import-requirements', kwargs={'source_type': 'typeform'})
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)