import json
import requests
from typing import Dict, Any, List
from django.conf import settings

from .base import BaseProvider


class AirtableProvider(BaseProvider):
    """Airtable integration provider"""
    
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test Airtable connection"""
        config = integration.config
        
        if not config.get('api_key'):
            raise ValueError("Airtable API key is required")
        
        if not config.get('base_id'):
            raise ValueError("Airtable base ID is required")
        
        # Test API connection
        response = requests.get(
            f"https://api.airtable.com/v0/{config['base_id']}/{config.get('table_name', 'Table 1')}",
            headers={'Authorization': f"Bearer {config['api_key']}"},
            params={'maxRecords': 1}
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to connect to Airtable: {response.text}")
        
        return {'connected': True, 'table': config.get('table_name', 'Table 1')}
    
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Create record in Airtable"""
        config = integration.config
        
        # Send to Airtable
        response = requests.post(
            f"https://api.airtable.com/v0/{config['base_id']}/{config.get('table_name', 'Table 1')}",
            headers={
                'Authorization': f"Bearer {config['api_key']}",
                'Content-Type': 'application/json'
            },
            json={'fields': data}
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to create Airtable record: {response.text}")
        
        result = response.json()
        return {
            'record_id': result.get('id'),
            'created_time': result.get('createdTime')
        }
    
    def get_available_fields(self, integration) -> List[Dict[str, Any]]:
        """Get table fields"""
        # In a real implementation, this would fetch the table schema
        return []