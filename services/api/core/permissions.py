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
    
    def has_permission(self, request, view):
        """Check permission at the view level"""
        if not request.user.is_authenticated:
            return False
        
        # For create operations, check organization_id in request
        if request.method == 'POST' and 'organization_id' in request.data:
            org_id = request.data.get('organization_id')
            membership = Membership.objects.filter(
                user=request.user,
                organization_id=org_id
            ).first()
            
            if not membership:
                return False
            
            # Need editor role or above to create forms
            return membership.role in ['owner', 'admin', 'editor']
        
        # For other operations, defer to object-level permission
        return True
    
    def has_object_permission(self, request, view, obj):
        form = obj if hasattr(obj, 'organization') else obj.form
        
        # Check if user is member of organization
        membership = Membership.objects.filter(
            user=request.user,
            organization=form.organization
        ).first()
        
        if not membership:
            return False
            
        # For read operations, any member can access
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For write operations, need editor role or above
        return membership.role in ['owner', 'admin', 'editor']


class IsOwner(permissions.BasePermission):
    """Check if user owns the object"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the object has a created_by field
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        # Check if the object has a user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False