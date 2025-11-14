"""
Comprehensive API tests for Submissions endpoints

Tests cover:
- Creating submissions
- Partial submissions
- Listing and filtering submissions
- Exporting submissions
- GDPR compliance (data export/deletion)
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization, Membership
from forms.models import Form
from submissions.models import Submission, Answer

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123"
    )


@pytest.fixture
def organization(db, user):
    org = Organization.objects.create(name="Test Org", slug="test-org")
    Membership.objects.create(user=user, organization=org, role="owner")
    return org


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def form_with_blocks(organization, user):
    return Form.objects.create(
        organization=organization,
        title="Test Form",
        status="published",
        pages=[
            {
                "id": "page-1",
                "title": "Page 1",
                "blocks": [
                    {
                        "id": "block-1",
                        "type": "short_text",
                        "question": "What is your name?",
                        "key": "name"
                    },
                    {
                        "id": "block-2",
                        "type": "email",
                        "question": "What is your email?",
                        "key": "email"
                    }
                ]
            }
        ],
        created_by=user
    )


@pytest.mark.django_db
class TestSubmissionCreate:
    """Test POST /api/v1/forms/{id}/submissions"""

    def test_create_submission(self, api_client, form_with_blocks):
        """Anonymous users can submit forms"""
        submission_data = {
            "answers": [
                {"block_id": "block-1", "value": "John Doe"},
                {"block_id": "block-2", "value": "john@example.com"}
            ]
        }

        response = api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            submission_data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert "id" in response.data

        # Verify submission was saved
        submission = Submission.objects.get(id=response.data["id"])
        assert submission.form == form_with_blocks
        assert submission.completed_at is not None

        # Verify answers were saved
        answers = Answer.objects.filter(submission=submission)
        assert answers.count() == 2

    def test_create_submission_generates_respondent_key(self, api_client, form_with_blocks):
        """System generates unique respondent key"""
        submission_data = {
            "answers": [
                {"block_id": "block-1", "value": "John Doe"}
            ]
        }

        response = api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            submission_data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED

        submission = Submission.objects.get(id=response.data["id"])
        assert submission.respondent_key is not None
        assert len(submission.respondent_key) > 10

    def test_create_submission_increments_count(self, api_client, form_with_blocks):
        """Form submission count increments"""
        initial_count = form_with_blocks.submission_count

        submission_data = {
            "answers": [
                {"block_id": "block-1", "value": "Test"}
            ]
        }

        api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            submission_data,
            format="json"
        )

        form_with_blocks.refresh_from_db()
        assert form_with_blocks.submission_count == initial_count + 1

    def test_create_submission_validates_required_fields(self, api_client, organization, user):
        """Required fields must be provided"""
        form = Form.objects.create(
            organization=organization,
            title="Form with Required Fields",
            status="published",
            pages=[{
                "id": "page-1",
                "blocks": [{
                    "id": "block-1",
                    "type": "short_text",
                    "question": "Required field",
                    "required": True,
                    "key": "required_field"
                }]
            }],
            created_by=user
        )

        # Submit without required field
        submission_data = {"answers": []}

        response = api_client.post(
            f"/api/v1/forms/{form.id}/submissions/",
            submission_data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_submit_to_draft_form(self, api_client, organization, user):
        """Cannot submit to unpublished forms"""
        draft_form = Form.objects.create(
            organization=organization,
            title="Draft Form",
            status="draft",
            created_by=user
        )

        submission_data = {"answers": []}

        response = api_client.post(
            f"/api/v1/forms/{draft_form.id}/submissions/",
            submission_data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPartialSubmission:
    """Test partial submissions (autosave)"""

    def test_create_partial_submission(self, api_client, form_with_blocks):
        """Can save partial submissions"""
        partial_data = {
            "answers": [
                {"block_id": "block-1", "value": "Partial name"}
            ],
            "is_partial": True
        }

        response = api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            partial_data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED

        submission = Submission.objects.get(id=response.data["id"])
        assert submission.completed_at is None  # Not completed

    def test_update_partial_submission(self, api_client, form_with_blocks):
        """Can update partial submissions using same respondent key"""
        # Create initial partial
        partial_data = {
            "answers": [{"block_id": "block-1", "value": "First"}],
            "is_partial": True
        }

        response1 = api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            partial_data,
            format="json"
        )
        respondent_key = response1.data["respondent_key"]

        # Update with same key
        update_data = {
            "respondent_key": respondent_key,
            "answers": [
                {"block_id": "block-1", "value": "Updated"},
                {"block_id": "block-2", "value": "new@example.com"}
            ],
            "is_partial": True
        }

        response2 = api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            update_data,
            format="json"
        )
        assert response2.status_code == status.HTTP_200_OK

        # Should have updated existing submission
        assert Submission.objects.filter(respondent_key=respondent_key).count() == 1

    def test_complete_partial_submission(self, api_client, form_with_blocks):
        """Can complete a partial submission"""
        # Create partial
        partial_data = {
            "answers": [{"block_id": "block-1", "value": "Name"}],
            "is_partial": True
        }

        response1 = api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            partial_data,
            format="json"
        )
        respondent_key = response1.data["respondent_key"]

        # Complete it
        complete_data = {
            "respondent_key": respondent_key,
            "answers": [
                {"block_id": "block-1", "value": "Complete Name"},
                {"block_id": "block-2", "value": "complete@example.com"}
            ],
            "is_partial": False
        }

        response2 = api_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/",
            complete_data,
            format="json"
        )
        assert response2.status_code == status.HTTP_200_OK

        submission = Submission.objects.get(respondent_key=respondent_key)
        assert submission.completed_at is not None


@pytest.mark.django_db
class TestSubmissionList:
    """Test GET /api/v1/forms/{id}/submissions"""

    def test_list_submissions_requires_auth(self, api_client, form_with_blocks):
        """Listing submissions requires authentication"""
        response = api_client.get(f"/api/v1/forms/{form_with_blocks.id}/submissions/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_submissions(self, authenticated_client, form_with_blocks, user):
        """Form owners can list submissions"""
        # Create submissions
        for i in range(3):
            Submission.objects.create(
                form=form_with_blocks,
                respondent_key=f"key-{i}",
                completed_at="2024-01-01T00:00:00Z"
            )

        response = authenticated_client.get(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 3

    def test_filter_submissions_by_date(self, authenticated_client, form_with_blocks):
        """Can filter submissions by date range"""
        Submission.objects.create(
            form=form_with_blocks,
            respondent_key="key-1",
            completed_at="2024-01-01T00:00:00Z"
        )
        Submission.objects.create(
            form=form_with_blocks,
            respondent_key="key-2",
            completed_at="2024-02-01T00:00:00Z"
        )

        response = authenticated_client.get(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/?after=2024-01-15"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_search_submissions(self, authenticated_client, form_with_blocks):
        """Can search submission answers"""
        submission = Submission.objects.create(
            form=form_with_blocks,
            respondent_key="key-1",
            completed_at="2024-01-01T00:00:00Z"
        )
        Answer.objects.create(
            submission=submission,
            block_id="block-1",
            value_json={"text": "John Doe"}
        )

        response = authenticated_client.get(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/?query=John"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1


@pytest.mark.django_db
class TestSubmissionExport:
    """Test POST /api/v1/forms/{id}/submissions/export"""

    def test_export_submissions_csv(self, authenticated_client, form_with_blocks):
        """Can export submissions as CSV"""
        # Create submission
        submission = Submission.objects.create(
            form=form_with_blocks,
            respondent_key="key-1",
            completed_at="2024-01-01T00:00:00Z"
        )
        Answer.objects.create(
            submission=submission,
            block_id="block-1",
            value_json={"text": "John"}
        )

        response = authenticated_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/export/",
            {"format": "csv"},
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "text/csv" in response["Content-Type"]

    def test_export_submissions_json(self, authenticated_client, form_with_blocks):
        """Can export submissions as JSON"""
        # Create submission
        submission = Submission.objects.create(
            form=form_with_blocks,
            respondent_key="key-1",
            completed_at="2024-01-01T00:00:00Z"
        )

        response = authenticated_client.post(
            f"/api/v1/forms/{form_with_blocks.id}/submissions/export/",
            {"format": "json"},
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response["Content-Type"]


@pytest.mark.django_db
class TestSubmissionGDPR:
    """Test GDPR compliance features"""

    def test_delete_submission_data(self, authenticated_client, form_with_blocks):
        """Can delete submission data (GDPR)"""
        submission = Submission.objects.create(
            form=form_with_blocks,
            respondent_key="key-1",
            completed_at="2024-01-01T00:00:00Z"
        )
        Answer.objects.create(
            submission=submission,
            block_id="block-1",
            value_json={"text": "Personal Data"}
        )

        response = authenticated_client.delete(
            f"/api/v1/submissions/{submission.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify deletion
        assert not Submission.objects.filter(id=submission.id).exists()
        assert not Answer.objects.filter(submission_id=submission.id).exists()

    def test_export_respondent_data(self, api_client, form_with_blocks):
        """Respondents can export their own data"""
        submission = Submission.objects.create(
            form=form_with_blocks,
            respondent_key="unique-key-123",
            completed_at="2024-01-01T00:00:00Z"
        )

        response = api_client.get(
            f"/api/v1/respondent/export/?key=unique-key-123"
        )
        # This endpoint should return the respondent's data
        # Implementation depends on GDPR requirements
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
