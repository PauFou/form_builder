from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from core.models import Organization, Membership, Form
from core.permissions import IsOrganizationMember, IsOrganizationAdmin, IsOrganizationOwner, CanEditForm

User = get_user_model()


class PermissionsTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create users
        self.owner = User.objects.create_user('owner@example.com', 'owner', 'password')
        self.admin = User.objects.create_user('admin@example.com', 'admin', 'password')
        self.editor = User.objects.create_user('editor@example.com', 'editor', 'password')
        self.viewer = User.objects.create_user('viewer@example.com', 'viewer', 'password')
        self.outsider = User.objects.create_user('outsider@example.com', 'outsider', 'password')
        
        # Create organization
        self.org = Organization.objects.create(name='Test Org', slug='test-org')
        
        # Create memberships
        Membership.objects.create(user=self.owner, organization=self.org, role='owner')
        Membership.objects.create(user=self.admin, organization=self.org, role='admin')
        Membership.objects.create(user=self.editor, organization=self.org, role='editor')
        Membership.objects.create(user=self.viewer, organization=self.org, role='viewer')
        
        # Create form
        self.form = Form.objects.create(
            organization=self.org,
            title='Test Form',
            slug='test-form',
            created_by=self.owner
        )
    
    def test_is_organization_member_permission(self):
        """Test IsOrganizationMember permission"""
        permission = IsOrganizationMember()
        
        # All members should have access
        for user in [self.owner, self.admin, self.editor, self.viewer]:
            request = self.factory.get('/')
            request.user = user
            self.assertTrue(permission.has_object_permission(request, None, self.form))
        
        # Outsider should not have access
        request = self.factory.get('/')
        request.user = self.outsider
        self.assertFalse(permission.has_object_permission(request, None, self.form))
    
    def test_is_organization_admin_permission(self):
        """Test IsOrganizationAdmin permission"""
        permission = IsOrganizationAdmin()
        
        # Owner and admin should have access
        for user in [self.owner, self.admin]:
            request = self.factory.get('/')
            request.user = user
            self.assertTrue(permission.has_object_permission(request, None, self.org))
        
        # Editor and viewer should not have access
        for user in [self.editor, self.viewer, self.outsider]:
            request = self.factory.get('/')
            request.user = user
            self.assertFalse(permission.has_object_permission(request, None, self.org))
    
    def test_is_organization_owner_permission(self):
        """Test IsOrganizationOwner permission"""
        permission = IsOrganizationOwner()
        
        # Only owner should have access
        request = self.factory.get('/')
        request.user = self.owner
        self.assertTrue(permission.has_object_permission(request, None, self.org))
        
        # All others should not have access
        for user in [self.admin, self.editor, self.viewer, self.outsider]:
            request = self.factory.get('/')
            request.user = user
            self.assertFalse(permission.has_object_permission(request, None, self.org))
    
    def test_can_edit_form_permission(self):
        """Test CanEditForm permission"""
        permission = CanEditForm()
        
        # Owner, admin, and editor can edit
        for user in [self.owner, self.admin, self.editor]:
            request = self.factory.post('/')
            request.user = user
            self.assertTrue(permission.has_object_permission(request, None, self.form))
        
        # Viewer can only read
        request = self.factory.get('/')
        request.user = self.viewer
        self.assertTrue(permission.has_object_permission(request, None, self.form))
        
        request = self.factory.post('/')
        request.user = self.viewer
        self.assertFalse(permission.has_object_permission(request, None, self.form))
        
        # Outsider cannot access at all
        request = self.factory.get('/')
        request.user = self.outsider
        self.assertFalse(permission.has_object_permission(request, None, self.form))