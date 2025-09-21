from rest_framework import serializers
from core.models import Submission, Answer


class AnswerSerializer(serializers.ModelSerializer):
    """
    Serializer for submission answers.
    """
    
    class Meta:
        model = Answer
        fields = ['id', 'block_id', 'type', 'value_json', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for form submissions (read operations).
    """
    answers = AnswerSerializer(many=True, read_only=True)
    form_title = serializers.CharField(source='form.title', read_only=True)
    form_slug = serializers.CharField(source='form.slug', read_only=True)
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id', 'form', 'form_title', 'form_slug', 'version',
            'respondent_key', 'locale', 'started_at', 'completed_at',
            'metadata_json', 'answers', 'tags'
        ]
        read_only_fields = ['id', 'started_at']

    def get_tags(self, obj):
        """
        Extract tags from metadata_json.
        """
        if obj.metadata_json and 'tags' in obj.metadata_json:
            return obj.metadata_json['tags']
        return []


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating submissions.
    """
    answers = serializers.JSONField(
        help_text="Dictionary of block_id: value pairs for the submission answers"
    )
    
    class Meta:
        model = Submission
        fields = [
            'respondent_key', 'locale', 'version', 'answers',
            'completed_at', 'metadata_json'
        ]
        extra_kwargs = {
            'respondent_key': {'required': True},
            'locale': {'default': 'en'},
            'version': {'required': True},
        }

    def create(self, validated_data):
        """
        Create submission with related answers.
        """
        answers_data = validated_data.pop('answers', {})
        
        # Create the submission
        submission = Submission.objects.create(**validated_data)
        
        # Create answers
        for block_id, value in answers_data.items():
            Answer.objects.create(
                submission=submission,
                block_id=block_id,
                type='text',  # Default type, could be inferred from form schema
                value_json=value
            )
        
        return submission

    def validate_answers(self, value):
        """
        Validate that answers is a dictionary.
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Answers must be a dictionary.")
        return value


class SubmissionUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating submissions (mainly for adding tags/metadata).
    """
    
    class Meta:
        model = Submission
        fields = ['metadata_json', 'completed_at']
        
    def update(self, instance, validated_data):
        """
        Update submission, preserving existing metadata when adding to it.
        """
        # Handle metadata_json updates carefully
        if 'metadata_json' in validated_data:
            new_metadata = validated_data['metadata_json']
            existing_metadata = instance.metadata_json or {}
            
            # Merge metadata (new values override existing)
            merged_metadata = {**existing_metadata, **new_metadata}
            validated_data['metadata_json'] = merged_metadata
        
        return super().update(instance, validated_data)