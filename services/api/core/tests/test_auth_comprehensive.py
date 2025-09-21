"""
Comprehensive authentication tests for the Forms Platform API.
Tests all auth endpoints with >80% coverage goal.
"""

import unittest
from unittest.mock import patch

from django.test import TestCase, TransactionTestCase
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from core.models import Organization, Membership

User = get_user_model()


class AuthenticationTestCase(TestCase):
    """Test case for authentication endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'organization_name': 'Test Organization'
        }
    
    def test_signup_success(self):
        """Test successful user registration."""
        response = self.client.post(
            reverse('register'),
            data=self.user_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('organization', response.data)
        
        # Verify user was created
        user = User.objects.get(email=self.user_data['email'])
        self.assertEqual(user.username, self.user_data['username'])
        
        # Verify organization was created
        org = Organization.objects.get(name=self.user_data['organization_name'])
        self.assertEqual(org.plan, 'free')
        
        # Verify membership was created
        membership = Membership.objects.get(user=user, organization=org)
        self.assertEqual(membership.role, 'owner')
    
    def test_signup_password_mismatch(self):
        """Test signup with mismatched passwords."""
        data = self.user_data.copy()
        data['password2'] = 'DifferentPass123!'
        
        response = self.client.post(
            reverse('register'),
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_signup_duplicate_email(self):
        """Test signup with existing email."""
        # Create a user first
        User.objects.create_user(
            username='existing',
            email=self.user_data['email'],
            password='password123'
        )
        
        response = self.client.post(
            reverse('register'),
            data=self.user_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_success(self):
        """Test successful login."""
        # Create user first
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        login_data = {
            'email': 'test@example.com',
            'password': 'StrongPass123!'
        }
        
        response = self.client.post(
            reverse('token_obtain_pair'),
            data=login_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify tokens are valid
        access_token = AccessToken(response.data['access'])
        self.assertEqual(access_token['user_id'], str(user.id))
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'WrongPassword123!'
        }
        
        response = self.client.post(
            reverse('token_obtain_pair'),
            data=login_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_refresh_token(self):
        """Test token refresh."""
        # Create user and get tokens
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        refresh = RefreshToken.for_user(user)
        
        response = self.client.post(
            reverse('token_refresh'),
            data={'refresh': str(refresh)},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_logout(self):
        """Test logout functionality."""
        # Create user and get tokens
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Set auth header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access)}')
        
        response = self.client.post(
            reverse('logout'),
            data={'refresh': str(refresh)},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_get_current_user(self):
        """Test getting current user info."""
        # Create user with organization
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        org = Organization.objects.create(
            name='Test Org',
            slug='test-org',
            plan='free'
        )
        
        Membership.objects.create(
            user=user,
            organization=org,
            role='owner'
        )
        
        # Get token
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Set auth header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access)}')
        
        response = self.client.get(reverse('current-user'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], user.email)
        self.assertEqual(len(response.data['organizations']), 1)
        self.assertEqual(response.data['organizations'][0]['role'], 'owner')
    
    def test_check_email_exists(self):
        """Test email existence check."""
        User.objects.create_user(
            username='existing',
            email='existing@example.com',
            password='password123'
        )
        
        response = self.client.get(
            reverse('check-email'),
            {'email': 'existing@example.com'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['exists'])
        
        # Test non-existent email
        response = self.client.get(
            reverse('check-email'),
            {'email': 'new@example.com'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['exists'])
    
    @patch('core.auth_views.send_mail')
    def test_password_reset_request(self, mock_send_mail):
        """Test password reset request."""
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        mock_send_mail.return_value = True
        
        response = self.client.post(
            reverse('password-reset-request'),
            data={'email': 'test@example.com'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify email was called
        mock_send_mail.assert_called_once()
        
    def test_password_reset_request_nonexistent_email(self):
        """Test password reset for non-existent email (should still return success)."""
        response = self.client.post(
            reverse('password-reset-request'),
            data={'email': 'nonexistent@example.com'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_password_reset_confirm(self):
        """Test password reset confirmation."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='OldPass123!'
        )
        
        # Generate token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        response = self.client.post(
            reverse('password-reset-confirm'),
            data={
                'token': token,
                'uid': uid,
                'password': 'NewPass123!'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify password was changed
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewPass123!'))
    
    def test_password_reset_invalid_token(self):
        """Test password reset with invalid token."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='OldPass123!'
        )
        
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        response = self.client.post(
            reverse('password-reset-confirm'),
            data={
                'token': 'invalid-token',
                'uid': uid,
                'password': 'NewPass123!'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class RateLimitTestCase(TransactionTestCase):
    """Test rate limiting on auth endpoints."""
    
    def setUp(self):
        self.client = APIClient()
    
    @pytest.mark.skip(reason="Rate limiting tests are flaky in CI")
    @unittest.skip("Rate limiting disabled in test settings")
    def test_login_rate_limit(self):
        """Test rate limiting on login endpoint."""
        # Create a user
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        login_data = {
            'email': 'test@example.com',
            'password': 'WrongPassword'
        }
        
        # Make requests up to the limit
        for i in range(5):
            response = self.client.post(
                reverse('token_obtain_pair'),
                data=login_data,
                format='json'
            )
            # First 5 should fail with 401 (wrong password)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # The 6th request should be rate limited
        response = self.client.post(
            reverse('token_obtain_pair'),
            data=login_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
    
    @pytest.mark.skip(reason="Rate limiting tests are flaky in CI")
    @unittest.skip("Rate limiting disabled in test settings")
    def test_signup_rate_limit(self):
        """Test rate limiting on signup endpoint."""
        # Make requests with different emails
        for i in range(10):
            response = self.client.post(
                reverse('register'),
                data={
                    'username': f'user{i}',
                    'email': f'test{i}@example.com',
                    'password': 'StrongPass123!',
                    'password2': 'StrongPass123!',
                    'organization_name': f'Org {i}'
                },
                format='json'
            )
            # First 10 should succeed
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # The 11th request should be rate limited
        response = self.client.post(
            reverse('register'),
            data={
                'username': 'user11',
                'email': 'test11@example.com',
                'password': 'StrongPass123!',
                'password2': 'StrongPass123!',
                'organization_name': 'Org 11'
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class TokenBlacklistTestCase(TestCase):
    """Test token blacklist functionality."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
    
    def test_token_blacklist_after_logout(self):
        """Test that tokens are blacklisted after logout."""
        refresh = RefreshToken.for_user(self.user)
        access = refresh.access_token
        
        # Use token before logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access)}')
        response = self.client.get(reverse('current-user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Logout
        response = self.client.post(
            reverse('logout'),
            data={'refresh': str(refresh)},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Try to use the refresh token again
        response = self.client.post(
            reverse('token_refresh'),
            data={'refresh': str(refresh)},
            format='json'
        )
        # Should fail because token is blacklisted
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthSerializerTestCase(TestCase):
    """Test authentication serializers."""
    
    def test_register_serializer_validation(self):
        """Test RegisterSerializer validation."""
        from core.serializers import RegisterSerializer
        
        # Valid data
        valid_data = {
            'username': 'testuser',
            'email': 'Test@Example.com',  # Mixed case
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        serializer = RegisterSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        # Email should be lowercased
        self.assertEqual(serializer.validated_data['email'], 'test@example.com')
        
        # Test password validation
        invalid_data = valid_data.copy()
        invalid_data['password'] = 'weak'
        serializer = RegisterSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        
        # Test password mismatch
        invalid_data = valid_data.copy()
        invalid_data['password2'] = 'DifferentPass123!'
        serializer = RegisterSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())