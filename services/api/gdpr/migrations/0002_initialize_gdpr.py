from django.db import migrations


def initialize_gdpr_settings(apps, schema_editor):
    """Initialize default GDPR settings for existing organizations"""
    Organization = apps.get_model('core', 'Organization')
    DataResidencyConfig = apps.get_model('gdpr', 'DataResidencyConfig')
    DataRetentionPolicy = apps.get_model('gdpr', 'DataRetentionPolicy')
    
    # Create default data residency config for each org
    for org in Organization.objects.all():
        DataResidencyConfig.objects.get_or_create(
            organization=org,
            defaults={
                'primary_region': 'eu-west-1',
                'allowed_regions': ['eu-west-1', 'eu-central-1'],
                'enforce_eu_residency': True,
                'block_non_eu_webhooks': False
            }
        )
        
        # Create default retention policies
        for data_type in ['submission', 'partial', 'file', 'analytics']:
            retention_days = {
                'submission': 365,
                'partial': 30,
                'file': 365,
                'analytics': 730
            }
            
            DataRetentionPolicy.objects.get_or_create(
                organization=org,
                data_type=data_type,
                defaults={
                    'retention_days': retention_days[data_type],
                    'notify_before_days': 30 if data_type == 'submission' else 0
                }
            )


def detect_pii_fields(apps, schema_editor):
    """Auto-detect PII fields in existing forms"""
    Form = apps.get_model('forms', 'Form')
    PIIFieldConfig = apps.get_model('gdpr', 'PIIFieldConfig')
    
    pii_patterns = {
        'email': '****@****.***',
        'phone': '+** * ** ** ** **',
        'mobile': '+** *** *** ****',
        'ssn': '***-**-****',
        'address': '[ADDRESS]',
        'name': '[NAME]',
        'first_name': '[NAME]',
        'last_name': '[NAME]',
        'full_name': '[NAME]',
        'date_of_birth': '[DATE]',
        'dob': '[DATE]',
        'credit_card': '****-****-****-####',
        'bank_account': '**** **** ####',
        'iban': '**** **** **** ####',
        'passport': '[ID]',
        'driver_license': '[ID]',
        'tax_id': '[ID]',
    }
    
    for form in Form.objects.all():
        if not form.schema:
            continue
            
        # Parse form schema to find fields
        for page in form.schema.get('pages', []):
            for block in page.get('blocks', []):
                field_id = block.get('id')
                field_type = block.get('type')
                field_name = block.get('name', '').lower()
                
                # Check if field might be PII
                is_pii = False
                pattern = None
                
                # Check by field type
                if field_type in ['email', 'phone', 'address']:
                    is_pii = True
                    pattern = pii_patterns.get(field_type)
                
                # Check by field name
                for pii_name, pii_pattern in pii_patterns.items():
                    if pii_name in field_name:
                        is_pii = True
                        pattern = pii_pattern
                        break
                
                if is_pii and field_id:
                    PIIFieldConfig.objects.get_or_create(
                        form=form,
                        field_id=field_id,
                        defaults={
                            'is_pii': True,
                            'encryption_enabled': True,
                            'masking_pattern': pattern,
                            'auto_detected': True
                        }
                    )


def reverse_migration(apps, schema_editor):
    """Reverse migration - remove GDPR data"""
    DataResidencyConfig = apps.get_model('gdpr', 'DataResidencyConfig')
    DataRetentionPolicy = apps.get_model('gdpr', 'DataRetentionPolicy')
    PIIFieldConfig = apps.get_model('gdpr', 'PIIFieldConfig')
    
    # Only remove auto-created records
    DataResidencyConfig.objects.all().delete()
    DataRetentionPolicy.objects.all().delete()
    PIIFieldConfig.objects.filter(auto_detected=True).delete()


class Migration(migrations.Migration):
    
    dependencies = [
        ('gdpr', '0001_initial'),
        ('core', '0001_initial'),
        ('forms', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(
            initialize_gdpr_settings,
            reverse_migration
        ),
        migrations.RunPython(
            detect_pii_fields,
            migrations.RunPython.noop
        ),
    ]