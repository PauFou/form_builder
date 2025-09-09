from typing import Union, Optional
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Organization, Submission, Answer, Membership, AuditLog


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "verified_at", "date_joined"]
        read_only_fields = ["id", "verified_at", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ["email", "username", "password", "password2", "first_name", "last_name"]
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Ensure email is lowercase
        attrs['email'] = attrs['email'].lower()
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Membership
        fields = ["id", "user", "role", "created_at"]
        read_only_fields = ["id", "created_at"]


class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    current_user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "plan", "seats", "member_count", "current_user_role", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "member_count", "current_user_role"]
        extra_kwargs = {
            'slug': {'validators': []},  # We'll handle uniqueness in the view
        }
    
    def get_member_count(self, obj) -> int:
        return obj.memberships.count()
    
    def get_current_user_role(self, obj) -> Optional[str]:
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None


# Form serializers moved to forms/serializers.py


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


# FormImportSerializer moved to forms/serializers.py


class AuditLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ["id", "actor", "action", "entity", "entity_id", "diff_json", "created_at"]
        read_only_fields = fields


class BulkAnswerSerializer(serializers.Serializer):
    answers = AnswerSerializer(many=True)
    
    def create(self, validated_data):
        submission = self.context['submission']
        answers_data = validated_data['answers']
        
        answers = []
        for answer_data in answers_data:
            answer = Answer.objects.create(submission=submission, **answer_data)
            answers.append(answer)
        
        return {'answers': answers}