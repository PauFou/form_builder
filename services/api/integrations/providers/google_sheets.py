from typing import Dict, Any, List
from django.conf import settings
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import urllib.parse

from .base import BaseProvider


class GoogleSheetsProvider(BaseProvider):
    """Google Sheets integration provider"""
    
    OAUTH_SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test Google Sheets connection"""
        config = integration.config
        
        if not config.get('spreadsheet_id'):
            raise ValueError("Spreadsheet ID is required")
        
        # Get service
        service = self._get_sheets_service(integration)
        
        # Try to read spreadsheet metadata
        try:
            spreadsheet = service.spreadsheets().get(
                spreadsheetId=config['spreadsheet_id']
            ).execute()
            
            return {
                'title': spreadsheet['properties']['title'],
                'sheets': [sheet['properties']['title'] for sheet in spreadsheet['sheets']]
            }
        except Exception as e:
            raise ValueError(f"Failed to connect to spreadsheet: {str(e)}")
    
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Append data to Google Sheets"""
        config = integration.config
        service = self._get_sheets_service(integration)
        
        # Prepare row data
        headers = settings.get('headers', [])
        if not headers:
            headers = list(data.keys())
        
        row = [data.get(header, '') for header in headers]
        
        # Append to sheet
        sheet_name = config.get('sheet_name', 'Sheet1')
        range_name = f"{sheet_name}!A:Z"
        
        result = service.spreadsheets().values().append(
            spreadsheetId=config['spreadsheet_id'],
            range=range_name,
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body={'values': [row]}
        ).execute()
        
        return {
            'updated_range': result.get('updates', {}).get('updatedRange'),
            'updated_rows': result.get('updates', {}).get('updatedRows', 0)
        }
    
    def get_available_fields(self, integration) -> List[Dict[str, Any]]:
        """Get headers from the first row of the sheet"""
        config = integration.config
        service = self._get_sheets_service(integration)
        
        sheet_name = config.get('sheet_name', 'Sheet1')
        range_name = f"{sheet_name}!1:1"
        
        try:
            result = service.spreadsheets().values().get(
                spreadsheetId=config['spreadsheet_id'],
                range=range_name
            ).execute()
            
            headers = result.get('values', [[]])[0]
            return [
                {'id': header, 'name': header, 'type': 'string'}
                for header in headers if header
            ]
        except Exception:
            return []
    
    def get_oauth_url(self, integration) -> str:
        """Get Google OAuth URL"""
        params = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': f"{settings.FRONTEND_URL}/integrations/oauth/google",
            'response_type': 'code',
            'scope': ' '.join(self.OAUTH_SCOPES),
            'access_type': 'offline',
            'prompt': 'consent',
            'state': str(integration.id)
        }
        
        base_url = 'https://accounts.google.com/o/oauth2/v2/auth'
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    def exchange_oauth_code(self, integration, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        import requests
        
        response = requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': f"{settings.FRONTEND_URL}/integrations/oauth/google",
            'grant_type': 'authorization_code'
        })
        
        if response.status_code != 200:
            raise ValueError(f"Failed to exchange code: {response.text}")
        
        return response.json()
    
    def refresh_oauth_token(self, integration) -> Dict[str, Any]:
        """Refresh Google OAuth token"""
        import requests
        
        response = requests.post('https://oauth2.googleapis.com/token', data={
            'refresh_token': integration.refresh_token,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'grant_type': 'refresh_token'
        })
        
        if response.status_code != 200:
            raise ValueError(f"Failed to refresh token: {response.text}")
        
        return response.json()
    
    def sync_metadata(self, integration):
        """Sync available spreadsheets and sheets"""
        service = self._get_sheets_service(integration)
        config = integration.config
        
        if config.get('spreadsheet_id'):
            # Get sheet names
            try:
                spreadsheet = service.spreadsheets().get(
                    spreadsheetId=config['spreadsheet_id']
                ).execute()
                
                sheets = [sheet['properties']['title'] for sheet in spreadsheet['sheets']]
                
                integration.settings['available_sheets'] = sheets
                integration.save()
            except Exception:
                pass
    
    def _get_sheets_service(self, integration):
        """Get Google Sheets API service"""
        creds = Credentials(
            token=integration.access_token,
            refresh_token=integration.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=self.OAUTH_SCOPES
        )
        
        # Refresh if needed
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            integration.access_token = creds.token
            integration.save()
        
        return build('sheets', 'v4', credentials=creds)