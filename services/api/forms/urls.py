from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormViewSet

router = DefaultRouter()
router.register('forms', FormViewSet, basename='form')

urlpatterns = router.urls