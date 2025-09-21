from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer
from .models import Membership

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns user and organization data along with tokens
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get the user from email
            email = request.data.get('email', '').lower()
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(email=email)
                
                # Get user's primary organization
                membership = Membership.objects.filter(
                    user=user
                ).select_related('organization').first()
                
                organization_data = None
                if membership:
                    organization_data = {
                        'id': str(membership.organization.id),
                        'name': membership.organization.name,
                        'slug': membership.organization.slug,
                        'plan': membership.organization.plan
                    }
                
                # Add user and organization to response
                response.data['user'] = UserSerializer(user).data
                response.data['organization'] = organization_data
                
            except User.DoesNotExist:
                pass
                
        return response