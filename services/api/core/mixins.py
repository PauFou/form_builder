from rest_framework.response import Response
from rest_framework import status


class AuditMixin:
    """Mixin to inject current user for audit logging"""
    
    def perform_create(self, serializer):
        instance = serializer.save()
        if hasattr(instance, '_current_user'):
            instance._current_user = self.request.user
        return instance
    
    def perform_update(self, serializer):
        instance = serializer.save()
        if hasattr(instance, '_current_user'):
            instance._current_user = self.request.user
        return instance
    
    def perform_destroy(self, instance):
        if hasattr(instance, '_current_user'):
            instance._current_user = self.request.user
        instance.delete()


class BulkCreateMixin:
    """Mixin for bulk create operations"""
    
    def create(self, request, *args, **kwargs):
        is_many = isinstance(request.data, list)
        
        if not is_many:
            return super().create(request, *args, **kwargs)
        
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )