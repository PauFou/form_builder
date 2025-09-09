import json
import requests
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import hmac
import hashlib
import base64

from .models import Integration, IntegrationConnection, IntegrationLog
from .providers import (
    GoogleSheetsProvider,
    SlackProvider,
    NotionProvider,
    WebhookProvider,
    AirtableProvider,
    HubSpotProvider,
    StripeProvider
)


class IntegrationService:
    """Service for managing integrations"""
    
    def __init__(self):
        self.providers = {
            'google_sheets': GoogleSheetsProvider(),
            'slack': SlackProvider(),
            'notion': NotionProvider(),
            'webhook': WebhookProvider(),
            'airtable': AirtableProvider(),
            'hubspot': HubSpotProvider(),
            'stripe': StripeProvider(),
        }
    
    def get_provider(self, integration_type: str):
        """Get provider for integration type"""
        return self.providers.get(integration_type)
    
    def test_integration(self, integration: Integration, sample_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Test integration with sample data"""
        provider = self.get_provider(integration.type)
        if not provider:
            return {'success': False, 'message': f'Unknown integration type: {integration.type}'}
        
        try:
            result = provider.test_connection(integration, sample_data or {})
            return {'success': True, 'message': 'Integration test successful', 'data': result}
        except Exception as e:
            return {'success': False, 'message': str(e)}
    
    def test_connection(self, connection: IntegrationConnection, sample_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Test integration connection with sample form data"""
        provider = self.get_provider(connection.integration.type)
        if not provider:
            return {'success': False, 'message': f'Unknown integration type: {connection.integration.type}'}
        
        # Map sample data using field mapping
        mapped_data = self.apply_field_mapping(
            sample_data or {},
            connection.field_mapping,
            connection.form
        )
        
        try:
            result = provider.send_data(connection.integration, mapped_data, connection.settings)
            return {'success': True, 'message': 'Connection test successful', 'data': result}
        except Exception as e:
            return {'success': False, 'message': str(e)}
    
    def process_submission(self, submission, trigger_event: str = 'form_submit'):
        """Process submission through all active integrations"""
        connections = IntegrationConnection.objects.filter(
            form=submission.form,
            enabled=True,
            trigger_events__contains=[trigger_event]
        ).select_related('integration')
        
        for connection in connections:
            self.execute_integration(connection, submission=submission, trigger_event=trigger_event)
    
    def process_partial_submission(self, partial, trigger_event: str = 'partial_submit'):
        """Process partial submission through all active integrations"""
        connections = IntegrationConnection.objects.filter(
            form=partial.form,
            enabled=True,
            trigger_events__contains=[trigger_event]
        ).select_related('integration')
        
        for connection in connections:
            self.execute_integration(connection, partial=partial, trigger_event=trigger_event)
    
    def execute_integration(self, connection: IntegrationConnection, 
                          submission=None, partial=None, trigger_event: str = None):
        """Execute integration for a submission or partial"""
        # Create log entry
        log = IntegrationLog.objects.create(
            connection=connection,
            submission=submission,
            partial=partial,
            trigger_event=trigger_event or 'manual',
            status='processing',
            started_at=timezone.now()
        )
        
        try:
            # Get provider
            provider = self.get_provider(connection.integration.type)
            if not provider:
                raise ValueError(f'Unknown integration type: {connection.integration.type}')
            
            # Prepare data
            if submission:
                data = submission.data
                metadata = {
                    'submission_id': str(submission.id),
                    'form_id': str(submission.form.id),
                    'form_title': submission.form.title,
                    'submitted_at': submission.created_at.isoformat(),
                    'respondent_id': submission.respondent_id,
                }
            else:
                data = partial.data
                metadata = {
                    'partial_id': str(partial.id),
                    'form_id': str(partial.form.id),
                    'form_title': partial.form.title,
                    'last_updated': partial.updated_at.isoformat(),
                    'respondent_key': partial.respondent_key,
                }
            
            # Apply field mapping
            mapped_data = self.apply_field_mapping(data, connection.field_mapping, connection.form)
            mapped_data['_metadata'] = metadata
            
            # Send to integration
            log.request_data = mapped_data
            result = provider.send_data(
                connection.integration,
                mapped_data,
                connection.settings
            )
            
            # Update log
            log.status = 'success'
            log.response_data = result
            log.completed_at = timezone.now()
            log.duration_ms = int((log.completed_at - log.started_at).total_seconds() * 1000)
            log.save()
            
            # Update connection stats
            connection.last_triggered_at = timezone.now()
            connection.success_count += 1
            connection.last_error = None
            connection.save(update_fields=['last_triggered_at', 'success_count', 'last_error'])
            
        except Exception as e:
            # Log error
            log.status = 'failed'
            log.error_message = str(e)
            log.completed_at = timezone.now()
            log.duration_ms = int((log.completed_at - log.started_at).total_seconds() * 1000)
            
            # Set retry
            if log.retry_count < 3:
                log.next_retry_at = timezone.now() + timedelta(minutes=5 ** log.retry_count)
            
            log.save()
            
            # Update connection stats
            connection.error_count += 1
            connection.last_error = str(e)
            connection.save(update_fields=['error_count', 'last_error'])
            
            raise
    
    def apply_field_mapping(self, data: Dict[str, Any], mapping: Dict[str, str], form) -> Dict[str, Any]:
        """Apply field mapping to form data"""
        if not mapping:
            return data
        
        mapped = {}
        for source_field, target_field in mapping.items():
            if source_field in data:
                # Handle nested target fields (e.g., "address.street")
                parts = target_field.split('.')
                current = mapped
                for part in parts[:-1]:
                    if part not in current:
                        current[part] = {}
                    current = current[part]
                current[parts[-1]] = data[source_field]
        
        return mapped
    
    def get_field_mapping_suggestions(self, connection: IntegrationConnection) -> Dict[str, str]:
        """Get suggested field mappings based on field names and types"""
        provider = self.get_provider(connection.integration.type)
        if not provider:
            return {}
        
        # Get form fields
        form_fields = []
        for page in connection.form.pages:
            for block in page['blocks']:
                form_fields.append({
                    'id': block['id'],
                    'question': block['question'],
                    'type': block['type']
                })
        
        # Get integration fields
        try:
            integration_fields = provider.get_available_fields(connection.integration)
        except:
            integration_fields = []
        
        # Generate suggestions
        suggestions = {}
        for form_field in form_fields:
            best_match = None
            best_score = 0
            
            for int_field in integration_fields:
                score = self._calculate_field_similarity(form_field, int_field)
                if score > best_score:
                    best_score = score
                    best_match = int_field['id']
            
            if best_match and best_score > 0.5:
                suggestions[form_field['id']] = best_match
        
        return suggestions
    
    def _calculate_field_similarity(self, form_field: Dict, int_field: Dict) -> float:
        """Calculate similarity score between form field and integration field"""
        score = 0.0
        
        # Check name similarity
        form_name = form_field['question'].lower()
        int_name = int_field.get('name', '').lower()
        
        if form_name == int_name:
            score += 1.0
        elif form_name in int_name or int_name in form_name:
            score += 0.5
        
        # Check type compatibility
        if self._are_types_compatible(form_field['type'], int_field.get('type')):
            score += 0.5
        
        return score / 1.5  # Normalize to 0-1
    
    def _are_types_compatible(self, form_type: str, int_type: str) -> bool:
        """Check if form field type is compatible with integration field type"""
        compatibility_map = {
            'text': ['string', 'text', 'title'],
            'long_text': ['string', 'text', 'rich_text'],
            'email': ['string', 'email'],
            'phone': ['string', 'phone', 'tel'],
            'number': ['number', 'integer', 'float'],
            'currency': ['number', 'currency'],
            'date': ['date', 'datetime'],
            'single_select': ['string', 'select', 'enum'],
            'multi_select': ['array', 'multiselect', 'tags'],
        }
        
        compatible_types = compatibility_map.get(form_type, [])
        return int_type in compatible_types
    
    def get_oauth_url(self, integration: Integration) -> str:
        """Get OAuth authorization URL"""
        provider = self.get_provider(integration.type)
        if not provider:
            raise ValueError(f'Unknown integration type: {integration.type}')
        
        return provider.get_oauth_url(integration)
    
    def complete_oauth(self, integration: Integration, code: str, state: str):
        """Complete OAuth flow"""
        provider = self.get_provider(integration.type)
        if not provider:
            raise ValueError(f'Unknown integration type: {integration.type}')
        
        tokens = provider.exchange_oauth_code(integration, code, state)
        
        # Store tokens
        integration.access_token = tokens.get('access_token')
        integration.refresh_token = tokens.get('refresh_token')
        if 'expires_in' in tokens:
            integration.token_expires_at = timezone.now() + timedelta(seconds=tokens['expires_in'])
        
        integration.save()
    
    def refresh_oauth_token(self, integration: Integration):
        """Refresh OAuth token if needed"""
        if not integration.refresh_token:
            return
        
        # Check if token needs refresh
        if integration.token_expires_at and integration.token_expires_at > timezone.now() + timedelta(minutes=5):
            return
        
        provider = self.get_provider(integration.type)
        if not provider:
            return
        
        try:
            tokens = provider.refresh_oauth_token(integration)
            
            integration.access_token = tokens.get('access_token')
            if 'refresh_token' in tokens:
                integration.refresh_token = tokens['refresh_token']
            if 'expires_in' in tokens:
                integration.token_expires_at = timezone.now() + timedelta(seconds=tokens['expires_in'])
            
            integration.save()
        except Exception as e:
            integration.status = 'error'
            integration.error_message = f'Token refresh failed: {str(e)}'
            integration.save()
            raise
    
    def sync_integration(self, integration: Integration):
        """Sync integration data (e.g., available sheets, channels, etc.)"""
        provider = self.get_provider(integration.type)
        if not provider:
            raise ValueError(f'Unknown integration type: {integration.type}')
        
        # Refresh token if needed
        self.refresh_oauth_token(integration)
        
        # Sync data
        provider.sync_metadata(integration)