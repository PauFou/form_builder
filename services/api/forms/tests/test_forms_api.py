"""
Comprehensive API tests for Forms endpoints

Tests cover:
- CRUD operations
- Permissions & authorization
- Form publishing/unpublishing
- Form duplication
- Validation
- Edge cases
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization, Membership
from forms.models import Form, FormVersion

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User"
    )


@pytest.fixture
def organization(db, user):
    org = Organization.objects.create(
        name="Test Organization",
        slug="test-org"
    )
    Membership.objects.create(
        user=user,
        organization=org,
        role="owner"
    )
    return org


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def form_data(organization):
    return {
        "organization_id": str(organization.id),
        "title": "Test Form",
        "description": "Test form description",
        "status": "draft"
    }


@pytest.mark.django_db
class TestFormListAPI:
    """Test GET /api/v1/forms"""

    def test_list_forms_unauthenticated(self, api_client):
        """Unauthenticated users cannot list forms"""
        response = api_client.get("/api/v1/forms/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_forms_authenticated(self, authenticated_client, organization, user):
        """Authenticated users can list their organization's forms"""
        # Create test forms
        Form.objects.create(
            organization=organization,
            title="Form 1",
            created_by=user
        )
        Form.objects.create(
            organization=organization,
            title="Form 2",
            created_by=user
        )

        response = authenticated_client.get("/api/v1/forms/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2

    def test_list_forms_filtered_by_organization(self, authenticated_client, organization, user):
        """Users only see forms from their organizations"""
        # Create form in user's org
        Form.objects.create(
            organization=organization,
            title="My Form",
            created_by=user
        )

        # Create form in another org
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        Form.objects.create(
            organization=other_org,
            title="Other Form",
            created_by=user
        )

        response = authenticated_client.get("/api/v1/forms/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "My Form"


@pytest.mark.django_db
class TestFormCreateAPI:
    """Test POST /api/v1/forms"""

    def test_create_form_unauthenticated(self, api_client, form_data):
        """Unauthenticated users cannot create forms"""
        response = api_client.post("/api/v1/forms/", form_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_form_authenticated(self, authenticated_client, form_data, organization):
        """Authenticated users can create forms in their organization"""
        response = authenticated_client.post("/api/v1/forms/", form_data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Test Form"
        assert response.data["status"] == "draft"

        # Verify form was created in database
        form = Form.objects.get(id=response.data["id"])
        assert form.organization == organization
        assert form.pages is not None
        assert len(form.pages) == 1  # Should create default page

    def test_create_form_auto_generates_slug(self, authenticated_client, form_data):
        """System auto-generates slug if not provided"""
        response = authenticated_client.post("/api/v1/forms/", form_data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["slug"] is not None
        assert "test-form" in response.data["slug"]

    def test_create_form_creates_first_version(self, authenticated_client, form_data):
        """Creating a form also creates version 1"""
        response = authenticated_client.post("/api/v1/forms/", form_data)
        assert response.status_code == status.HTTP_201_CREATED

        form = Form.objects.get(id=response.data["id"])
        versions = FormVersion.objects.filter(form=form)
        assert versions.count() == 1
        assert versions.first().version == 1

    def test_create_form_without_organization(self, authenticated_client):
        """Cannot create form without organization_id"""
        data = {"title": "Test Form"}
        response = authenticated_client.post("/api/v1/forms/", data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_form_in_unauthorized_organization(self, authenticated_client):
        """Cannot create form in organization user doesn't belong to"""
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        data = {
            "organization_id": str(other_org.id),
            "title": "Test Form"
        }
        response = authenticated_client.post("/api/v1/forms/", data)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestFormRetrieveAPI:
    """Test GET /api/v1/forms/{id}"""

    def test_retrieve_form(self, authenticated_client, organization, user):
        """Users can retrieve their own forms"""
        form = Form.objects.create(
            organization=organization,
            title="Test Form",
            description="Description",
            created_by=user
        )

        response = authenticated_client.get(f"/api/v1/forms/{form.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Test Form"
        assert response.data["description"] == "Description"

    def test_retrieve_nonexistent_form(self, authenticated_client):
        """Returns 404 for nonexistent form"""
        response = authenticated_client.get("/api/v1/forms/nonexistent-id/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_unauthorized_form(self, authenticated_client, user):
        """Cannot retrieve forms from other organizations"""
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        form = Form.objects.create(
            organization=other_org,
            title="Other Form",
            created_by=user
        )

        response = authenticated_client.get(f"/api/v1/forms/{form.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestFormUpdateAPI:
    """Test PUT/PATCH /api/v1/forms/{id}"""

    def test_update_form(self, authenticated_client, organization, user):
        """Users can update their forms"""
        form = Form.objects.create(
            organization=organization,
            title="Original Title",
            created_by=user
        )

        update_data = {"title": "Updated Title"}
        response = authenticated_client.patch(f"/api/v1/forms/{form.id}/", update_data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated Title"

        form.refresh_from_db()
        assert form.title == "Updated Title"

    def test_update_form_pages(self, authenticated_client, organization, user):
        """Users can update form pages"""
        form = Form.objects.create(
            organization=organization,
            title="Test Form",
            pages=[{"id": "page-1", "title": "Page 1", "blocks": []}],
            created_by=user
        )

        new_pages = [
            {"id": "page-1", "title": "Updated Page", "blocks": []},
            {"id": "page-2", "title": "New Page", "blocks": []}
        ]
        update_data = {"pages": new_pages}

        response = authenticated_client.patch(f"/api/v1/forms/{form.id}/", update_data)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["pages"]) == 2


@pytest.mark.django_db
class TestFormDeleteAPI:
    """Test DELETE /api/v1/forms/{id}"""

    def test_delete_form(self, authenticated_client, organization, user):
        """Users can delete their forms"""
        form = Form.objects.create(
            organization=organization,
            title="Form to Delete",
            created_by=user
        )

        response = authenticated_client.delete(f"/api/v1/forms/{form.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify form was deleted
        assert not Form.objects.filter(id=form.id).exists()


@pytest.mark.django_db
class TestFormPublishAPI:
    """Test POST /api/v1/forms/{id}/publish"""

    def test_publish_form(self, authenticated_client, organization, user):
        """Users can publish their forms"""
        form = Form.objects.create(
            organization=organization,
            title="Test Form",
            status="draft",
            created_by=user
        )
        FormVersion.objects.create(
            form=form,
            version=1,
            schema={"blocks": []}
        )

        response = authenticated_client.post(f"/api/v1/forms/{form.id}/publish/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "published"

        form.refresh_from_db()
        assert form.status == "published"

    def test_publish_form_with_canary(self, authenticated_client, organization, user):
        """Can publish form with canary percentage"""
        form = Form.objects.create(
            organization=organization,
            title="Test Form",
            status="draft",
            created_by=user
        )
        FormVersion.objects.create(
            form=form,
            version=1,
            schema={"blocks": []}
        )

        data = {"canary_percentage": 10}
        response = authenticated_client.post(f"/api/v1/forms/{form.id}/publish/", data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["canary_percentage"] == 10

    def test_publish_form_without_version(self, authenticated_client, organization, user):
        """Cannot publish form without versions"""
        form = Form.objects.create(
            organization=organization,
            title="Test Form",
            status="draft",
            created_by=user
        )

        response = authenticated_client.post(f"/api/v1/forms/{form.id}/publish/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestFormUnpublishAPI:
    """Test POST /api/v1/forms/{id}/unpublish"""

    def test_unpublish_form(self, authenticated_client, organization, user):
        """Users can unpublish their forms"""
        form = Form.objects.create(
            organization=organization,
            title="Test Form",
            status="published",
            created_by=user
        )

        response = authenticated_client.post(f"/api/v1/forms/{form.id}/unpublish/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "draft"

        form.refresh_from_db()
        assert form.status == "draft"


@pytest.mark.django_db
class TestFormDuplicateAPI:
    """Test POST /api/v1/forms/{id}/duplicate"""

    def test_duplicate_form(self, authenticated_client, organization, user):
        """Users can duplicate their forms"""
        original_form = Form.objects.create(
            organization=organization,
            title="Original Form",
            description="Test description",
            pages=[{"id": "page-1", "title": "Page 1", "blocks": []}],
            created_by=user
        )

        response = authenticated_client.post(f"/api/v1/forms/{original_form.id}/duplicate/")
        assert response.status_code == status.HTTP_201_CREATED
        assert "Copy" in response.data["title"]
        assert response.data["status"] == "draft"

        # Verify new form was created
        new_form = Form.objects.get(id=response.data["id"])
        assert new_form.id != original_form.id
        assert new_form.pages == original_form.pages


@pytest.mark.django_db
class TestFormSearchAndFilter:
    """Test form search and filtering"""

    def test_search_forms_by_title(self, authenticated_client, organization, user):
        """Can search forms by title"""
        Form.objects.create(
            organization=organization,
            title="Contact Form",
            created_by=user
        )
        Form.objects.create(
            organization=organization,
            title="Feedback Survey",
            created_by=user
        )

        response = authenticated_client.get("/api/v1/forms/?search=Contact")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Contact Form"

    def test_filter_forms_by_status(self, authenticated_client, organization, user):
        """Can filter forms by status"""
        Form.objects.create(
            organization=organization,
            title="Draft Form",
            status="draft",
            created_by=user
        )
        Form.objects.create(
            organization=organization,
            title="Published Form",
            status="published",
            created_by=user
        )

        response = authenticated_client.get("/api/v1/forms/?status=published")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["status"] == "published"

    def test_order_forms_by_created_date(self, authenticated_client, organization, user):
        """Can order forms by creation date"""
        form1 = Form.objects.create(
            organization=organization,
            title="First Form",
            created_by=user
        )
        form2 = Form.objects.create(
            organization=organization,
            title="Second Form",
            created_by=user
        )

        response = authenticated_client.get("/api/v1/forms/?ordering=-created_at")
        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert results[0]["title"] == "Second Form"
        assert results[1]["title"] == "First Form"
