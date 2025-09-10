import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from forms.models import Form, FormVersion
from core.models import Organization, Membership

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )


@pytest.fixture
def organization(db):
    return Organization.objects.create(
        name='Test Organization',
        slug='test-org'
    )


@pytest.fixture
def membership(db, user, organization):
    return Membership.objects.create(
        user=user,
        organization=organization,
        role='admin'
    )


@pytest.fixture
def authenticated_client(api_client, user, membership):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def form(db, organization, user):
    return Form.objects.create(
        organization=organization,
        created_by=user,
        title='Test Form',
        description='A test form',
        pages=[
            {
                'id': 'page_1',
                'blocks': [
                    {
                        'id': 'field_1',
                        'type': 'text',
                        'title': 'Your Name',
                        'required': True
                    }
                ]
            }
        ]
    )


class TestFormAPI:
    """Test form CRUD operations"""
    
    def test_list_forms(self, authenticated_client, form):
        url = reverse('form-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == str(form.id)
    
    def test_create_form(self, authenticated_client, organization):
        url = reverse('form-list')
        data = {
            'title': 'New Form',
            'description': 'A new form',
            'pages': [
                {
                    'id': 'page_1',
                    'blocks': []
                }
            ]
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Form'
        assert Form.objects.filter(title='New Form').exists()
    
    def test_update_form(self, authenticated_client, form):
        url = reverse('form-detail', args=[form.id])
        data = {
            'title': 'Updated Form',
            'pages': form.pages
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Form'
        
        form.refresh_from_db()
        assert form.title == 'Updated Form'
    
    def test_delete_form(self, authenticated_client, form):
        url = reverse('form-detail', args=[form.id])
        
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Form.objects.filter(id=form.id).exists()
    
    def test_unauthorized_access(self, api_client, form):
        url = reverse('form-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestFormValidation:
    """Test form validation rules"""
    
    def test_pages_validation(self, authenticated_client):
        url = reverse('form-list')
        data = {
            'title': 'Invalid Form',
            'pages': 'not-a-list'  # Should be a list
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'pages' in response.data
    
    def test_unique_slug_validation(self, authenticated_client, form):
        url = reverse('form-list')
        data = {
            'title': 'Another Form',
            'slug': form.slug,  # Duplicate slug
            'pages': []
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'slug' in response.data


class TestFormImport:
    """Test form import functionality"""
    
    def test_typeform_import_validation(self, authenticated_client):
        url = reverse('form-validate-import')
        data = {
            'type': 'typeform',
            'source': 'https://form.typeform.com/to/abcdef'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['valid'] is True
        assert response.data['form_id'] == 'abcdef'
    
    def test_invalid_import_source(self, authenticated_client):
        url = reverse('form-validate-import')
        data = {
            'type': 'typeform',
            'source': 'not-a-valid-url'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['valid'] is False


@pytest.mark.django_db
class TestFormVersioning:
    """Test form versioning"""
    
    def test_create_version_on_publish(self, authenticated_client, form):
        url = reverse('form-publish', args=[form.id])
        
        response = authenticated_client.post(url, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert FormVersion.objects.filter(form=form).exists()
        
        version = FormVersion.objects.get(form=form)
        assert version.version == 1
        assert version.schema == {
            'pages': form.pages,
            'logic': form.logic,
            'theme': form.theme,
            'settings': form.settings
        }