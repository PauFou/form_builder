import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Organization, User
from forms.models import Form, FormVersion


@pytest.mark.django_db
class TestFormUnpublishEndpoint:
    """Test the form unpublish endpoint"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def test_user(self, db):
        return User.objects.create_user(
            username="test@example.com",
            email="test@example.com",
            password="testpass123"
        )
    
    @pytest.fixture
    def test_org(self, db, test_user):
        org = Organization.objects.create(
            name="Test Organization",
            slug="test-org"
        )
        org.memberships.create(
            user=test_user,
            role="admin"
        )
        return org
    
    @pytest.fixture
    def published_form(self, db, test_org, test_user):
        form = Form.objects.create(
            organization=test_org,
            title="Test Form",
            slug="test-form",
            status="published",
            created_by=test_user
        )
        
        # Create published version
        FormVersion.objects.create(
            form=form,
            version=1,
            schema={"blocks": []},
            published_at=timezone.now(),
            canary_percentage=50
        )
        
        return form
    
    @pytest.fixture
    def draft_form(self, db, test_org, test_user):
        form = Form.objects.create(
            organization=test_org,
            title="Draft Form",
            slug="draft-form",
            status="draft",
            created_by=test_user
        )
        
        FormVersion.objects.create(
            form=form,
            version=1,
            schema={"blocks": []}
        )
        
        return form
    
    def test_unpublish_published_form(self, api_client, test_user, published_form):
        """Test unpublishing a published form"""
        api_client.force_authenticate(user=test_user)
        
        url = reverse("form-unpublish", kwargs={"id": published_form.id})
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "draft"
        
        # Verify form status changed
        published_form.refresh_from_db()
        assert published_form.status == "draft"
        
        # Verify version was unpublished
        version = published_form.versions.first()
        assert version.published_at is None
        assert version.canary_percentage == 0
    
    def test_unpublish_all_versions(self, api_client, test_user, published_form):
        """Test unpublishing all versions of a form"""
        # Create another published version
        FormVersion.objects.create(
            form=published_form,
            version=2,
            schema={"blocks": []},
            published_at=timezone.now(),
            canary_percentage=100
        )
        
        api_client.force_authenticate(user=test_user)
        
        url = reverse("form-unpublish", kwargs={"id": published_form.id})
        response = api_client.post(url, {"unpublish_all_versions": True})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "All versions unpublished"
        
        # Verify all versions were unpublished
        for version in published_form.versions.all():
            assert version.published_at is None
            assert version.canary_percentage == 0
    
    def test_unpublish_draft_form_fails(self, api_client, test_user, draft_form):
        """Test unpublishing a draft form returns error"""
        api_client.force_authenticate(user=test_user)
        
        url = reverse("form-unpublish", kwargs={"id": draft_form.id})
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"] == "Form is not currently published"
    
    def test_unpublish_requires_authentication(self, api_client, published_form):
        """Test unpublishing requires authentication"""
        url = reverse("form-unpublish", kwargs={"id": published_form.id})
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_unpublish_requires_edit_permission(self, api_client, published_form):
        """Test unpublishing requires edit permission"""
        # Create a viewer user
        viewer = User.objects.create_user(
            username="viewer@example.com",
            email="viewer@example.com",
            password="viewerpass123"
        )
        published_form.organization.memberships.create(
            user=viewer,
            role="viewer"
        )
        
        api_client.force_authenticate(user=viewer)
        
        url = reverse("form-unpublish", kwargs={"id": published_form.id})
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN