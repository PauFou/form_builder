from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Organization, Form, FormVersion, Submission
from .serializers import (
    OrganizationSerializer, FormSerializer, FormVersionSerializer,
    SubmissionSerializer, FormImportSerializer
)


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(
            memberships__user=self.request.user
        ).distinct()


class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "slug"
    
    def get_queryset(self):
        return self.queryset.filter(
            organization__memberships__user=self.request.user
        ).distinct()
    
    def perform_create(self, serializer):
        org_id = self.request.data.get("organization_id")
        organization = get_object_or_404(
            Organization,
            id=org_id,
            memberships__user=self.request.user
        )
        serializer.save(organization=organization, created_by=self.request.user)
    
    @action(detail=True, methods=["post"])
    def publish(self, request, slug=None):
        form = self.get_object()
        version_id = request.data.get("version_id")
        canary_percent = request.data.get("canary_percent", 0)
        
        version = get_object_or_404(FormVersion, id=version_id, form=form)
        version.published_at = timezone.now()
        version.canary_percent = canary_percent
        version.save()
        
        form.status = "published"
        form.save()
        
        return Response({"status": "published"})
    
    @action(detail=True, methods=["post"])
    def import_form(self, request, slug=None):
        form = self.get_object()
        serializer = FormImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # TODO: Implement import logic
        return Response({"status": "imported"})


class FormVersionViewSet(viewsets.ModelViewSet):
    queryset = FormVersion.objects.all()
    serializer_class = FormVersionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        form_id = self.kwargs.get("form_id")
        return self.queryset.filter(
            form_id=form_id,
            form__organization__memberships__user=self.request.user
        )
    
    def perform_create(self, serializer):
        form_id = self.kwargs.get("form_id")
        form = get_object_or_404(
            Form,
            id=form_id,
            organization__memberships__user=self.request.user
        )
        last_version = form.versions.first()
        new_version = (last_version.version + 1) if last_version else 1
        serializer.save(form=form, version=new_version)


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["completed_at", "locale"]
    search_fields = ["respondent_key", "metadata_json"]
    
    def get_queryset(self):
        form_id = self.kwargs.get("form_id")
        return self.queryset.filter(
            form_id=form_id,
            form__organization__memberships__user=self.request.user
        )
    
    @action(detail=False, methods=["post"])
    def export(self, request, form_id=None):
        queryset = self.filter_queryset(self.get_queryset())
        format = request.data.get("format", "csv")
        
        # TODO: Implement export logic
        return Response({"url": "export_url_here"})