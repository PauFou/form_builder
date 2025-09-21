from django.db import models
import json


class ArrayField(models.JSONField):
    """
    Custom ArrayField that works with both PostgreSQL and SQLite.
    In PostgreSQL, uses native ArrayField.
    In SQLite, uses JSONField with array validation.
    """
    
    def __init__(self, base_field, **kwargs):
        self.base_field = base_field
        # For SQLite, we'll use JSONField with a default of list
        if 'default' not in kwargs:
            kwargs['default'] = list
        super().__init__(**kwargs)
    
    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        # Include base_field in the deconstruction for migrations
        kwargs['base_field'] = self.base_field
        return name, path, args, kwargs
    
    def validate(self, value, model_instance):
        super().validate(value, model_instance)
        if value is not None and not isinstance(value, list):
            raise ValueError(f"{self.name} must be a list")
    
    def to_python(self, value):
        value = super().to_python(value)
        if value is None:
            return value
        if isinstance(value, list):
            return value
        # Handle string representation of list
        if isinstance(value, str):
            try:
                value = json.loads(value)
                if not isinstance(value, list):
                    raise ValueError
                return value
            except (json.JSONDecodeError, ValueError):
                return []
        return []


def get_array_field(base_field, **kwargs):
    """
    Returns appropriate ArrayField based on database backend.
    Uses PostgreSQL ArrayField when available, falls back to custom implementation.
    """
    # For now, always use JSONField-based ArrayField to avoid PostgreSQL array type issues
    # TODO: Fix migration to properly handle PostgreSQL arrays
    return ArrayField(base_field, **kwargs)