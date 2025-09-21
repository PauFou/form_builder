import requests
from typing import Dict, Any, List
from django.conf import settings
import urllib.parse

from .base import BaseProvider


class SlackProvider(BaseProvider):
    """Slack integration provider"""
    
    OAUTH_SCOPES = ['channels:read', 'chat:write', 'chat:write.public']
    
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test Slack connection"""
        
        if not integration.access_token:
            raise ValueError("Slack access token is required")
        
        # Test API connection
        response = requests.post(
            'https://slack.com/api/auth.test',
            headers={'Authorization': f'Bearer {integration.access_token}'}
        )
        
        data = response.json()
        if not data.get('ok'):
            raise ValueError(f"Slack API error: {data.get('error', 'Unknown error')}")
        
        return {
            'team': data.get('team'),
            'user': data.get('user'),
            'team_id': data.get('team_id')
        }
    
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Send message to Slack channel"""
        config = integration.config
        
        # Build message
        message = self._build_message(data, settings)
        
        # Send to Slack
        response = requests.post(
            'https://slack.com/api/chat.postMessage',
            headers={
                'Authorization': f'Bearer {integration.access_token}',
                'Content-Type': 'application/json'
            },
            json={
                'channel': config.get('channel', '#general'),
                'text': message.get('text', 'New form submission'),
                'blocks': message.get('blocks', [])
            }
        )
        
        result = response.json()
        if not result.get('ok'):
            raise ValueError(f"Failed to send Slack message: {result.get('error', 'Unknown error')}")
        
        return {
            'ts': result.get('ts'),
            'channel': result.get('channel')
        }
    
    def get_available_fields(self, integration) -> List[Dict[str, Any]]:
        """Get available Slack channels"""
        if not integration.access_token:
            return []
        
        try:
            response = requests.get(
                'https://slack.com/api/conversations.list',
                headers={'Authorization': f'Bearer {integration.access_token}'},
                params={'types': 'public_channel,private_channel'}
            )
            
            data = response.json()
            if data.get('ok'):
                return [
                    {
                        'id': channel['id'],
                        'name': f"#{channel['name']}",
                        'type': 'channel'
                    }
                    for channel in data.get('channels', [])
                ]
        except Exception:
            pass
        
        return []
    
    def get_oauth_url(self, integration) -> str:
        """Get Slack OAuth URL"""
        params = {
            'client_id': settings.SLACK_CLIENT_ID,
            'redirect_uri': f"{settings.FRONTEND_URL}/integrations/oauth/slack",
            'scope': ','.join(self.OAUTH_SCOPES),
            'state': str(integration.id)
        }
        
        base_url = 'https://slack.com/oauth/v2/authorize'
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    def exchange_oauth_code(self, integration, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        response = requests.post('https://slack.com/api/oauth.v2.access', data={
            'code': code,
            'client_id': settings.SLACK_CLIENT_ID,
            'client_secret': settings.SLACK_CLIENT_SECRET,
            'redirect_uri': f"{settings.FRONTEND_URL}/integrations/oauth/slack"
        })
        
        data = response.json()
        if not data.get('ok'):
            raise ValueError(f"Failed to exchange code: {data.get('error', 'Unknown error')}")
        
        # Store workspace info in config
        config = integration.config
        config['workspace'] = data.get('team', {}).get('name')
        config['workspace_id'] = data.get('team', {}).get('id')
        integration.config = config
        
        return {
            'access_token': data.get('access_token'),
            'token_type': data.get('token_type')
        }
    
    def sync_metadata(self, integration):
        """Sync available channels"""
        channels = self.get_available_fields(integration)
        integration.settings['available_channels'] = channels
        integration.save()
    
    def _build_message(self, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Build Slack message from form data"""
        # Get metadata
        metadata = data.pop('_metadata', {})
        form_title = metadata.get('form_title', 'Form')
        
        # Build blocks
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"New {form_title} Submission"
                }
            },
            {
                "type": "divider"
            }
        ]
        
        # Add form fields
        for key, value in data.items():
            if value is not None and str(value).strip():
                blocks.append({
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*{key}*"
                        },
                        {
                            "type": "plain_text",
                            "text": str(value)
                        }
                    ]
                })
        
        # Add metadata footer
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Submitted at {metadata.get('submitted_at', 'N/A')}"
                }
            ]
        })
        
        return {
            'text': f"New {form_title} submission received",
            'blocks': blocks
        }