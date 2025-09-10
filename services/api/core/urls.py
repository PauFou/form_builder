from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, SubmissionViewSet, download_file
from .auth_views import RegisterView, check_email, current_user

router = DefaultRouter()
router.register(r"orgs", OrganizationViewSet, basename="organization")

# Nested routes for submissions
submissions_router = DefaultRouter()
submissions_router.register(r"submissions", SubmissionViewSet, basename="submission")

urlpatterns = [
    # Auth endpoints
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/check-email/", check_email, name="check-email"),
    path("auth/me/", current_user, name="current-user"),
    
    # Storage endpoints
    path("storage/download/", download_file, name="download-file"),
    
    # Main routes
    path("", include(router.urls)),
    # Form routes are in forms.urls
]