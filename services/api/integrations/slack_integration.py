"""
Slack Integration

Handles:
- Sending submission notifications to Slack
- Channel configuration
- Message formatting
- Error handling
"""

import logging
from typing import Dict, List, Optional, Any
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class SlackIntegration:
    """Slack integration for form submission notifications"""

    def __init__(self, webhook_url: Optional[str] = None, bot_token: Optional[str] = None):
        """
        Initialize Slack integration

        Args:
            webhook_url: Slack incoming webhook URL
            bot_token: Slack bot token for API calls
        """
        self.webhook_url = webhook_url
        self.bot_token = bot_token or getattr(settings, 'SLACK_BOT_TOKEN', None)
        self.api_base_url = 'https://slack.com/api'

    def send_webhook_message(
        self,
        text: str,
        blocks: Optional[List[Dict]] = None,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send message via Slack webhook

        Args:
            text: Fallback text message
            blocks: Rich message blocks (Slack Block Kit)
            webhook_url: Override webhook URL

        Returns:
            Result dict
        """
        url = webhook_url or self.webhook_url

        if not url:
            return {
                'success': False,
                'error': 'No webhook URL configured'
            }

        payload = {'text': text}

        if blocks:
            payload['blocks'] = blocks

        try:
            response = requests.post(
                url,
                json=payload,
                timeout=10
            )
            response.raise_for_status()

            return {
                'success': True,
                'message': 'Message sent successfully'
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send Slack webhook: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def post_message(
        self,
        channel: str,
        text: str,
        blocks: Optional[List[Dict]] = None,
        thread_ts: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Post message to Slack channel using Bot API

        Args:
            channel: Channel ID or name
            text: Message text
            blocks: Rich message blocks
            thread_ts: Thread timestamp for replies

        Returns:
            Result dict with message timestamp
        """
        if not self.bot_token:
            return {
                'success': False,
                'error': 'No bot token configured'
            }

        url = f"{self.api_base_url}/chat.postMessage"

        payload = {
            'channel': channel,
            'text': text
        }

        if blocks:
            payload['blocks'] = blocks

        if thread_ts:
            payload['thread_ts'] = thread_ts

        headers = {
            'Authorization': f'Bearer {self.bot_token}',
            'Content-Type': 'application/json'
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if data.get('ok'):
                return {
                    'success': True,
                    'ts': data.get('ts'),
                    'channel': data.get('channel')
                }
            else:
                return {
                    'success': False,
                    'error': data.get('error', 'Unknown error')
                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to post Slack message: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def notify_new_submission(
        self,
        form_title: str,
        submission_data: Dict[str, Any],
        view_url: Optional[str] = None,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send notification for new form submission

        Args:
            form_title: Form title
            submission_data: Submission details
            view_url: URL to view submission
            webhook_url: Override webhook URL

        Returns:
            Result dict
        """
        # Format submission data for display
        fields = []
        answers = submission_data.get('answers', {})

        for question, answer in list(answers.items())[:10]:  # Limit to 10 fields
            fields.append({
                'type': 'mrkdwn',
                'text': f"*{question}*\n{answer}"
            })

        blocks = [
            {
                'type': 'header',
                'text': {
                    'type': 'plain_text',
                    'text': f'📋 New submission: {form_title}',
                    'emoji': True
                }
            },
            {
                'type': 'section',
                'fields': fields
            }
        ]

        # Add view link if provided
        if view_url:
            blocks.append({
                'type': 'actions',
                'elements': [{
                    'type': 'button',
                    'text': {
                        'type': 'plain_text',
                        'text': 'View Submission',
                        'emoji': True
                    },
                    'url': view_url,
                    'style': 'primary'
                }]
            })

        # Add metadata
        blocks.append({
            'type': 'context',
            'elements': [{
                'type': 'mrkdwn',
                'text': f"Submitted at {submission_data.get('completed_at', 'Unknown')}"
            }]
        })

        text = f"New submission for {form_title}"

        return self.send_webhook_message(text, blocks, webhook_url)

    def format_submission_message(
        self,
        form_title: str,
        submission: Dict[str, Any],
        include_all_fields: bool = False
    ) -> List[Dict]:
        """
        Format submission into Slack Block Kit blocks

        Args:
            form_title: Form title
            submission: Submission data
            include_all_fields: Include all fields or just first 10

        Returns:
            List of Slack blocks
        """
        blocks = [
            {
                'type': 'header',
                'text': {
                    'type': 'plain_text',
                    'text': f'📋 {form_title}',
                    'emoji': True
                }
            }
        ]

        answers = submission.get('answers', {})
        items = list(answers.items())

        if not include_all_fields:
            items = items[:10]

        # Group fields in pairs for better layout
        for i in range(0, len(items), 2):
            fields = []

            for j in range(2):
                if i + j < len(items):
                    question, answer = items[i + j]
                    fields.append({
                        'type': 'mrkdwn',
                        'text': f"*{question}*\n{answer}"
                    })

            blocks.append({
                'type': 'section',
                'fields': fields
            })

        # Add metadata
        completed_at = submission.get('completed_at', 'Unknown')
        submission_id = submission.get('id', 'N/A')

        blocks.append({
            'type': 'context',
            'elements': [{
                'type': 'mrkdwn',
                'text': f"ID: `{submission_id}` | Submitted: {completed_at}"
            }]
        })

        return blocks

    def test_connection(self, webhook_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Test Slack webhook connection

        Args:
            webhook_url: Webhook URL to test

        Returns:
            Test result
        """
        return self.send_webhook_message(
            text="🎉 Slack integration test successful!",
            blocks=[{
                'type': 'section',
                'text': {
                    'type': 'mrkdwn',
                    'text': '✅ *Slack Integration Test*\n\nYour form notifications will appear here.'
                }
            }],
            webhook_url=webhook_url
        )

    def validate_webhook_url(self, url: str) -> bool:
        """
        Validate Slack webhook URL format

        Args:
            url: Webhook URL to validate

        Returns:
            True if valid, False otherwise
        """
        return url.startswith('https://hooks.slack.com/services/')

    def get_channel_info(self, channel_id: str) -> Dict[str, Any]:
        """
        Get Slack channel information

        Args:
            channel_id: Channel ID

        Returns:
            Channel details
        """
        if not self.bot_token:
            return {
                'success': False,
                'error': 'No bot token configured'
            }

        url = f"{self.api_base_url}/conversations.info"

        params = {'channel': channel_id}
        headers = {'Authorization': f'Bearer {self.bot_token}'}

        try:
            response = requests.get(
                url,
                params=params,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if data.get('ok'):
                channel = data.get('channel', {})
                return {
                    'success': True,
                    'name': channel.get('name'),
                    'is_private': channel.get('is_private'),
                    'member_count': channel.get('num_members')
                }
            else:
                return {
                    'success': False,
                    'error': data.get('error', 'Unknown error')
                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get channel info: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Factory function
def create_slack_integration(
    webhook_url: Optional[str] = None,
    bot_token: Optional[str] = None
) -> SlackIntegration:
    """Create a Slack integration instance"""
    return SlackIntegration(webhook_url=webhook_url, bot_token=bot_token)
