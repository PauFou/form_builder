# API Documentation

Base URL: `https://api.forms.io/v1`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh": "eyJ..."
}
```

### Using Tokens

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJ...
```

## Forms

### List Forms

```http
GET /forms?page=1&limit=20&status=published
```

**Query Parameters:**

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (draft, published, archived)
- `search` (string): Search in title and description

**Response:**

```json
{
  "results": [
    {
      "id": "form_123",
      "title": "Customer Feedback",
      "description": "Tell us what you think",
      "status": "published",
      "submission_count": 156,
      "created_at": "2024-03-15T10:00:00Z",
      "updated_at": "2024-03-15T14:30:00Z"
    }
  ],
  "count": 42,
  "next": "/v1/forms?page=2",
  "previous": null
}
```

### Get Form

```http
GET /forms/{form_id}
```

**Response:**

```json
{
  "id": "form_123",
  "title": "Customer Feedback",
  "description": "Tell us what you think",
  "status": "published",
  "pages": [
    {
      "id": "page_1",
      "title": "Personal Information",
      "blocks": [
        {
          "id": "name",
          "type": "text",
          "title": "What's your name?",
          "required": true,
          "validation": [
            {
              "type": "min",
              "value": 2,
              "message": "Name must be at least 2 characters"
            }
          ]
        }
      ]
    }
  ],
  "logic": [],
  "theme": {
    "colors": {
      "primary": "#3b82f6"
    }
  },
  "settings": {
    "submitLabel": "Submit",
    "showProgressBar": true
  }
}
```

### Create Form

```http
POST /forms
Content-Type: application/json

{
  "title": "New Form",
  "description": "Form description",
  "pages": [
    {
      "id": "page_1",
      "blocks": []
    }
  ]
}
```

### Update Form

```http
PUT /forms/{form_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "pages": [...]
}
```

### Delete Form

```http
DELETE /forms/{form_id}
```

### Publish Form

```http
POST /forms/{form_id}/publish
Content-Type: application/json

{
  "canary_percentage": 10  // Optional: percentage for canary deployment
}
```

## Submissions

### List Submissions

```http
GET /forms/{form_id}/submissions?page=1&limit=50
```

**Query Parameters:**

- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): Filter by status (complete, partial)
- `from` (datetime): Start date (ISO 8601)
- `to` (datetime): End date (ISO 8601)
- `search` (string): Search in answers
- `tags` (array): Filter by tags

**Response:**

```json
{
  "results": [
    {
      "id": "sub_456",
      "form_id": "form_123",
      "respondent_id": "resp_789",
      "status": "complete",
      "answers": {
        "name": "John Doe",
        "email": "john@example.com",
        "rating": 5
      },
      "metadata": {
        "device": "desktop",
        "browser": "Chrome",
        "duration_seconds": 120
      },
      "created_at": "2024-03-15T10:30:00Z",
      "completed_at": "2024-03-15T10:32:00Z"
    }
  ],
  "count": 156,
  "next": "/v1/forms/form_123/submissions?page=2",
  "previous": null
}
```

### Get Submission

```http
GET /submissions/{submission_id}
```

### Export Submissions

```http
POST /forms/{form_id}/submissions/export
Content-Type: application/json

{
  "format": "csv",  // csv, excel, json
  "filters": {
    "from": "2024-03-01T00:00:00Z",
    "to": "2024-03-31T23:59:59Z",
    "status": "complete"
  },
  "fields": ["name", "email", "rating"],  // Optional: specific fields
  "include_metadata": true
}
```

**Response:**

```json
{
  "export_id": "exp_123",
  "status": "processing",
  "download_url": null // Will be available when ready
}
```

### Check Export Status

```http
GET /exports/{export_id}
```

## Webhooks

### List Webhooks

```http
GET /webhooks
```

### Create Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhook",
  "events": ["submission.created", "submission.updated"],
  "headers": {
    "X-Custom-Header": "value"
  },
  "include_partials": true
}
```

**Response:**

```json
{
  "id": "webhook_123",
  "url": "https://example.com/webhook",
  "events": ["submission.created", "submission.updated"],
  "secret": "whsec_a1b2c3d4e5f6", // Use for HMAC verification
  "active": true,
  "created_at": "2024-03-15T10:00:00Z"
}
```

### Update Webhook

```http
PUT /webhooks/{webhook_id}
Content-Type: application/json

{
  "url": "https://example.com/new-webhook",
  "active": true
}
```

### Delete Webhook

```http
DELETE /webhooks/{webhook_id}
```

### Test Webhook

```http
POST /webhooks/{webhook_id}/test
```

### Webhook Deliveries

```http
GET /webhooks/{webhook_id}/deliveries?status=failed
```

### Retry Failed Delivery

```http
POST /webhook-deliveries/{delivery_id}/retry
```

## Integrations

### List Available Integrations

```http
GET /integrations
```

### Connect Integration

```http
POST /integrations/{integration_type}/connect
Content-Type: application/json

{
  "config": {
    // Integration-specific config
  }
}
```

**For OAuth integrations:**

```http
GET /integrations/{integration_type}/authorize?redirect_uri=https://app.forms.io/integrations/callback
```

### List Connections

```http
GET /integrations/connections
```

### Update Connection

```http
PUT /integrations/connections/{connection_id}
Content-Type: application/json

{
  "config": {
    "spreadsheet_id": "new_id"
  }
}
```

### Delete Connection

```http
DELETE /integrations/connections/{connection_id}
```

## Analytics

### Form Analytics

```http
GET /analytics/forms/{form_id}?start_date=2024-03-01&end_date=2024-03-31
```

**Response:**

```json
{
  "form_id": "form_123",
  "period": {
    "start": "2024-03-01T00:00:00Z",
    "end": "2024-03-31T23:59:59Z"
  },
  "metrics": {
    "views": 5432,
    "starts": 3210,
    "completions": 2156,
    "completion_rate": 0.671,
    "avg_time_seconds": 145,
    "drop_off_rate": 0.329
  },
  "device_breakdown": {
    "desktop": 3456,
    "mobile": 1654,
    "tablet": 322
  },
  "top_drop_offs": [
    {
      "page_id": "page_3",
      "field_id": "phone",
      "drop_count": 234
    }
  ]
}
```

### Funnel Analysis

```http
GET /analytics/forms/{form_id}/funnel
```

### Real-time Stats

```http
GET /analytics/forms/{form_id}/realtime
```

## Import

### Import from Typeform

```http
POST /forms/import
Content-Type: application/json

{
  "type": "typeform",
  "source": "https://form.typeform.com/to/abcdef",
  "credentials": {
    "access_token": "tfp_xxxxxxxxxxxx"
  }
}
```

### Import from Google Forms

```http
POST /forms/import
Content-Type: application/json

{
  "type": "google_forms",
  "source": "https://docs.google.com/forms/d/abc123/edit"
}
```

### Validate Import Source

```http
POST /forms/import/validate
Content-Type: application/json

{
  "type": "typeform",
  "source": "abcdef"
}
```

### Preview Import

```http
POST /forms/import/preview
Content-Type: application/json

{
  "type": "typeform",
  "source": "abcdef",
  "credentials": {
    "access_token": "tfp_xxxxxxxxxxxx"
  }
}
```

## Rate Limits

- **Standard**: 1000 requests per hour
- **Authenticated**: 5000 requests per hour
- **Submissions**: 100 per minute per form

Rate limit headers:

```http
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4998
X-RateLimit-Reset: 1710500000
```

## Error Responses

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input data",
    "details": {
      "title": ["This field is required"],
      "pages": ["Must contain at least one page"]
    }
  }
}
```

Common error codes:

- `authentication_required`: Missing or invalid token
- `permission_denied`: Insufficient permissions
- `not_found`: Resource not found
- `validation_error`: Invalid input data
- `rate_limit_exceeded`: Too many requests
- `internal_error`: Server error

## Webhooks

Webhook requests include:

**Headers:**

```http
X-Forms-Signature: sha256=a1b2c3d4e5f6...
X-Forms-Event: submission.created
X-Forms-Delivery-ID: del_123
Content-Type: application/json
```

**Payload:**

```json
{
  "id": "evt_123",
  "type": "submission.created",
  "created_at": "2024-03-15T10:30:00Z",
  "data": {
    "submission": {
      "id": "sub_456",
      "form_id": "form_123",
      "answers": {...},
      "metadata": {...}
    }
  }
}
```

### Verifying Webhook Signatures

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

## SDKs

Official SDKs available:

- JavaScript/TypeScript: `npm install @forms/sdk`
- Python: `pip install forms-sdk`
- PHP: `composer require forms/sdk`

Example usage:

```javascript
import { FormsClient } from "@forms/sdk";

const client = new FormsClient({
  apiKey: "your_api_key",
});

// List forms
const forms = await client.forms.list();

// Get submissions
const submissions = await client.forms.get("form_123").submissions.list({ limit: 100 });
```
