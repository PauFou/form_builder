from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from core.health import health_check, ready_check

urlpatterns = [
    # Health checks
    path("health/", health_check, name="health-check"),
    path("ready/", ready_check, name="ready-check"),
    
    # Admin
    path("admin/", admin.site.urls),
    
    # API v1
    path("v1/", include("core.urls")),
    path("v1/", include("webhooks.urls")),
    path("v1/", include("forms.urls")),
    path("v1/", include("submissions.urls")),
    path("v1/", include("integrations.urls")),
    path("v1/", include("accounts.urls")),
    
    # Auth
    path("v1/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # API Documentation
    path("v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("v1/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("v1/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]