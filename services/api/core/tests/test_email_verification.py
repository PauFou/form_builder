"""
Tests for email verification functionality.
"""

import json
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
import pytest

from core.models import Organization, Membership, EmailVerificationToken

User = get_user_model()


class EmailVerificationTestCase(TestCase):
    """Test case for email verification functionality."""
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'organization_name': 'Test Organization'
        }
    
    @patch('core.auth_views.send_mail')
    def test_signup_sends_verification_email(self, mock_send_mail):
        """Test that signup sends verification email."""
        mock_send_mail.return_value = True
        
        response = self.client.post(
            reverse('register'),
            data=self.user_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'Please check your email to verify your account.')
        
        # Verify email was sent
        mock_send_mail.assert_called_once()
        call_args = mock_send_mail.call_args
        # Check positional and keyword arguments
        self.assertEqual(call_args.kwargs['recipient_list'], [self.user_data['email']])
        self.assertEqual(call_args.kwargs['subject'], 'Verify your email address')
        self.assertIn('verify-email', call_args.kwargs['message'])  # Body contains verification link
        
        # Verify token was created
        user = User.objects.get(email=self.user_data['email'])
        token = EmailVerificationToken.objects.get(user=user)
        self.assertIsNotNone(token)
        self.assertFalse(user.verified_at)  # User not verified yet
    
    def test_verify_email_success(self):
        """Test successful email verification."""
        # Create user and token
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        token = EmailVerificationToken.create_for_user(user)
        
        response = self.client.post(
            reverse('verify-email'),
            data={'token': token.token},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Email verified successfully. You can now login.')
        
        # Verify user is marked as verified
        user.refresh_from_db()
        self.assertIsNotNone(user.verified_at)
        
        # Verify token is marked as used
        token.refresh_from_db()
        self.assertIsNotNone(token.used_at)
    
    def test_verify_email_with_query_param(self):
        """Test email verification with token in query parameter."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        token = EmailVerificationToken.create_for_user(user)
        
        response = self.client.post(
            f"{reverse('verify-email')}?token={token.token}",
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_verify_email_invalid_token(self):
        """Test email verification with invalid token."""
        response = self.client.post(
            reverse('verify-email'),
            data={'token': 'invalid-token'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Invalid token')
    
    def test_verify_email_expired_token(self):
        """Test email verification with expired token."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        # Create token with past expiration
        token = EmailVerificationToken.objects.create(
            user=user,
            token='test-token',
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        response = self.client.post(
            reverse('verify-email'),
            data={'token': token.token},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Token is invalid or expired')
    
    def test_verify_email_already_used_token(self):
        """Test email verification with already used token."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        token = EmailVerificationToken.create_for_user(user)
        token.used_at = timezone.now()
        token.save()
        
        response = self.client.post(
            reverse('verify-email'),
            data={'token': token.token},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Token is invalid or expired')
    
    def test_verify_email_missing_token(self):
        """Test email verification without token."""
        response = self.client.post(
            reverse('verify-email'),
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Token is required')
    
    @pytest.mark.skip(reason="Rate limiting interferes with this test in CI")
    @patch('core.auth_views.send_mail')
    def test_resend_verification_email_success(self, mock_send_mail):
        """Test resending verification email."""
        mock_send_mail.return_value = True
        
        # Create unverified user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        # Create old token
        old_token = EmailVerificationToken.create_for_user(user)
        
        response = self.client.post(
            reverse('resend-verification'),
            data={'email': 'test@example.com'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify email was sent
        mock_send_mail.assert_called_once()
        
        # Verify old token was invalidated
        old_token.refresh_from_db()
        self.assertIsNotNone(old_token.used_at)
        
        # Verify new token was created
        new_tokens = EmailVerificationToken.objects.filter(
            user=user,
            used_at__isnull=True
        )
        self.assertEqual(new_tokens.count(), 1)
        self.assertNotEqual(new_tokens.first().token, old_token.token)
    
    def test_resend_verification_email_already_verified(self):
        """Test resending verification email for already verified user."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!',
            verified_at=timezone.now()
        )
        
        response = self.client.post(
            reverse('resend-verification'),
            data={'email': 'test@example.com'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Email is already verified')
    
    def test_resend_verification_email_nonexistent_user(self):
        """Test resending verification email for non-existent user."""
        response = self.client.post(
            reverse('resend-verification'),
            data={'email': 'nonexistent@example.com'},
            format='json'
        )
        
        # Should return success to prevent email enumeration
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('If the email exists', response.data['message'])
    
    def test_resend_verification_email_missing_email(self):
        """Test resending verification email without email."""
        response = self.client.post(
            reverse('resend-verification'),
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Email is required')
    
    def test_token_is_valid_method(self):
        """Test EmailVerificationToken.is_valid() method."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        # Valid token
        valid_token = EmailVerificationToken.create_for_user(user)
        self.assertTrue(valid_token.is_valid())
        
        # Expired token
        expired_token = EmailVerificationToken.objects.create(
            user=user,
            token='expired-token',
            expires_at=timezone.now() - timedelta(hours=1)
        )
        self.assertFalse(expired_token.is_valid())
        
        # Used token
        used_token = EmailVerificationToken.create_for_user(user)
        used_token.used_at = timezone.now()
        used_token.save()
        self.assertFalse(used_token.is_valid())
    
    def test_create_for_user_method(self):
        """Test EmailVerificationToken.create_for_user() method."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass123!'
        )
        
        token = EmailVerificationToken.create_for_user(user)
        
        self.assertEqual(token.user, user)
        self.assertIsNotNone(token.token)
        self.assertTrue(len(token.token) > 20)  # Reasonable length for URL-safe token
        self.assertIsNone(token.used_at)
        
        # Token should expire in 24 hours
        time_diff = token.expires_at - timezone.now()
        self.assertAlmostEqual(
            time_diff.total_seconds(),
            timedelta(hours=24).total_seconds(),
            delta=60  # Within 1 minute
        )