import json
import requests
from typing import Dict, Any, List
from django.conf import settings
import urllib.parse

from .base import BaseProvider


class NotionProvider(BaseProvider):
    """Notion integration provider"""
    
    API_VERSION = "2022-06-28"
    
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test Notion connection"""
        config = integration.config
        
        if not integration.access_token:
            raise ValueError("Notion access token is required")
        
        # Test API connection
        response = requests.get(
            'https://api.notion.com/v1/users/me',
            headers={
                'Authorization': f'Bearer {integration.access_token}',
                'Notion-Version': self.API_VERSION
            }
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to connect to Notion: {response.text}")
        
        user_data = response.json()
        
        # Get database info if configured
        database_info = None
        if config.get('database_id'):
            db_response = requests.get(
                f'https://api.notion.com/v1/databases/{config["database_id"]}',
                headers={
                    'Authorization': f'Bearer {integration.access_token}',
                    'Notion-Version': self.API_VERSION
                }
            )
            
            if db_response.status_code == 200:
                database_info = db_response.json()
        
        return {
            'user': user_data.get('name'),
            'type': user_data.get('type'),
            'database': database_info.get('title', [{}])[0].get('plain_text') if database_info else None
        }
    
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Create page in Notion database"""
        config = integration.config
        
        if not config.get('database_id'):
            raise ValueError("Notion database ID is required")
        
        # Build properties from form data
        properties = self._build_properties(data, settings.get('property_mapping', {}))
        
        # Create page
        response = requests.post(
            'https://api.notion.com/v1/pages',
            headers={
                'Authorization': f'Bearer {integration.access_token}',
                'Notion-Version': self.API_VERSION,
                'Content-Type': 'application/json'
            },
            json={
                'parent': {'database_id': config['database_id']},
                'properties': properties
            }
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to create Notion page: {response.text}")
        
        result = response.json()
        return {
            'page_id': result.get('id'),
            'url': result.get('url')
        }
    
    def get_available_fields(self, integration) -> List[Dict[str, Any]]:
        """Get database properties"""
        config = integration.config
        
        if not config.get('database_id') or not integration.access_token:
            return []
        
        try:
            response = requests.get(
                f'https://api.notion.com/v1/databases/{config["database_id"]}',
                headers={
                    'Authorization': f'Bearer {integration.access_token}',
                    'Notion-Version': self.API_VERSION
                }
            )
            
            if response.status_code == 200:
                database = response.json()
                fields = []
                
                for prop_name, prop_data in database.get('properties', {}).items():
                    fields.append({
                        'id': prop_name,
                        'name': prop_name,
                        'type': prop_data.get('type')
                    })
                
                return fields
        except:
            pass
        
        return []
    
    def get_oauth_url(self, integration) -> str:
        """Get Notion OAuth URL"""
        params = {
            'client_id': settings.NOTION_CLIENT_ID,
            'redirect_uri': f"{settings.FRONTEND_URL}/integrations/oauth/notion",
            'response_type': 'code',
            'owner': 'user',
            'state': str(integration.id)
        }
        
        base_url = 'https://api.notion.com/v1/oauth/authorize'
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    def exchange_oauth_code(self, integration, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        response = requests.post(
            'https://api.notion.com/v1/oauth/token',
            headers={
                'Authorization': f'Basic {self._get_basic_auth()}',
                'Content-Type': 'application/json'
            },
            json={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': f"{settings.FRONTEND_URL}/integrations/oauth/notion"
            }
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to exchange code: {response.text}")
        
        data = response.json()
        
        # Store workspace info
        config = integration.config
        config['workspace_name'] = data.get('workspace_name')
        config['workspace_id'] = data.get('workspace_id')
        integration.config = config
        
        return {
            'access_token': data.get('access_token'),
            'token_type': data.get('token_type', 'Bearer')
        }
    
    def sync_metadata(self, integration):
        """Sync available databases"""
        if not integration.access_token:
            return
        
        try:
            response = requests.post(
                'https://api.notion.com/v1/search',
                headers={
                    'Authorization': f'Bearer {integration.access_token}',
                    'Notion-Version': self.API_VERSION,
                    'Content-Type': 'application/json'
                },
                json={
                    'filter': {'property': 'object', 'value': 'database'},
                    'page_size': 100
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                databases = []
                
                for db in data.get('results', []):
                    databases.append({
                        'id': db['id'],
                        'title': db.get('title', [{}])[0].get('plain_text', 'Untitled')
                    })
                
                integration.settings['available_databases'] = databases
                integration.save()
        except:
            pass
    
    def _get_basic_auth(self) -> str:
        """Get Basic auth header value"""
        import base64
        credentials = f"{settings.NOTION_CLIENT_ID}:{settings.NOTION_CLIENT_SECRET}"
        return base64.b64encode(credentials.encode()).decode()
    
    def _build_properties(self, data: Dict[str, Any], mapping: Dict[str, str]) -> Dict[str, Any]:
        """Build Notion properties from form data"""
        properties = {}
        metadata = data.pop('_metadata', {})
        
        # Add submission title
        properties['Name'] = {
            'title': [{
                'text': {
                    'content': f"Form submission - {metadata.get('submission_id', 'Unknown')[:8]}"
                }
            }]
        }
        
        # Map form data to properties
        for key, value in data.items():
            if value is None:
                continue
            
            # Get property name from mapping or use key
            prop_name = mapping.get(key, key)
            
            # Convert to Notion property format
            if isinstance(value, str):
                properties[prop_name] = {
                    'rich_text': [{
                        'text': {'content': value[:2000]}  # Notion limit
                    }]
                }
            elif isinstance(value, (int, float)):
                properties[prop_name] = {
                    'number': value
                }
            elif isinstance(value, bool):
                properties[prop_name] = {
                    'checkbox': value
                }
            elif isinstance(value, list):
                # Convert to multi-select if possible
                properties[prop_name] = {
                    'multi_select': [
                        {'name': str(item)[:100]}  # Notion limit
                        for item in value[:100]  # Max 100 options
                    ]
                }
        
        return properties