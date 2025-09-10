from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from core.models import Organization
from gdpr.models import (
    DataResidencyConfig, DataRetentionPolicy, 
    PIIFieldConfig, DataProcessingAgreement
)


class Command(BaseCommand):
    help = 'Generate GDPR compliance audit for organizations'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            help='Organization ID to audit (optional, defaults to all)'
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['text', 'json'],
            default='text',
            help='Output format'
        )
    
    def handle(self, *args, **options):
        org_id = options.get('org_id')
        output_format = options.get('format')
        
        if org_id:
            try:
                org = Organization.objects.get(id=org_id)
                self.audit_organization(org, output_format)
            except Organization.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Organization {org_id} not found')
                )
        else:
            # Audit all organizations
            for org in Organization.objects.all():
                self.audit_organization(org, output_format)
                self.stdout.write('')  # Empty line between orgs
    
    def audit_organization(self, org, output_format):
        self.stdout.write(
            self.style.SUCCESS(f'=== GDPR Audit for {org.name} ===')
        )
        
        # Check data residency
        try:
            residency = org.data_residency
            self.stdout.write(
                f'✓ Data Residency: {residency.primary_region} '
                f'(Enforced: {residency.enforce_residency})'
            )
        except DataResidencyConfig.DoesNotExist:
            self.stdout.write(
                self.style.WARNING('✗ No data residency configuration')
            )
        
        # Check retention policy
        policies = org.retention_policies.all()
        if policies.exists():
            self.stdout.write(f'✓ Retention Policies: {policies.count()}')
            for policy in policies:
                scope = policy.form.title if policy.form else 'Organization-wide'
                self.stdout.write(
                    f'  - {scope}: {policy.submission_retention_days} days '
                    f'(Auto-delete: {policy.auto_delete_enabled})'
                )
        else:
            self.stdout.write(
                self.style.WARNING('✗ No retention policies defined')
            )
        
        # Check DPA status
        dpas = org.dpas.all()
        if dpas.filter(signed=True).exists():
            latest_dpa = dpas.filter(signed=True).latest('signed_date')
            self.stdout.write(
                f'✓ DPA Signed: v{latest_dpa.version} on '
                f'{latest_dpa.signed_date.strftime("%Y-%m-%d")}'
            )
        else:
            self.stdout.write(
                self.style.WARNING('✗ No signed Data Processing Agreement')
            )
        
        # Check PII field configurations
        pii_count = PIIFieldConfig.objects.filter(
            form__organization=org
        ).count()
        if pii_count > 0:
            self.stdout.write(f'✓ PII Fields Configured: {pii_count}')
        else:
            self.stdout.write(
                self.style.WARNING('✗ No PII fields configured')
            )
        
        # Recent GDPR activities
        recent_date = timezone.now() - timedelta(days=30)
        recent_deletions = org.deletion_requests.filter(
            created_at__gte=recent_date
        ).count()
        recent_exports = org.export_requests.filter(
            created_at__gte=recent_date
        ).count()
        
        self.stdout.write('\nRecent Activity (30 days):')
        self.stdout.write(f'  - Deletion requests: {recent_deletions}')
        self.stdout.write(f'  - Export requests: {recent_exports}')
        
        # Compliance score
        score = self.calculate_compliance_score(org)
        style = self.style.SUCCESS if score >= 75 else (
            self.style.WARNING if score >= 50 else self.style.ERROR
        )
        self.stdout.write(style(f'\nCompliance Score: {score}%'))
    
    def calculate_compliance_score(self, org):
        score = 0
        
        # Data residency (25%)
        if hasattr(org, 'data_residency'):
            score += 25
        
        # Retention policy (25%)
        if org.retention_policies.exists():
            score += 25
        
        # DPA signed (25%)
        if org.dpas.filter(signed=True).exists():
            score += 25
        
        # PII fields configured (25%)
        if PIIFieldConfig.objects.filter(form__organization=org).exists():
            score += 25
        
        return score