# GDPR Compliance Guide

This document outlines how the Forms Platform ensures GDPR compliance.

## Overview

The platform implements comprehensive GDPR compliance features:

- ✅ EU Data Residency
- ✅ PII Encryption & Masking
- ✅ Data Retention Automation
- ✅ Right to be Forgotten
- ✅ Data Portability
- ✅ Consent Management
- ✅ DPA Management
- ✅ Audit Logging

## 1. EU Data Residency

All customer data is stored exclusively in EU regions:

- **Primary**: EU-West-1 (Ireland)
- **Failover**: EU-Central-1 (Frankfurt)
- **Cold Storage**: EU-North-1 (Stockholm)

### Configuration

```python
# Organization-level configuration
POST /v1/gdpr/residency/
{
  "organization": "org-123",
  "primary_region": "eu-west-1",
  "allowed_regions": ["eu-west-1", "eu-central-1"],
  "enforce_eu_residency": true
}
```

### Enforcement

- API validates all data operations against residency config
- Non-EU regions are blocked at infrastructure level
- Webhooks validate destination IPs are EU-based

## 2. PII Field Management

### Automatic PII Detection

Fields are automatically detected as PII based on:

- Field names: email, phone, ssn, address, etc.
- Field types: email, phone, address blocks
- Custom patterns via regex

### Encryption

```python
# Configure PII field
POST /v1/gdpr/pii-fields/
{
  "form": "form-123",
  "field_id": "email_field",
  "is_pii": true,
  "encryption_enabled": true,
  "masking_pattern": "****@****.***"
}
```

PII data is encrypted using Fernet (symmetric encryption):

- Unique key per organization
- Keys stored in AWS KMS
- Automatic encryption/decryption in API layer

### Masking

When exporting or displaying:

- Email: `te****@example.com`
- Phone: `+33 * ** ** ** 89`
- Credit Card: `****-****-****-5678`

## 3. Data Retention

### Policies

```python
# Organization default
POST /v1/gdpr/retention/
{
  "organization": "org-123",
  "data_type": "submission",
  "retention_days": 365,
  "notify_before_days": 30
}

# Form-specific override
POST /v1/gdpr/retention/
{
  "form": "form-123",
  "data_type": "submission",
  "retention_days": 90
}
```

### Automated Deletion

Daily Celery task runs at 2 AM UTC:

1. Identifies expired data
2. Sends notification emails (if configured)
3. Performs soft delete (30-day grace)
4. Performs hard delete after grace period
5. Logs all deletions

### Data Types

| Type        | Default Retention   | Configurable |
| ----------- | ------------------- | ------------ |
| Submissions | 365 days            | Yes          |
| Partials    | 30 days             | Yes          |
| Files       | 365 days            | Yes          |
| Logs        | 90 days             | Yes          |
| Analytics   | 730 days            | Yes          |
| Consents    | 2555 days (7 years) | No           |

## 4. Right to be Forgotten

### Request Process

1. **User Request**

```python
POST /v1/gdpr/deletion-requests/
{
  "email": "user@example.com",
  "reason": "No longer using service"
}
```

2. **Email Verification**

- Verification email sent
- User clicks link with token
- 24-hour expiration

3. **Processing**

- Status: pending → verified → processing → completed
- All data deleted within 30 days
- Deletion report generated

### What Gets Deleted

- Form submissions
- Partial submissions
- File uploads
- Analytics events
- Consent records (marked as withdrawn)
- Webhook logs

### What's Retained (Anonymized)

- Aggregate analytics
- Security logs (IPs removed)
- Financial records (legal requirement)

## 5. Data Export (Portability)

### Request Export

```python
POST /v1/gdpr/export-requests/
{
  "email": "user@example.com",
  "format": "json",  # json, csv, parquet
  "include_pii": false
}
```

### Export Contents

- All form submissions
- File attachments
- Consent history
- Account information
- Activity logs

### Security

- Email verification required
- Downloads expire after 7 days
- Presigned S3 URLs
- Optional PII masking

## 6. Consent Management

### Recording Consent

```python
POST /v1/gdpr/consent/
{
  "email": "user@example.com",
  "consent_type": "marketing",
  "consented": true,
  "consent_text": "I agree to receive marketing emails",
  "form_id": "form-123",
  "ip_address": "auto-detect",
  "user_agent": "auto-detect"
}
```

### Consent Types

- `data_processing` - Required for form submission
- `marketing` - Marketing communications
- `analytics` - Analytics tracking
- `third_party` - Sharing with integrations

### Withdrawal

```python
POST /v1/gdpr/consent/{id}/withdraw/
{
  "reason": "Too many emails"
}
```

## 7. Data Processing Agreements

### Generate DPA

```python
POST /v1/gdpr/dpa/
{
  "organization": "org-123",
  "company_name": "Customer Corp",
  "signatory_name": "John Doe",
  "signatory_email": "john@customer.com"
}
```

### DPA Features

- Dynamic PDF generation
- Version control
- Digital signatures
- Automatic updates for legal changes
- Multi-language support (EN, FR, DE)

## 8. Compliance Dashboard

### Check Status

```python
GET /v1/gdpr/compliance/status/?organization=org-123

{
  "compliant": true,
  "checks": {
    "data_residency": true,
    "retention_policy": true,
    "pii_encryption": true,
    "dpa_signed": true,
    "privacy_policy": true
  },
  "issues": [],
  "last_audit": "2025-09-10T10:00:00Z"
}
```

## 9. Audit & Reporting

### Audit Command

```bash
python manage.py gdpr_audit --organization org-123
```

Generates report:

- Data inventory
- PII field map
- Retention compliance
- Deletion request history
- Consent statistics
- Export request log

### Webhook Notifications

Configure webhooks for GDPR events:

- Deletion request received/completed
- Export ready
- Retention warning
- DPA signed

## 10. Implementation Checklist

### For Organizations

- [ ] Configure data residency
- [ ] Set retention policies
- [ ] Sign DPA
- [ ] Configure PII fields
- [ ] Test deletion process
- [ ] Review consent flows

### For Developers

- [ ] Use PII field decorators
- [ ] Handle encrypted fields properly
- [ ] Implement consent checks
- [ ] Add retention headers
- [ ] Test with GDPR mode enabled

## Best Practices

1. **Minimize Data Collection**
   - Only collect necessary fields
   - Mark PII fields explicitly
   - Use shortest retention possible

2. **Explicit Consent**
   - Separate consents for different purposes
   - Clear consent text
   - Easy withdrawal process

3. **Security First**
   - Encrypt PII at rest
   - Use TLS for transit
   - Regular security audits

4. **Transparency**
   - Clear privacy policy
   - Data usage explanations
   - Regular communication

## Support

For GDPR compliance questions:

- Email: dpo@forms.eu
- Docs: https://docs.forms.eu/gdpr
- Status: https://status.forms.eu
