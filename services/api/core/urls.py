from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import OrganizationViewSet, SubmissionViewSet, download_file
from .auth_views import RegisterView, check_email, current_user, logout_view, password_reset_request, password_reset_confirm, verify_email, resend_verification_email
from .jwt_views import CustomTokenObtainPairView

router = DefaultRouter()
router.register(r"orgs", OrganizationViewSet, basename="organization")

# Nested routes for submissions
submissions_router = DefaultRouter()
submissions_router.register(r"submissions", SubmissionViewSet, basename="submission")

urlpatterns = [
    # Auth endpoints
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/signup/", RegisterView.as_view(), name="register"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/check-email/", check_email, name="check-email"),
    path("auth/me/", current_user, name="current-user"),
    path("auth/verify-email/", verify_email, name="verify-email"),
    path("auth/resend-verification/", resend_verification_email, name="resend-verification"),
    path("auth/password-reset/request/", password_reset_request, name="password-reset-request"),
    path("auth/password-reset/confirm/", password_reset_confirm, name="password-reset-confirm"),
    
    # Storage endpoints
    path("storage/download/", download_file, name="download-file"),
    
    # Main routes
    path("", include(router.urls)),
    # Form routes are in forms.urls
]