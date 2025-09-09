from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, FormViewSet, FormVersionViewSet, SubmissionViewSet
from .auth_views import RegisterView, check_email, current_user

router = DefaultRouter()
router.register(r"orgs", OrganizationViewSet, basename="organization")
router.register(r"forms", FormViewSet, basename="form")

# Nested routes
forms_router = DefaultRouter()
forms_router.register(r"versions", FormVersionViewSet, basename="form-version")
forms_router.register(r"submissions", SubmissionViewSet, basename="submission")

urlpatterns = [
    # Auth endpoints
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/check-email/", check_email, name="check-email"),
    path("auth/me/", current_user, name="current-user"),
    
    # Main routes
    path("", include(router.urls)),
    path("forms/<uuid:form_id>/", include(forms_router.urls)),
]