from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from .serializers import UserSerializer, RegisterSerializer
from .models import Organization, Membership

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Create default organization for the user
        org_name = request.data.get('organization_name', f"{user.username}'s Organization")
        org_slug = org_name.lower().replace(' ', '-').replace("'", '')
        
        # Ensure unique slug
        base_slug = org_slug
        counter = 1
        while Organization.objects.filter(slug=org_slug).exists():
            org_slug = f"{base_slug}-{counter}"
            counter += 1
        
        organization = Organization.objects.create(
            name=org_name,
            slug=org_slug,
            plan='free'
        )
        
        # Create membership
        Membership.objects.create(
            user=user,
            organization=organization,
            role='owner'
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'organization': {
                'id': str(organization.id),
                'name': organization.name,
                'slug': organization.slug
            }
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    parameters=[
        OpenApiParameter(
            name='email',
            description='Email address to check',
            required=True,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
        )
    ],
    responses={
        200: OpenApiResponse(
            response={'type': 'object', 'properties': {'exists': {'type': 'boolean'}}},
            description='Email existence check result'
        ),
        400: OpenApiResponse(
            response={'type': 'object', 'properties': {'error': {'type': 'string'}}},
            description='Bad request - email parameter missing'
        ),
    },
    description='Check if email is already registered',
    tags=['Authentication']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def check_email(request):
    """Check if email is already registered"""
    email = request.query_params.get('email', '').lower()
    
    if not email:
        return Response(
            {'error': 'Email parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    exists = User.objects.filter(email=email).exists()
    return Response({'exists': exists})


@extend_schema(
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'user': {'$ref': '#/components/schemas/User'},
                    'organizations': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'string', 'format': 'uuid'},
                                'name': {'type': 'string'},
                                'slug': {'type': 'string'},
                                'role': {'type': 'string', 'enum': ['owner', 'admin', 'member', 'viewer']}
                            }
                        }
                    }
                }
            },
            description='Current user information with organizations'
        )
    },
    description='Get current user info with organizations',
    tags=['Authentication']
)
@api_view(['GET'])
@permission_classes([])
def current_user(request):
    """Get current user info with organizations"""
    serializer = UserSerializer(request.user)
    
    memberships = Membership.objects.filter(
        user=request.user
    ).select_related('organization')
    
    organizations = [
        {
            'id': str(m.organization.id),
            'name': m.organization.name,
            'slug': m.organization.slug,
            'role': m.role
        }
        for m in memberships
    ]
    
    return Response({
        'user': serializer.data,
        'organizations': organizations
    })