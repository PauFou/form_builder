from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from .serializers import UserSerializer, RegisterSerializer
from .models import Organization, Membership
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


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


@extend_schema(
    request={
        'type': 'object',
        'properties': {
            'refresh': {'type': 'string', 'description': 'Refresh token to blacklist'}
        },
        'required': ['refresh']
    },
    responses={
        200: OpenApiResponse(
            response={'type': 'object', 'properties': {'success': {'type': 'boolean'}}},
            description='Logout successful'
        ),
        400: OpenApiResponse(
            response={'type': 'object', 'properties': {'error': {'type': 'string'}}},
            description='Invalid token'
        ),
    },
    description='Logout user by blacklisting refresh token',
    tags=['Authentication']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user by blacklisting refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({'success': True})
    except TokenError:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(
    request={
        'type': 'object',
        'properties': {
            'email': {'type': 'string', 'format': 'email', 'description': 'Email address to send reset link'}
        },
        'required': ['email']
    },
    responses={
        200: OpenApiResponse(
            response={'type': 'object', 'properties': {
                'success': {'type': 'boolean'},
                'message': {'type': 'string'}
            }},
            description='Password reset email sent'
        ),
        400: OpenApiResponse(
            response={'type': 'object', 'properties': {'error': {'type': 'string'}}},
            description='Invalid email'
        ),
    },
    description='Request password reset link',
    tags=['Authentication']
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """Request password reset link"""
    email = request.data.get('email', '').lower()
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        
        # Generate token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Build reset URL
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}&uid={uid}"
        
        # Send email
        send_mail(
            'Password Reset Request',
            f'Click the following link to reset your password: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        logger.info(f"Password reset requested for {email}")
        
    except User.DoesNotExist:
        # Don't reveal if user exists or not
        logger.warning(f"Password reset requested for non-existent email: {email}")
    
    # Always return success to prevent email enumeration
    return Response({
        'success': True,
        'message': 'If the email exists, a password reset link has been sent.'
    })


@extend_schema(
    request={
        'type': 'object',
        'properties': {
            'token': {'type': 'string', 'description': 'Password reset token'},
            'uid': {'type': 'string', 'description': 'User ID'},
            'password': {'type': 'string', 'description': 'New password'}
        },
        'required': ['token', 'uid', 'password']
    },
    responses={
        200: OpenApiResponse(
            response={'type': 'object', 'properties': {
                'success': {'type': 'boolean'},
                'message': {'type': 'string'}
            }},
            description='Password reset successful'
        ),
        400: OpenApiResponse(
            response={'type': 'object', 'properties': {'error': {'type': 'string'}}},
            description='Invalid token or password'
        ),
    },
    description='Confirm password reset with token',
    tags=['Authentication']
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Confirm password reset with token"""
    token = request.data.get('token')
    uid = request.data.get('uid')
    password = request.data.get('password')
    
    if not all([token, uid, password]):
        return Response(
            {'error': 'Token, uid, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Decode user id
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        
        # Check token
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        if len(password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(password)
        user.save()
        
        logger.info(f"Password reset successful for user {user.email}")
        
        return Response({
            'success': True,
            'message': 'Password has been reset successfully'
        })
        
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )