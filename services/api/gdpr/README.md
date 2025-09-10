# GDPR Compliance Module

This module provides comprehensive GDPR (General Data Protection Regulation) compliance features for the form platform.

## Features

### 1. EU Data Residency Configuration

- Configure primary data storage region (EU regions only)
- Define allowed regions for data processing
- Enforce data residency requirements at the organization level

### 2. PII Field Masking and Encryption

- Automatic detection of PII fields in forms
- Field-level encryption at rest for sensitive data
- Configurable masking patterns for data exports
- Support for various PII types (email, phone, SSN, credit card, etc.)

### 3. Data Retention Automation

- Organization-wide or form-specific retention policies
- Automatic deletion of data after retention period
- Configurable notification before deletion
- Separate policies for submissions, partials, attachments, and audit logs

### 4. DPA (Data Processing Agreement) Templates

- Generate standard DPA templates
- Track signed agreements
- Version management
- Audit trail for signatures

### 5. Right to be Forgotten Implementation

- Process data deletion requests
- Email verification workflow
- Comprehensive deletion across all data types
- Detailed deletion reports

### 6. Data Export Functionality

- Export all user data in JSON/CSV/Parquet formats
- Include submissions, partial submissions, consent records
- Automatic PII masking in exports
- Secure download links with expiration

### 7. Consent Management

- Track consent for different purposes
- Record consent withdrawal
- Maintain consent history
- IP address and user agent tracking

## API Endpoints

### Data Residency

- `GET/POST /v1/gdpr/residency/` - Manage data residency configuration

### Retention Policies

- `GET/POST /v1/gdpr/retention/` - Manage retention policies
- `POST /v1/gdpr/retention/apply_default/` - Apply default policy

### PII Field Configuration

- `GET/POST /v1/gdpr/pii-fields/` - Manage PII field configurations
- `POST /v1/gdpr/pii-fields/auto_detect/` - Auto-detect PII fields

### Consent Records

- `GET/POST /v1/gdpr/consent/` - Manage consent records
- `POST /v1/gdpr/consent/{id}/withdraw/` - Withdraw consent

### Data Processing Agreements

- `GET/POST /v1/gdpr/dpa/` - Manage DPAs
- `GET /v1/gdpr/dpa/template/` - Get DPA template
- `POST /v1/gdpr/dpa/{id}/sign/` - Sign a DPA

### Data Deletion Requests

- `GET/POST /v1/gdpr/deletion-requests/` - Manage deletion requests
- `POST /v1/gdpr/deletion-requests/verify/` - Verify deletion request
- `POST /v1/gdpr/deletion-requests/{id}/process/` - Process deletion request

### Data Export Requests

- `GET/POST /v1/gdpr/export-requests/` - Manage export requests
- `GET /v1/gdpr/export-requests/{id}/download/` - Download exported data

### Compliance Status

- `GET /v1/gdpr/compliance/status/` - Get GDPR compliance status

## Usage Examples

### Configure Data Residency

```python
POST /v1/gdpr/residency/
{
    "organization": "org-id",
    "primary_region": "eu-west-1",
    "allowed_regions": ["eu-west-1", "eu-central-1"],
    "enforce_residency": true
}
```

### Set Retention Policy

```python
POST /v1/gdpr/retention/
{
    "organization": "org-id",
    "submission_retention_days": 365,
    "partial_retention_days": 30,
    "auto_delete_enabled": true
}
```

### Request Data Export

```python
POST /v1/gdpr/export-requests/
{
    "requester_email": "user@example.com",
    "organization": "org-id",
    "include_submissions": true,
    "include_consent_records": true,
    "export_format": "json"
}
```

## Celery Tasks

### Scheduled Tasks

Add to your Celery beat schedule:

```python
CELERY_BEAT_SCHEDULE = {
    'cleanup-expired-data': {
        'task': 'gdpr.tasks.cleanup_expired_data',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2 AM
    },
}
```

### Available Tasks

- `process_deletion_request` - Process data deletion requests
- `process_export_request` - Generate data export files
- `cleanup_expired_data` - Auto-delete data based on retention policies
- `generate_gdpr_report` - Generate compliance reports

## Management Commands

### GDPR Audit

```bash
python manage.py gdpr_audit
python manage.py gdpr_audit --org-id=<org-uuid>
python manage.py gdpr_audit --format=json
```

## Security Considerations

1. **Encryption**: All PII data is encrypted using Fernet symmetric encryption
2. **Access Control**: All endpoints require authentication and organization membership
3. **Audit Trail**: All GDPR operations are logged in the audit trail
4. **Data Isolation**: Strict organization-level data isolation
5. **Secure Export**: Export files are stored encrypted in S3 with time-limited access

## Configuration

Add to your Django settings:

```python
# GDPR Settings
GDPR_DATA_REGIONS = {
    "eu-west-1": "EU West (Ireland)",
    "eu-central-1": "EU Central (Frankfurt)",
    "eu-north-1": "EU North (Stockholm)",
}
DEFAULT_DATA_REGION = "eu-west-1"

# Encryption key for PII
ENCRYPTION_KEY = "your-32-character-encryption-key"

# AWS S3 for exports
AWS_STORAGE_BUCKET_NAME = "gdpr-exports"
AWS_S3_REGION_NAME = "eu-west-1"

# GDPR Defaults
GDPR_DEFAULT_RETENTION_DAYS = {
    "submissions": 365,
    "partials": 30,
    "attachments": 365,
    "audit_logs": 730,
}
```

## Testing

Run the GDPR test suite:

```bash
python manage.py test gdpr
```

## Compliance Checklist

- [ ] Configure data residency for EU hosting
- [ ] Set up retention policies
- [ ] Configure PII field encryption
- [ ] Sign Data Processing Agreement
- [ ] Test data export functionality
- [ ] Test deletion request workflow
- [ ] Set up automated data cleanup
- [ ] Review audit logs regularly
