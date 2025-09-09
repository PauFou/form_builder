from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, FormViewSet, FormVersionViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r"orgs", OrganizationViewSet, basename="organization")
router.register(r"forms", FormViewSet, basename="form")

# Nested routes
forms_router = DefaultRouter()
forms_router.register(r"versions", FormVersionViewSet, basename="form-version")
forms_router.register(r"submissions", SubmissionViewSet, basename="submission")

urlpatterns = [
    path("", include(router.urls)),
    path("forms/<slug:form_id>/", include(forms_router.urls)),
]