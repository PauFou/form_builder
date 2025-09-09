from rest_framework import permissions
from .models import Membership


class IsOrganizationMember(permissions.BasePermission):
    """Check if user is a member of the organization"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        org_id = view.kwargs.get('organization_id') or request.data.get('organization_id')
        if not org_id:
            return True  # Let view handle missing org_id
            
        return Membership.objects.filter(
            user=request.user,
            organization_id=org_id
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'organization'):
            return Membership.objects.filter(
                user=request.user,
                organization=obj.organization
            ).exists()
        elif hasattr(obj, 'organization_id'):
            return Membership.objects.filter(
                user=request.user,
                organization_id=obj.organization_id
            ).exists()
        return False


class IsOrganizationAdmin(permissions.BasePermission):
    """Check if user has admin or owner role in the organization"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        org_id = view.kwargs.get('organization_id') or request.data.get('organization_id')
        if not org_id:
            return True
            
        return Membership.objects.filter(
            user=request.user,
            organization_id=org_id,
            role__in=['owner', 'admin']
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        org = obj.organization if hasattr(obj, 'organization') else obj
        return Membership.objects.filter(
            user=request.user,
            organization=org,
            role__in=['owner', 'admin']
        ).exists()


class IsOrganizationOwner(permissions.BasePermission):
    """Check if user is the owner of the organization"""
    
    def has_object_permission(self, request, view, obj):
        org = obj.organization if hasattr(obj, 'organization') else obj
        return Membership.objects.filter(
            user=request.user,
            organization=org,
            role='owner'
        ).exists()


class CanEditForm(permissions.BasePermission):
    """Check if user can edit forms (editor role or above)"""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
            
        form = obj if hasattr(obj, 'organization') else obj.form
        return Membership.objects.filter(
            user=request.user,
            organization=form.organization,
            role__in=['owner', 'admin', 'editor']
        ).exists()