from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormViewSet, FormVersionViewSet

router = DefaultRouter()
router.register('forms', FormViewSet, basename='form')

# Nested routes
forms_router = DefaultRouter()
forms_router.register(r"versions", FormVersionViewSet, basename="form-version")

urlpatterns = [
    path("", include(router.urls)),
    path("forms/<uuid:form_id>/", include(forms_router.urls)),
]