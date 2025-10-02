"""
Analytics signal handlers
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from forms.models import Form, FormVersion, Submission
from .clickhouse_client import ClickHouseClient

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Form)
def track_form_created_or_updated(sender, instance, created, **kwargs):
    """Track form creation/update events"""
    try:
        client = ClickHouseClient()

        event_type = 'form_created' if created else 'form_updated'
        event_data = {
            'form_id': str(instance.id),
            'organization_id': str(instance.organization_id),
            'event_type': event_type,
            'timestamp': timezone.now(),
            'metadata': {
                'title': instance.title,
                'status': instance.status,
                'created_by': str(instance.created_by_id) if instance.created_by_id else None
            }
        }

        # Track in a generic events table
        success = client.insert_event('form_events', event_data)
        if success:
            logger.info(f"Form {event_type}: {instance.id}")

    except Exception as e:
        logger.error(f"Failed to track form event: {str(e)}")


@receiver(post_save, sender=FormVersion)
def track_form_published(sender, instance, created, **kwargs):
    """Track form publication events"""
    if not created or not instance.published_at:
        return

    try:
        client = ClickHouseClient()

        event_data = {
            'form_id': str(instance.form_id),
            'version': instance.version,
            'timestamp': instance.published_at,
            'metadata': {
                'canary_percent': instance.canary_percent or 100
            }
        }

        success = client.insert_event('form_publications', event_data)
        if success:
            logger.info(f"Form published: {instance.form_id} v{instance.version}")

    except Exception as e:
        logger.error(f"Failed to track form publication: {str(e)}")


@receiver(post_save, sender=Submission)
def track_submission_completed(sender, instance, created, **kwargs):
    """Track submission completion events"""
    if not created or not instance.completed_at:
        return
        
    try:
        client = ClickHouseClient()
        
        # Calculate completion time
        total_time_ms = None
        if instance.started_at and instance.completed_at:
            total_time = (instance.completed_at - instance.started_at).total_seconds()
            total_time_ms = int(total_time * 1000)
        
        event_data = {
            'submission_id': str(instance.id),
            'form_id': str(instance.form_id),
            'session_id': instance.session_id or '',
            'respondent_key': instance.respondent_key or '',
            'timestamp': instance.completed_at,
            'is_complete': True,
            'is_partial': False,
            'total_time_ms': total_time_ms,
            'completion_rate': 1.0,
            'fields_completed': len(instance.data) if instance.data else 0,
            'fields_total': len(instance.data) if instance.data else 0,
            # Device info would come from the submission tracking
            'device_type': instance.metadata.get('device_type', 'unknown') if instance.metadata else 'unknown',
            'browser': instance.metadata.get('browser', 'unknown') if instance.metadata else 'unknown',
            'os': instance.metadata.get('os', 'unknown') if instance.metadata else 'unknown',
            # Source info
            'referrer_domain': instance.metadata.get('referrer_domain', '') if instance.metadata else '',
            'utm_source': instance.metadata.get('utm_source', '') if instance.metadata else '',
            'utm_medium': instance.metadata.get('utm_medium', '') if instance.metadata else '',
            'utm_campaign': instance.metadata.get('utm_campaign', '') if instance.metadata else ''
        }
        
        success = client.insert_event('form_submissions', event_data)
        if success:
            logger.info(f"Tracked submission completion: {instance.id}")
        
    except Exception as e:
        logger.error(f"Failed to track submission: {str(e)}")