from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization, Membership
from forms.models import Form, FormVersion
import uuid

User = get_user_model()


class FormAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.owner = User.objects.create_user(
            email='owner@example.com',
            username='owner',
            password='password'
        )
        
        self.editor = User.objects.create_user(
            email='editor@example.com',
            username='editor',
            password='password'
        )
        
        self.viewer = User.objects.create_user(
            email='viewer@example.com',
            username='viewer',
            password='password'
        )
        
        # Create organization
        self.org = Organization.objects.create(
            name='Test Organization',
            slug='test-org'
        )
        
        # Create memberships
        Membership.objects.create(user=self.owner, organization=self.org, role='owner')
        Membership.objects.create(user=self.editor, organization=self.org, role='editor')
        Membership.objects.create(user=self.viewer, organization=self.org, role='viewer')
        
    def test_create_form_as_owner(self):
        """Test form creation by organization owner"""
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'title': 'Test Form',
            'description': 'A test form',
            'slug': 'test-form',
            'organization_id': str(self.org.id)
        }
        
        response = self.client.post('/v1/forms/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Form')
        
        # Check form was created with initial version
        form = Form.objects.get(id=response.data['id'])
        self.assertEqual(form.versions.count(), 1)
    
    def test_create_form_as_editor(self):
        """Test form creation by editor"""
        self.client.force_authenticate(user=self.editor)
        
        data = {
            'title': 'Editor Form',
            'slug': 'editor-form',
            'organization_id': str(self.org.id)
        }
        
        response = self.client.post('/v1/forms/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_form_as_viewer_fails(self):
        """Test viewer cannot create forms"""
        self.client.force_authenticate(user=self.viewer)
        
        data = {
            'title': 'Viewer Form',
            'slug': 'viewer-form',
            'organization_id': str(self.org.id)
        }
        
        response = self.client.post('/v1/forms/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_forms(self):
        """Test listing forms for organization"""
        # Create some forms
        for i in range(3):
            Form.objects.create(
                organization=self.org,
                title=f'Form {i}',
                slug=f'form-{i}',
                created_by=self.owner
            )
        
        self.client.force_authenticate(user=self.viewer)
        
        response = self.client.get('/v1/forms/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
    
    def test_publish_form(self):
        """Test publishing a form"""
        form = Form.objects.create(
            organization=self.org,
            title='Draft Form',
            slug='draft-form',
            status='draft',
            created_by=self.owner
        )
        
        version = FormVersion.objects.create(
            form=form,
            version=1,
            schema={'blocks': []}
        )
        
        self.client.force_authenticate(user=self.owner)
        
        response = self.client.post(f'/v1/forms/{form.id}/publish/', {
            'version_id': str(version.id),
            'canary_percentage': 10
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'published')
        
        # Check form status was updated
        form.refresh_from_db()
        self.assertEqual(form.status, 'published')
        
        # Check version was published
        version.refresh_from_db()
        self.assertIsNotNone(version.published_at)
        self.assertEqual(version.canary_percentage, 10)
    
    def test_duplicate_form(self):
        """Test duplicating a form"""
        form = Form.objects.create(
            organization=self.org,
            title='Original Form',
            slug='original-form',
            created_by=self.owner
        )
        
        FormVersion.objects.create(
            form=form,
            version=1,
            schema={'blocks': [{'type': 'text', 'id': '1'}]}
        )
        
        self.client.force_authenticate(user=self.editor)
        
        response = self.client.post(f'/v1/forms/{form.id}/duplicate/')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('(Copy)', response.data['title'])
        self.assertNotEqual(response.data['id'], str(form.id))
        
        # Check new form has version with same schema
        new_form = Form.objects.get(id=response.data['id'])
        new_version = new_form.versions.first()
        self.assertEqual(new_version.schema['blocks'][0]['type'], 'text')