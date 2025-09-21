from django.contrib import admin
from django.urls import path, include
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
    path("v1/submissions/", include("submissions.urls")),
    path("v1/", include("integrations.urls")),
    path("v1/", include("accounts.urls")),
    path("v1/gdpr/", include("gdpr.urls")),
    path("v1/analytics/", include("analytics.urls")),
    
    # Auth is included in core.urls
    
    # API Documentation
    path("v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("v1/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("v1/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]