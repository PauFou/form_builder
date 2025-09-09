from rest_framework import serializers
from .models import User, Organization, Form, FormVersion, Submission, Answer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "verified_at", "date_joined"]
        read_only_fields = ["id", "verified_at", "date_joined"]


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "plan", "seats", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class FormSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Form
        fields = [
            "id", "title", "description", "slug", "status", 
            "default_locale", "created_by", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class FormVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormVersion
        fields = [
            "id", "version", "schema_json", "theme_json", 
            "published_at", "canary_percent", "created_at"
        ]
        read_only_fields = ["id", "version", "created_at"]


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ["id", "block_id", "type", "value_json", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubmissionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            "id", "form", "version", "respondent_key", "locale",
            "started_at", "completed_at", "metadata_json", "answers"
        ]
        read_only_fields = ["id", "started_at"]


class FormImportSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["typeform", "google_forms"])
    source = serializers.JSONField()