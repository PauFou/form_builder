from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization, Membership

User = get_user_model()


class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
    def test_user_registration(self):
        """Test user registration creates user and organization"""
        data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'organization_name': 'Test Organization'
        }
        
        response = self.client.post('/v1/auth/signup/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
        self.assertIn('organization', response.data)
        
        # Check user was created
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.username, 'testuser')
        
        # Check organization was created
        org = Organization.objects.get(slug='test-organization')
        self.assertEqual(org.name, 'Test Organization')
        
        # Check membership was created
        membership = Membership.objects.get(user=user, organization=org)
        self.assertEqual(membership.role, 'owner')
    
    def test_email_check(self):
        """Test email availability check"""
        User.objects.create_user(
            email='existing@example.com',
            username='existing',
            password='password'
        )
        
        # Check existing email
        response = self.client.get('/v1/auth/check-email/?email=existing@example.com')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['exists'])
        
        # Check non-existing email
        response = self.client.get('/v1/auth/check-email/?email=new@example.com')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['exists'])
    
    def test_login(self):
        """Test JWT login"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        
        response = self.client.post('/v1/auth/login/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_current_user(self):
        """Test getting current user info"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        org = Organization.objects.create(
            name='Test Org',
            slug='test-org'
        )
        
        Membership.objects.create(
            user=user,
            organization=org,
            role='owner'
        )
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get('/v1/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(len(response.data['organizations']), 1)
        self.assertEqual(response.data['organizations'][0]['role'], 'owner')