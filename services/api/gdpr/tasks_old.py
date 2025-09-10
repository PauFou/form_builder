from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
import json
import csv
import io
import boto3
import uuid
from typing import Dict, List

from .models import (
    DataDeletionRequest, DataExportRequest, DataRetentionPolicy,
    PIIFieldConfig, PIIEncryption, ConsentRecord
)
from core.models import (
    Submission, Answer, Partial, AuditLog, User, Organization
)


@shared_task(bind=True, max_retries=3)
def process_deletion_request(self, request_id: str, processor_id: str):
    """Process a data deletion request"""
    try:
        deletion_request = DataDeletionRequest.objects.get(id=request_id)
        processor = User.objects.get(id=processor_id)
        
        deletion_report = {
            'started_at': timezone.now().isoformat(),
            'deleted_items': {}
        }
        
        if deletion_request.scope == 'all':
            # Delete all data for the requester
            deleted_counts = self._delete_all_data(
                deletion_request.requester_email,
                deletion_request.organization
            )
            deletion_report['deleted_items'] = deleted_counts
            
        elif deletion_request.scope == 'form':
            # Delete data for specific form
            deleted_counts = self._delete_form_data(
                deletion_request.requester_email,
                deletion_request.form
            )
            deletion_report['deleted_items'] = deleted_counts
            
        elif deletion_request.scope == 'submission':
            # Delete specific submissions
            deleted_count = self._delete_submissions(
                deletion_request.submission_ids
            )
            deletion_report['deleted_items']['submissions'] = deleted_count
        
        # Update request status
        deletion_request.status = 'completed'
        deletion_request.processed_at = timezone.now()
        deletion_request.processed_by = processor
        deletion_request.deletion_report = deletion_report
        deletion_request.save()
        
        # Send completion email
        send_mail(
            subject="Data Deletion Request Completed",
            message=f"""
            Hello {deletion_request.requester_name},
            
            Your data deletion request has been completed successfully.
            
            Summary of deleted data:
            {json.dumps(deletion_report['deleted_items'], indent=2)}
            
            This action is permanent and cannot be undone.
            
            Best regards,
            The Platform Team
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[deletion_request.requester_email],
        )
        
        # Log the deletion
        AuditLog.objects.create(
            organization=deletion_request.organization,
            actor=processor,
            action='data_deletion_completed',
            entity='deletion_request',
            entity_id=str(deletion_request.id),
            diff_json=deletion_report
        )
        
    except Exception as e:
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


    def _delete_all_data(self, email: str, organization: Organization) -> Dict[str, int]:
        """Delete all data for a user in an organization"""
        deleted_counts = {}
        
        # Delete submissions
        submissions = Submission.objects.filter(
            form__organization=organization,
            metadata_json__contains={'respondent_email': email}
        )
        deleted_counts['submissions'] = submissions.count()
        
        # Delete answers
        answer_count = Answer.objects.filter(
            submission__in=submissions
        ).count()
        deleted_counts['answers'] = answer_count
        
        # Delete the data
        submissions.delete()
        
        # Delete partial submissions
        partials = Partial.objects.filter(
            form__organization=organization,
            value_json__contains={'email': email}
        )
        deleted_counts['partials'] = partials.count()
        partials.delete()
        
        # Delete consent records
        consents = ConsentRecord.objects.filter(
            form__organization=organization,
            respondent_identifier=email
        )
        deleted_counts['consent_records'] = consents.count()
        consents.delete()
        
        return deleted_counts

    def _delete_form_data(self, email: str, form) -> Dict[str, int]:
        """Delete data for a specific form"""
        deleted_counts = {}
        
        # Delete submissions for this form
        submissions = Submission.objects.filter(
            form=form,
            metadata_json__contains={'respondent_email': email}
        )
        deleted_counts['submissions'] = submissions.count()
        
        # Delete answers
        answer_count = Answer.objects.filter(
            submission__in=submissions
        ).count()
        deleted_counts['answers'] = answer_count
        
        # Delete the data
        submissions.delete()
        
        # Delete partial submissions
        partials = Partial.objects.filter(
            form=form,
            value_json__contains={'email': email}
        )
        deleted_counts['partials'] = partials.count()
        partials.delete()
        
        # Delete consent records
        consents = ConsentRecord.objects.filter(
            form=form,
            respondent_identifier=email
        )
        deleted_counts['consent_records'] = consents.count()
        consents.delete()
        
        return deleted_counts

    def _delete_submissions(self, submission_ids: List[str]) -> int:
        """Delete specific submissions"""
        submissions = Submission.objects.filter(id__in=submission_ids)
        count = submissions.count()
        submissions.delete()
        return count


@shared_task(bind=True, max_retries=3)
def process_export_request(self, request_id: str):
    """Process a data export request"""
    try:
        export_request = DataExportRequest.objects.get(id=request_id)
        export_request.status = 'processing'
        export_request.save()
        
        # Collect data based on request scope
        export_data = {
            'export_date': timezone.now().isoformat(),
            'requester': export_request.requester_email,
            'organization': export_request.organization.name
        }
        
        if export_request.include_submissions:
            submissions_data = self._collect_submissions(
                export_request.requester_email,
                export_request.organization
            )
            export_data['submissions'] = submissions_data
        
        if export_request.include_partial_submissions:
            partials_data = self._collect_partials(
                export_request.requester_email,
                export_request.organization
            )
            export_data['partial_submissions'] = partials_data
        
        if export_request.include_consent_records:
            consent_data = self._collect_consent_records(
                export_request.requester_email,
                export_request.organization
            )
            export_data['consent_records'] = consent_data
        
        if export_request.include_audit_logs:
            audit_data = self._collect_audit_logs(
                export_request.requester_email,
                export_request.organization
            )
            export_data['audit_logs'] = audit_data
        
        # Generate export file
        file_url, file_size = self._generate_export_file(
            export_data,
            export_request.export_format,
            export_request.id
        )
        
        # Update request
        export_request.status = 'completed'
        export_request.processed_at = timezone.now()
        export_request.export_url = file_url
        export_request.export_size_bytes = file_size
        export_request.expires_at = timezone.now() + timedelta(days=7)
        export_request.save()
        
        # Send completion email
        send_mail(
            subject="Your Data Export is Ready",
            message=f"""
            Hello,
            
            Your data export request has been completed successfully.
            
            You can download your data from the following link:
            {file_url}
            
            This link will expire in 7 days.
            
            File size: {file_size / 1024 / 1024:.2f} MB
            Format: {export_request.export_format.upper()}
            
            Best regards,
            The Platform Team
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[export_request.requester_email],
        )
        
    except Exception as e:
        export_request.status = 'failed'
        export_request.save()
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


    def _collect_submissions(self, email: str, organization: Organization) -> List[Dict]:
        """Collect submission data for export"""
        submissions = Submission.objects.filter(
        form__organization=organization,
        metadata_json__contains={'respondent_email': email}
    ).select_related('form').prefetch_related('answers')
    
    submissions_data = []
    pii_configs = {}  # Cache PII configurations
    
    for submission in submissions:
        # Get PII configuration for this form
        if submission.form.id not in pii_configs:
            pii_configs[submission.form.id] = {
                config.field_id: config
                for config in PIIFieldConfig.objects.filter(form=submission.form)
            }
        
        form_pii_config = pii_configs[submission.form.id]
        
        # Prepare submission data
        submission_data = {
            'id': str(submission.id),
            'form_id': str(submission.form.id),
            'form_title': submission.form.title,
            'submitted_at': submission.completed_at.isoformat() if submission.completed_at else None,
            'locale': submission.locale,
            'answers': []
        }
        
        # Process answers with PII handling
        for answer in submission.answers.all():
            answer_value = answer.value_json
            
            # Check if this field needs PII handling
            if answer.block_id in form_pii_config:
                config = form_pii_config[answer.block_id]
                
                if config.mask_in_exports:
                    # Mask the value
                    if isinstance(answer_value, str):
                        answer_value = PIIEncryption.mask(
                            answer_value,
                            config.masking_pattern
                        )
                
                # Note: We don't decrypt here for security
            
            submission_data['answers'].append({
                'block_id': answer.block_id,
                'type': answer.type,
                'value': answer_value
            })
        
        submissions_data.append(submission_data)
    
    return submissions_data


    def _collect_partials(self, email: str, organization: Organization) -> List[Dict]:
    """Collect partial submission data for export"""
    partials = Partial.objects.filter(
        form__organization=organization,
        value_json__contains={'email': email}
    ).select_related('form')
    
    partials_data = []
    for partial in partials:
        partials_data.append({
            'id': str(partial.id),
            'form_id': str(partial.form.id),
            'form_title': partial.form.title,
            'last_step': partial.last_step,
            'updated_at': partial.updated_at.isoformat(),
            'data': partial.value_json  # Consider masking PII here too
        })
    
    return partials_data


    def _collect_consent_records(self, email: str, organization: Organization) -> List[Dict]:
    """Collect consent records for export"""
    consents = ConsentRecord.objects.filter(
        form__organization=organization,
        respondent_identifier=email
    ).select_related('form')
    
    consent_data = []
    for consent in consents:
        consent_data.append({
            'id': str(consent.id),
            'form_id': str(consent.form.id),
            'form_title': consent.form.title,
            'consent_type': consent.consent_type,
            'granted': consent.granted,
            'consent_text': consent.consent_text,
            'granted_at': consent.created_at.isoformat(),
            'withdrawn_at': consent.withdrawal_date.isoformat() if consent.withdrawal_date else None
        })
    
    return consent_data


    def _collect_audit_logs(self, email: str, organization: Organization) -> List[Dict]:
    """Collect audit logs for export (if permitted)"""
    # Only include logs related to the user's own actions
    user = User.objects.filter(email=email).first()
    if not user:
        return []
    
    logs = AuditLog.objects.filter(
        organization=organization,
        actor=user
    ).order_by('-created_at')[:1000]  # Limit to recent 1000 entries
    
    audit_data = []
    for log in logs:
        audit_data.append({
            'id': str(log.id),
            'action': log.action,
            'entity': log.entity,
            'entity_id': log.entity_id,
            'timestamp': log.created_at.isoformat()
        })
    
    return audit_data


    def _generate_export_file(self, data: Dict, format: str, request_id: str) -> tuple:
    """Generate export file and upload to S3"""
    filename = f"gdpr-export-{request_id}.{format}"
    
    if format == 'json':
        file_content = json.dumps(data, indent=2).encode('utf-8')
    elif format == 'csv':
        # Flatten JSON to CSV (simplified - real implementation would be more complex)
        file_content = self._json_to_csv(data).encode('utf-8')
    elif format == 'parquet':
        # Would use pandas/pyarrow here
        file_content = json.dumps(data).encode('utf-8')  # Placeholder
    
    # Upload to S3 (or compatible storage)
    s3 = boto3.client('s3')
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    key = f"gdpr-exports/{filename}"
    
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=file_content,
        ContentType='application/json' if format == 'json' else 'text/csv',
        ServerSideEncryption='AES256'
    )
    
    # Generate presigned URL
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=7 * 24 * 3600  # 7 days
    )
    
    return url, len(file_content)


    def _json_to_csv(self, data: Dict) -> str:
    """Convert JSON data to CSV format (simplified)"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # This is a simplified version - real implementation would handle nested data better
    if 'submissions' in data:
        writer.writerow(['Type', 'Form', 'Submitted At', 'Field', 'Value'])
        for submission in data['submissions']:
            for answer in submission.get('answers', []):
                writer.writerow([
                    'Submission',
                    submission['form_title'],
                    submission.get('submitted_at', ''),
                    answer['block_id'],
                    str(answer['value'])
                ])
    
    return output.getvalue()


@shared_task
def cleanup_expired_data():
    """Periodic task to clean up expired data based on retention policies"""
    # Process organization-wide policies
    org_policies = DataRetentionPolicy.objects.filter(
        form__isnull=True,
        auto_delete_enabled=True
    )
    
    for policy in org_policies:
        # Delete old submissions
        if policy.submission_retention_days > 0:
            cutoff_date = timezone.now() - timedelta(days=policy.submission_retention_days)
            old_submissions = Submission.objects.filter(
                form__organization=policy.organization,
                completed_at__lt=cutoff_date
            )
            
            # Send notification if configured
            if policy.deletion_notification_days > 0:
                notification_date = cutoff_date + timedelta(days=policy.deletion_notification_days)
                submissions_to_notify = old_submissions.filter(
                    completed_at__gte=notification_date - timedelta(days=1),
                    completed_at__lt=notification_date
                )
                for submission in submissions_to_notify:
                    # Send notification (implement notification logic)
                    pass
            
            # Delete submissions past retention period
            deleted_count = old_submissions.delete()[0]
            if deleted_count > 0:
                AuditLog.objects.create(
                    organization=policy.organization,
                    actor=None,
                    action='auto_deletion',
                    entity='submissions',
                    entity_id=policy.organization.id,
                    diff_json={'deleted_count': deleted_count, 'policy_id': str(policy.id)}
                )
        
        # Delete old partial submissions
        if policy.partial_retention_days > 0:
            cutoff_date = timezone.now() - timedelta(days=policy.partial_retention_days)
            old_partials = Partial.objects.filter(
                form__organization=policy.organization,
                updated_at__lt=cutoff_date
            )
            deleted_count = old_partials.delete()[0]
            if deleted_count > 0:
                AuditLog.objects.create(
                    organization=policy.organization,
                    actor=None,
                    action='auto_deletion',
                    entity='partials',
                    entity_id=policy.organization.id,
                    diff_json={'deleted_count': deleted_count, 'policy_id': str(policy.id)}
                )
        
        # Clean up old audit logs
        if policy.audit_log_retention_days > 0:
            cutoff_date = timezone.now() - timedelta(days=policy.audit_log_retention_days)
            old_logs = AuditLog.objects.filter(
                organization=policy.organization,
                created_at__lt=cutoff_date
            )
            deleted_count = old_logs.delete()[0]
    
    # Process form-specific policies
    form_policies = DataRetentionPolicy.objects.filter(
        form__isnull=False,
        auto_delete_enabled=True
    )
    
    for policy in form_policies:
        # Similar logic but specific to the form
        pass


@shared_task
def generate_gdpr_report(organization_id: str):
    """Generate comprehensive GDPR compliance report for an organization"""
    try:
        org = Organization.objects.get(id=organization_id)
        
        report = {
            'organization': org.name,
            'generated_at': timezone.now().isoformat(),
            'data_residency': {},
            'retention_policies': [],
            'pii_fields': [],
            'consent_summary': {},
            'recent_requests': {}
        }
        
        # Data residency configuration
        if hasattr(org, 'data_residency'):
            residency = org.data_residency
            report['data_residency'] = {
                'primary_region': residency.primary_region,
                'allowed_regions': residency.allowed_regions,
                'enforce_residency': residency.enforce_residency
            }
        
        # Retention policies
        for policy in org.retention_policies.all():
            report['retention_policies'].append({
                'form': policy.form.title if policy.form else 'Organization-wide',
                'submission_retention_days': policy.submission_retention_days,
                'auto_delete_enabled': policy.auto_delete_enabled
            })
        
        # PII field configurations
        pii_configs = PIIFieldConfig.objects.filter(
            form__organization=org
        ).select_related('form')
        
        for config in pii_configs:
            report['pii_fields'].append({
                'form': config.form.title,
                'field_id': config.field_id,
                'field_type': config.field_type,
                'encrypt_at_rest': config.encrypt_at_rest,
                'mask_in_exports': config.mask_in_exports
            })
        
        # Consent statistics
        total_consents = ConsentRecord.objects.filter(
            form__organization=org
        ).count()
        
        granted_consents = ConsentRecord.objects.filter(
            form__organization=org,
            granted=True,
            withdrawal_date__isnull=True
        ).count()
        
        report['consent_summary'] = {
            'total_records': total_consents,
            'currently_granted': granted_consents,
            'withdrawal_rate': (
                ((total_consents - granted_consents) / total_consents * 100)
                if total_consents > 0 else 0
            )
        }
        
        # Recent GDPR requests
        recent_date = timezone.now() - timedelta(days=30)
        
        report['recent_requests'] = {
            'deletion_requests': org.deletion_requests.filter(
                created_at__gte=recent_date
            ).count(),
            'export_requests': org.export_requests.filter(
                created_at__gte=recent_date
            ).count()
        }
        
        return report
        
    except Exception as e:
        raise