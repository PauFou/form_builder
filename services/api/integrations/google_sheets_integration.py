"""
Google Sheets Integration

Handles:
- OAuth authentication
- Spreadsheet creation
- Submission export to Sheets
- Real-time sync
"""

import logging
from typing import Dict, List, Optional, Any
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings

logger = logging.getLogger(__name__)


class GoogleSheetsIntegration:
    """Google Sheets integration for form submissions export"""

    def __init__(self, credentials: Optional[Credentials] = None):
        """
        Initialize Google Sheets integration

        Args:
            credentials: Google OAuth2 credentials (optional)
        """
        self.credentials = credentials
        self.service = None

        # Try to initialize with service account if available
        if not credentials:
            self._init_service_account()

    def _init_service_account(self):
        """Initialize using service account credentials"""
        service_account_file = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)

        if service_account_file:
            try:
                credentials = service_account.Credentials.from_service_account_file(
                    service_account_file,
                    scopes=['https://www.googleapis.com/auth/spreadsheets']
                )
                self.credentials = credentials
                logger.info("Google Sheets service account initialized")
            except Exception as e:
                logger.error(f"Failed to initialize service account: {e}")

    def authenticate(self, credentials: Credentials):
        """
        Set OAuth2 credentials for the integration

        Args:
            credentials: Google OAuth2 credentials
        """
        self.credentials = credentials

    def get_service(self):
        """Get or create Google Sheets API service"""
        if not self.service and self.credentials:
            self.service = build('sheets', 'v4', credentials=self.credentials)
        return self.service

    def create_spreadsheet(
        self,
        title: str,
        headers: List[str]
    ) -> Dict[str, Any]:
        """
        Create a new Google Spreadsheet

        Args:
            title: Spreadsheet title
            headers: Column headers

        Returns:
            Dict with spreadsheet details
        """
        try:
            service = self.get_service()
            if not service:
                return {'success': False, 'error': 'No credentials available'}

            # Create spreadsheet
            spreadsheet = {
                'properties': {
                    'title': title
                },
                'sheets': [{
                    'properties': {
                        'title': 'Responses',
                        'gridProperties': {
                            'frozenRowCount': 1
                        }
                    }
                }]
            }

            result = service.spreadsheets().create(body=spreadsheet).execute()
            spreadsheet_id = result['spreadsheetId']

            # Add headers
            self._write_row(spreadsheet_id, 'Responses!A1', [headers])

            # Format header row
            self._format_header_row(spreadsheet_id, len(headers))

            return {
                'success': True,
                'spreadsheet_id': spreadsheet_id,
                'spreadsheet_url': f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}",
                'title': title
            }

        except HttpError as e:
            logger.error(f"Failed to create spreadsheet: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def append_row(
        self,
        spreadsheet_id: str,
        values: List[Any],
        sheet_name: str = 'Responses'
    ) -> Dict[str, Any]:
        """
        Append a row to the spreadsheet

        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            values: Row values to append
            sheet_name: Sheet name (default: 'Responses')

        Returns:
            Result dict
        """
        try:
            service = self.get_service()
            if not service:
                return {'success': False, 'error': 'No credentials available'}

            range_name = f'{sheet_name}!A:ZZ'

            body = {
                'values': [values]
            }

            result = service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()

            return {
                'success': True,
                'updated_cells': result.get('updates', {}).get('updatedCells', 0),
                'updated_range': result.get('updates', {}).get('updatedRange', '')
            }

        except HttpError as e:
            logger.error(f"Failed to append row: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def batch_append_rows(
        self,
        spreadsheet_id: str,
        rows: List[List[Any]],
        sheet_name: str = 'Responses'
    ) -> Dict[str, Any]:
        """
        Append multiple rows to the spreadsheet

        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            rows: List of row values
            sheet_name: Sheet name

        Returns:
            Result dict
        """
        try:
            service = self.get_service()
            if not service:
                return {'success': False, 'error': 'No credentials available'}

            range_name = f'{sheet_name}!A:ZZ'

            body = {
                'values': rows
            }

            result = service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()

            return {
                'success': True,
                'updated_cells': result.get('updates', {}).get('updatedCells', 0),
                'rows_added': len(rows)
            }

        except HttpError as e:
            logger.error(f"Failed to batch append rows: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def export_submissions_to_sheet(
        self,
        form_id: str,
        submissions: List[Dict[str, Any]],
        spreadsheet_id: Optional[str] = None,
        form_title: str = "Form Submissions"
    ) -> Dict[str, Any]:
        """
        Export form submissions to Google Sheets

        Args:
            form_id: Form ID
            submissions: List of submissions to export
            spreadsheet_id: Existing spreadsheet ID (optional)
            form_title: Form title for new spreadsheet

        Returns:
            Export result with spreadsheet details
        """
        try:
            if not submissions:
                return {
                    'success': False,
                    'error': 'No submissions to export'
                }

            # Extract headers from first submission
            first_submission = submissions[0]
            headers = ['Submission ID', 'Completed At'] + list(first_submission.get('answers', {}).keys())

            # Create new spreadsheet if not provided
            if not spreadsheet_id:
                create_result = self.create_spreadsheet(
                    title=f"{form_title} - Responses",
                    headers=headers
                )

                if not create_result['success']:
                    return create_result

                spreadsheet_id = create_result['spreadsheet_id']
            else:
                # Add headers to existing spreadsheet
                self._write_row(spreadsheet_id, 'Responses!A1', [headers])

            # Prepare rows
            rows = []
            for submission in submissions:
                row = [
                    submission.get('id', ''),
                    submission.get('completed_at', '')
                ]

                answers = submission.get('answers', {})
                for header in headers[2:]:  # Skip ID and timestamp
                    row.append(answers.get(header, ''))

                rows.append(row)

            # Batch append rows
            append_result = self.batch_append_rows(spreadsheet_id, rows)

            if append_result['success']:
                return {
                    'success': True,
                    'spreadsheet_id': spreadsheet_id,
                    'spreadsheet_url': f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}",
                    'rows_exported': len(rows)
                }
            else:
                return append_result

        except Exception as e:
            logger.error(f"Failed to export submissions: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def _write_row(
        self,
        spreadsheet_id: str,
        range_name: str,
        values: List[List[Any]]
    ) -> bool:
        """Write values to specific range"""
        try:
            service = self.get_service()
            if not service:
                return False

            body = {'values': values}

            service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()

            return True

        except HttpError as e:
            logger.error(f"Failed to write row: {e}")
            return False

    def _format_header_row(
        self,
        spreadsheet_id: str,
        num_columns: int
    ) -> bool:
        """Format header row (bold, background color)"""
        try:
            service = self.get_service()
            if not service:
                return False

            requests = [{
                'repeatCell': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': 0,
                        'endRowIndex': 1,
                        'startColumnIndex': 0,
                        'endColumnIndex': num_columns
                    },
                    'cell': {
                        'userEnteredFormat': {
                            'backgroundColor': {
                                'red': 0.9,
                                'green': 0.9,
                                'blue': 0.9
                            },
                            'textFormat': {
                                'bold': True
                            }
                        }
                    },
                    'fields': 'userEnteredFormat(backgroundColor,textFormat)'
                }
            }]

            body = {'requests': requests}

            service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body=body
            ).execute()

            return True

        except HttpError as e:
            logger.error(f"Failed to format header: {e}")
            return False

    def get_spreadsheet_info(self, spreadsheet_id: str) -> Dict[str, Any]:
        """
        Get spreadsheet information

        Args:
            spreadsheet_id: Spreadsheet ID

        Returns:
            Spreadsheet details
        """
        try:
            service = self.get_service()
            if not service:
                return {'success': False, 'error': 'No credentials available'}

            spreadsheet = service.spreadsheets().get(
                spreadsheetId=spreadsheet_id
            ).execute()

            return {
                'success': True,
                'title': spreadsheet['properties']['title'],
                'sheets': [sheet['properties']['title'] for sheet in spreadsheet['sheets']],
                'url': f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
            }

        except HttpError as e:
            logger.error(f"Failed to get spreadsheet info: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Factory function
def create_sheets_integration(credentials: Optional[Credentials] = None) -> GoogleSheetsIntegration:
    """Create a Google Sheets integration instance"""
    return GoogleSheetsIntegration(credentials=credentials)
