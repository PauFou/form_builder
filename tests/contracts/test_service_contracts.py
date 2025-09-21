"""
Contract tests to ensure services maintain compatible interfaces
Uses Pact-style contract testing approach
"""

import json
import pytest
from typing import Dict, Any, List
from jsonschema import validate, ValidationError
from deepdiff import DeepDiff


class ContractValidator:
    """Validates contracts between services"""
    
    @staticmethod
    def validate_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """Validate data against JSON schema"""
        try:
            validate(instance=data, schema=schema)
            return True
        except ValidationError:
            return False
    
    @staticmethod
    def validate_compatibility(provider: Dict[str, Any], consumer: Dict[str, Any]) -> Dict[str, Any]:
        """Check if provider contract satisfies consumer expectations"""
        diff = DeepDiff(consumer, provider, ignore_order=True)
        
        compatibility_issues = []
        
        # Check for missing fields consumer expects
        if 'dictionary_item_removed' in diff:
            for item in diff['dictionary_item_removed']:
                compatibility_issues.append(f"Provider missing field: {item}")
        
        # Check for type changes
        if 'type_changes' in diff:
            for path, change in diff['type_changes'].items():
                compatibility_issues.append(
                    f"Type mismatch at {path}: consumer expects {change['old_type']} but provider has {change['new_type']}"
                )
        
        return {
            "compatible": len(compatibility_issues) == 0,
            "issues": compatibility_issues
        }


# Contract Schemas
SUBMISSION_API_CONTRACT = {
    "type": "object",
    "required": ["data", "timestamp"],
    "properties": {
        "data": {
            "type": "object",
            "required": ["form_id", "respondent_key", "version", "locale", "answers"],
            "properties": {
                "form_id": {"type": "string"},
                "respondent_key": {"type": "string"},
                "version": {"type": "integer"},
                "locale": {"type": "string"},
                "answers": {"type": "object"},
                "metadata": {"type": "object"},
                "partial": {"type": "boolean"}
            }
        },
        "idempotency_key": {"type": "string"},
        "timestamp": {"type": "integer"}
    }
}

WEBHOOK_PAYLOAD_CONTRACT = {
    "type": "object",
    "required": ["event", "submission"],
    "properties": {
        "event": {
            "type": "string",
            "enum": ["submission.created", "submission.partial", "submission.updated"]
        },
        "submission": {
            "type": "object",
            "required": ["id", "form_id", "respondent_key", "created_at"],
            "properties": {
                "id": {"type": "string"},
                "form_id": {"type": "string"},
                "respondent_key": {"type": "string"},
                "locale": {"type": "string"},
                "answers": {"type": "object"},
                "metadata": {"type": "object"},
                "created_at": {"type": "string"}
            }
        }
    }
}

ANALYTICS_EVENT_CONTRACT = {
    "type": "object",
    "required": ["event_type", "form_id", "organization_id", "respondent_id", "session_id"],
    "properties": {
        "event_type": {
            "type": "string",
            "enum": [
                "form_view", "form_start", "step_view", "field_focus",
                "field_change", "field_error", "step_complete", "form_submit",
                "form_abandon", "outcome_reached", "payment_initiated",
                "payment_completed", "partial_save"
            ]
        },
        "form_id": {"type": "string"},
        "organization_id": {"type": "string"},
        "respondent_id": {"type": "string"},
        "session_id": {"type": "string"},
        "timestamp": {"type": "string"},
        "step_id": {"type": "string"},
        "field_id": {"type": "string"},
        "field_type": {"type": "string"},
        "field_value": {"type": "string"},
        "error_type": {"type": "string"},
        "error_message": {"type": "string"},
        "outcome_id": {"type": "string"},
        "submission_id": {"type": "string"},
        "is_partial": {"type": "boolean"},
        "device_type": {"type": "string", "enum": ["desktop", "mobile", "tablet"]},
        "browser": {"type": "string"},
        "os": {"type": "string"},
        "country_code": {"type": "string"},
        "page_load_time_ms": {"type": "integer"},
        "time_to_interactive_ms": {"type": "integer"},
        "time_on_step_ms": {"type": "integer"},
        "utm_source": {"type": "string"},
        "utm_medium": {"type": "string"},
        "utm_campaign": {"type": "string"},
        "referrer_domain": {"type": "string"}
    }
}


class TestIngestToAPIContract:
    """Test contract between Ingest Service and API Service"""
    
    def test_submission_payload_contract(self):
        """Test submission payload matches API expectations"""
        
        # Sample payload from ingest service
        ingest_payload = {
            "data": {
                "form_id": "123e4567-e89b-12d3-a456-426614174000",
                "respondent_key": "test-respondent",
                "version": 1,
                "locale": "en",
                "answers": {
                    "field1": "value1",
                    "field2": 42
                },
                "metadata": {
                    "user_agent": "Test/1.0",
                    "ip_address": "127.0.0.1"
                },
                "partial": False
            },
            "idempotency_key": "unique-key-123",
            "timestamp": 1234567890
        }
        
        # Validate against contract
        validator = ContractValidator()
        assert validator.validate_schema(ingest_payload, SUBMISSION_API_CONTRACT)
    
    def test_partial_submission_contract(self):
        """Test partial submission follows contract"""
        
        partial_payload = {
            "data": {
                "form_id": "123e4567-e89b-12d3-a456-426614174000",
                "respondent_key": "partial-respondent",
                "version": 1,
                "locale": "en",
                "answers": {
                    "field1": "incomplete"
                },
                "metadata": {
                    "last_field": "field1",
                    "progress": 25
                },
                "partial": True
            },
            "timestamp": 1234567890
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(partial_payload, SUBMISSION_API_CONTRACT)
    
    def test_contract_evolution_compatibility(self):
        """Test that contract changes maintain backward compatibility"""
        
        # Original contract (consumer expectation)
        consumer_contract = {
            "data": {
                "form_id": "string",
                "respondent_key": "string",
                "version": "integer",
                "answers": "object"
            }
        }
        
        # New contract (provider capability)
        provider_contract = {
            "data": {
                "form_id": "string",
                "respondent_key": "string",
                "version": "integer",
                "locale": "string",  # New required field
                "answers": "object",
                "metadata": "object",  # New optional field
                "partial": "boolean"   # New optional field
            }
        }
        
        # Check compatibility
        validator = ContractValidator()
        result = validator.validate_compatibility(provider_contract, consumer_contract)
        
        # Provider should satisfy consumer (backward compatible)
        assert result["compatible"], f"Contract not backward compatible: {result['issues']}"


class TestAPIToWebhookContract:
    """Test contract between API Service and Webhook consumers"""
    
    def test_webhook_payload_contract(self):
        """Test webhook payload follows contract"""
        
        webhook_payload = {
            "event": "submission.created",
            "submission": {
                "id": "sub_123",
                "form_id": "form_456",
                "respondent_key": "resp_789",
                "locale": "en",
                "answers": {
                    "q1": "answer1",
                    "q2": "answer2"
                },
                "metadata": {
                    "source": "web"
                },
                "created_at": "2023-01-01T00:00:00Z"
            }
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(webhook_payload, WEBHOOK_PAYLOAD_CONTRACT)
    
    def test_partial_submission_webhook_contract(self):
        """Test partial submission webhook follows contract"""
        
        partial_webhook = {
            "event": "submission.partial",
            "submission": {
                "id": "sub_partial_123",
                "form_id": "form_456",
                "respondent_key": "resp_partial_789",
                "locale": "en",
                "answers": {
                    "q1": "partial_answer"
                },
                "metadata": {
                    "partial": True,
                    "progress": 50
                },
                "created_at": "2023-01-01T00:00:00Z"
            }
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(partial_webhook, WEBHOOK_PAYLOAD_CONTRACT)


class TestFrontendToAnalyticsContract:
    """Test contract between Frontend and Analytics Service"""
    
    def test_analytics_event_contract(self):
        """Test analytics event follows contract"""
        
        analytics_event = {
            "event_type": "form_view",
            "form_id": "form_123",
            "organization_id": "org_456",
            "respondent_id": "resp_789",
            "session_id": "session_abc",
            "timestamp": "2023-01-01T00:00:00Z",
            "device_type": "desktop",
            "browser": "chrome",
            "os": "windows",
            "page_load_time_ms": 250
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(analytics_event, ANALYTICS_EVENT_CONTRACT)
    
    def test_field_interaction_event_contract(self):
        """Test field interaction events follow contract"""
        
        field_event = {
            "event_type": "field_change",
            "form_id": "form_123",
            "organization_id": "org_456",
            "respondent_id": "resp_789",
            "session_id": "session_abc",
            "field_id": "email_field",
            "field_type": "email",
            "field_value": "user@example.com"
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(field_event, ANALYTICS_EVENT_CONTRACT)
    
    def test_submission_event_contract(self):
        """Test submission event follows contract"""
        
        submission_event = {
            "event_type": "form_submit",
            "form_id": "form_123",
            "organization_id": "org_456",
            "respondent_id": "resp_789",
            "session_id": "session_abc",
            "submission_id": "sub_123",
            "is_partial": False,
            "time_on_step_ms": 45000
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(submission_event, ANALYTICS_EVENT_CONTRACT)


class TestFormSchemaContract:
    """Test form schema contracts between builder and runtime"""
    
    FORM_SCHEMA_CONTRACT = {
        "type": "object",
        "required": ["id", "title", "pages"],
        "properties": {
            "id": {"type": "string"},
            "title": {"type": "string"},
            "description": {"type": "string"},
            "pages": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["id", "blocks"],
                    "properties": {
                        "id": {"type": "string"},
                        "title": {"type": "string"},
                        "blocks": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["id", "type", "question"],
                                "properties": {
                                    "id": {"type": "string"},
                                    "type": {"type": "string"},
                                    "question": {"type": "string"},
                                    "required": {"type": "boolean"},
                                    "validations": {"type": "object"},
                                    "properties": {"type": "object"}
                                }
                            }
                        }
                    }
                }
            },
            "logic": {
                "type": "object",
                "properties": {
                    "rules": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["id", "conditions", "actions"],
                            "properties": {
                                "id": {"type": "string"},
                                "conditions": {"type": "array"},
                                "actions": {"type": "array"}
                            }
                        }
                    }
                }
            }
        }
    }
    
    def test_form_builder_output_contract(self):
        """Test form builder output matches runtime expectations"""
        
        builder_output = {
            "id": "form_123",
            "title": "Test Form",
            "description": "A test form",
            "pages": [
                {
                    "id": "page1",
                    "title": "First Page",
                    "blocks": [
                        {
                            "id": "name",
                            "type": "short_text",
                            "question": "What's your name?",
                            "required": True,
                            "validations": {
                                "min_length": 2,
                                "max_length": 50
                            }
                        },
                        {
                            "id": "email",
                            "type": "email",
                            "question": "What's your email?",
                            "required": True,
                            "properties": {
                                "placeholder": "you@example.com"
                            }
                        }
                    ]
                }
            ],
            "logic": {
                "rules": [
                    {
                        "id": "rule1",
                        "conditions": [
                            {
                                "field": "name",
                                "operator": "equals",
                                "value": "Admin"
                            }
                        ],
                        "actions": [
                            {
                                "type": "show_field",
                                "field": "admin_code"
                            }
                        ]
                    }
                ]
            }
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(builder_output, self.FORM_SCHEMA_CONTRACT)
    
    def test_runtime_can_handle_builder_schema(self):
        """Test runtime can handle all builder field types"""
        
        supported_field_types = [
            "short_text", "long_text", "email", "phone", "number",
            "currency", "date", "time", "datetime", "url",
            "single_select", "multi_select", "dropdown", "radio",
            "checkbox", "checkbox_group", "rating", "nps", "scale",
            "ranking", "matrix", "file_upload", "signature",
            "payment", "hidden", "statement"
        ]
        
        # Create form with all field types
        test_form = {
            "id": "test_all_fields",
            "title": "All Fields Test",
            "pages": [
                {
                    "id": "page1",
                    "blocks": [
                        {
                            "id": f"field_{field_type}",
                            "type": field_type,
                            "question": f"Test {field_type}"
                        }
                        for field_type in supported_field_types
                    ]
                }
            ]
        }
        
        validator = ContractValidator()
        assert validator.validate_schema(test_form, self.FORM_SCHEMA_CONTRACT)


def test_cross_service_compatibility():
    """Test end-to-end compatibility across all services"""
    
    # Simulate data flow through services
    
    # 1. Frontend creates submission
    frontend_submission = {
        "form_id": "test_form",
        "answers": {
            "name": "Test User",
            "email": "test@example.com"
        }
    }
    
    # 2. Frontend sends to Ingest
    ingest_payload = {
        "data": {
            "form_id": frontend_submission["form_id"],
            "respondent_key": "frontend_user_123",
            "version": 1,
            "locale": "en",
            "answers": frontend_submission["answers"],
            "partial": False
        },
        "timestamp": 1234567890
    }
    
    # 3. Ingest sends to API
    api_payload = ingest_payload
    
    # 4. API sends webhook
    webhook_payload = {
        "event": "submission.created",
        "submission": {
            "id": "sub_123",
            "form_id": api_payload["data"]["form_id"],
            "respondent_key": api_payload["data"]["respondent_key"],
            "answers": api_payload["data"]["answers"],
            "created_at": "2023-01-01T00:00:00Z"
        }
    }
    
    # 5. Frontend sends analytics
    analytics_payload = {
        "event_type": "form_submit",
        "form_id": frontend_submission["form_id"],
        "organization_id": "org_123",
        "respondent_id": "frontend_user_123",
        "session_id": "session_456",
        "submission_id": "sub_123"
    }
    
    # Validate all contracts
    validator = ContractValidator()
    
    assert validator.validate_schema(ingest_payload, SUBMISSION_API_CONTRACT)
    assert validator.validate_schema(webhook_payload, WEBHOOK_PAYLOAD_CONTRACT)
    assert validator.validate_schema(analytics_payload, ANALYTICS_EVENT_CONTRACT)
    
    print("✅ All service contracts are compatible!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])