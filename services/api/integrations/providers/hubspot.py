import requests
from typing import Dict, Any

from .base import BaseProvider


class HubSpotProvider(BaseProvider):
    """HubSpot integration provider"""
    
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test HubSpot connection"""
        if not integration.access_token:
            raise ValueError("HubSpot access token is required")
        
        # Test API connection
        response = requests.get(
            'https://api.hubapi.com/account-info/v3/details',
            headers={'Authorization': f'Bearer {integration.access_token}'}
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to connect to HubSpot: {response.text}")
        
        account = response.json()
        return {
            'portal_id': account.get('portalId'),
            'company_name': account.get('companyName')
        }
    
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Create contact in HubSpot"""
        # Extract email and other contact properties
        email = data.get('email')
        if not email:
            raise ValueError("Email is required for HubSpot contact")
        
        # Build contact properties
        properties = {
            'email': email,
            'firstname': data.get('first_name', ''),
            'lastname': data.get('last_name', ''),
            'phone': data.get('phone', ''),
            'company': data.get('company', ''),
        }
        
        # Add custom properties
        for key, value in data.items():
            if key not in properties and value:
                properties[key] = str(value)
        
        # Create or update contact
        response = requests.post(
            'https://api.hubapi.com/crm/v3/objects/contacts',
            headers={
                'Authorization': f'Bearer {integration.access_token}',
                'Content-Type': 'application/json'
            },
            json={'properties': properties}
        )
        
        if response.status_code not in [200, 201]:
            raise ValueError(f"Failed to create HubSpot contact: {response.text}")
        
        result = response.json()
        return {
            'contact_id': result.get('id'),
            'created_at': result.get('createdAt')
        }