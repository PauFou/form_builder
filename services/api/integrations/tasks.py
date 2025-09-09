from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

from .models import IntegrationLog
from .services import IntegrationService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_integration_log(self, log_id: str):
    """Process a single integration log entry"""
    try:
        log = IntegrationLog.objects.get(id=log_id)
        
        # Skip if already processed
        if log.status in ['success', 'skipped']:
            return
        
        # Get service
        service = IntegrationService()
        
        # Process based on type
        if log.submission:
            service.execute_integration(
                log.connection,
                submission=log.submission,
                trigger_event=log.trigger_event
            )
        elif log.partial:
            service.execute_integration(
                log.connection,
                partial=log.partial,
                trigger_event=log.trigger_event
            )
        
    except IntegrationLog.DoesNotExist:
        logger.error(f"IntegrationLog {log_id} not found")
    except Exception as e:
        logger.error(f"Error processing integration log {log_id}: {str(e)}")
        
        # Retry with exponential backoff
        retry_delay = 60 * (2 ** self.request.retries)
        raise self.retry(exc=e, countdown=retry_delay)


@shared_task
def retry_failed_integrations():
    """Retry failed integrations that are due"""
    logs = IntegrationLog.objects.filter(
        status='failed',
        next_retry_at__lte=timezone.now(),
        retry_count__lt=3
    )
    
    for log in logs:
        process_integration_log.delay(str(log.id))


@shared_task
def refresh_oauth_tokens():
    """Refresh OAuth tokens that are expiring soon"""
    from .models import Integration
    
    # Get integrations with tokens expiring in next hour
    expiring_soon = timezone.now() + timedelta(hours=1)
    integrations = Integration.objects.filter(
        token_expires_at__lte=expiring_soon,
        refresh_token__isnull=False,
        status='active'
    )
    
    service = IntegrationService()
    
    for integration in integrations:
        try:
            service.refresh_oauth_token(integration)
        except Exception as e:
            logger.error(f"Failed to refresh token for integration {integration.id}: {str(e)}")
            integration.status = 'error'
            integration.error_message = f"Token refresh failed: {str(e)}"
            integration.save()


@shared_task
def cleanup_old_logs():
    """Clean up old integration logs"""
    # Delete logs older than 30 days
    cutoff = timezone.now() - timedelta(days=30)
    deleted = IntegrationLog.objects.filter(
        created_at__lt=cutoff,
        status__in=['success', 'skipped']
    ).delete()
    
    logger.info(f"Deleted {deleted[0]} old integration logs")