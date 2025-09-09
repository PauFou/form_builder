from rest_framework import serializers
from .models import Form, FormVersion


class FormSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = Form
        fields = [
            'id', 'title', 'description', 'slug', 'status',
            'pages', 'logic', 'theme', 'settings',
            'metadata', 'tags', 'default_locale', 'locales', 'translations',
            'submission_count', 'view_count',
            'organization', 'organization_name',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'submission_count', 'view_count',
            'created_by', 'created_at', 'updated_at'
        ]
    
    def validate_pages(self, value):
        """Validate pages structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Pages must be a list")
        
        for page in value:
            if not isinstance(page, dict):
                raise serializers.ValidationError("Each page must be an object")
            if 'blocks' not in page:
                raise serializers.ValidationError("Each page must have blocks")
            if not isinstance(page['blocks'], list):
                raise serializers.ValidationError("Page blocks must be a list")
        
        return value
    
    def validate_slug(self, value):
        """Ensure slug is unique within organization"""
        if value:
            qs = Form.objects.filter(
                organization=self.context['request'].user.membership.organization,
                slug=value
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("This slug is already in use")
        return value


class FormVersionSerializer(serializers.ModelSerializer):
    published_by_name = serializers.CharField(source='published_by.get_full_name', read_only=True)
    form_title = serializers.CharField(source='form.title', read_only=True)
    
    class Meta:
        model = FormVersion
        fields = [
            'id', 'form', 'form_title', 'version',
            'schema', 'theme', 'settings',
            'published_at', 'published_by', 'published_by_name',
            'canary_percentage', 'changelog',
            'created_at'
        ]
        read_only_fields = [
            'id', 'version', 'published_by', 'created_at'
        ]


class FormImportSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['typeform', 'google_forms'])
    source = serializers.CharField()
    credentials = serializers.JSONField(required=False)