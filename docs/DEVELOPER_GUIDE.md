# 📚 Developer Guide - Skemya Form Builder

> Complete guide for developers working on the Skemya form builder platform

**Last Updated**: 2025-01-06
**Target Audience**: Frontend & Backend Developers, DevOps Engineers

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Development Workflow](#development-workflow)
4. [Frontend Development](#frontend-development)
5. [Backend Development](#backend-development)
6. [Testing Guide](#testing-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0
- **Python** 3.12+
- **PostgreSQL** 16+
- **Redis** 7+
- **ClickHouse** (optional, for analytics)

### Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/form-builder.git
cd form-builder

# 2. Install frontend dependencies
pnpm install

# 3. Setup backend
cd services/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 4. Setup environment
cp .env.example .env
# Edit .env with your local settings

# 5. Setup database
createdb forms_db
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. Start development servers
# Terminal 1 - Frontend
pnpm dev

# Terminal 2 - Backend
cd services/api
python manage.py runserver 8000

# Terminal 3 - Celery worker (optional)
celery -A api worker -l info
```

### Verify Setup

```bash
# Check frontend
open http://localhost:3301

# Check backend API
curl http://localhost:8000/api/v1/health

# Run tests
pnpm test
cd services/api && pytest
```

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                           │
├─────────────────────────────────────────────────────────────┤
│  apps/marketing (3300)  │  apps/builder (3301)             │
│  Next.js 14 Marketing   │  Next.js 14 Builder              │
└──────────────┬──────────┴───────────────┬──────────────────┘
               │                          │
               │                          │
               ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│              services/api (Django 5 + DRF)                    │
│  ┌─────────────┬─────────────┬──────────────┬──────────────┐│
│  │   Forms     │ Submissions │  Webhooks    │  Importers   ││
│  │   API       │    API      │    API       │     API      ││
│  └─────────────┴─────────────┴──────────────┴──────────────┘│
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    Data Layer                              │
│  ┌──────────────┬──────────────┬────────────────────────┐ │
│  │  PostgreSQL  │    Redis     │     ClickHouse         │ │
│  │  (Forms DB)  │  (Cache/Q)   │    (Analytics)         │ │
│  └──────────────┴──────────────┴────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
form_builder/
├── apps/                       # Applications
│   ├── builder/               # Form builder app (Next.js 14)
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   ├── lib/             # Utilities, stores, API clients
│   │   └── styles/          # Global styles
│   ├── marketing/            # Marketing site (Next.js 14)
│   └── runtime-demo/         # Runtime demo app
│
├── packages/                  # Shared packages
│   ├── runtime/              # Form runtime (<30KB)
│   ├── ui/                   # Shared UI components (shadcn)
│   ├── contracts/            # TypeScript types/schemas
│   └── analytics/            # Analytics client
│
├── services/                  # Backend services
│   ├── api/                  # Django REST API
│   │   ├── core/            # Core models (User, Org)
│   │   ├── forms/           # Forms app
│   │   ├── submissions/     # Submissions app
│   │   ├── webhooks/        # Webhooks app
│   │   └── importers/       # Import services
│   ├── ingest/              # Edge function for submissions
│   └── workers/             # Celery workers
│
└── e2e/                      # End-to-end tests (Playwright)
```

---

## 💻 Development Workflow

### Daily Development

```bash
# Start all services
pnpm dev  # Starts all apps in watch mode

# Or start individually
pnpm --filter @skemya/builder dev
pnpm --filter @skemya/marketing dev
```

### Making Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes** - Follow [Coding Standards](#coding-standards)

3. **Test Locally**
   ```bash
   # Quick validation
   pnpm test:quick

   # Complete validation
   pnpm test:complete
   ```

4. **Commit Changes**
   ```bash
   # Husky pre-commit hooks will run automatically
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `docs:` - Documentation
- `chore:` - Maintenance tasks
- `perf:` - Performance improvement

**Examples**:
```bash
git commit -m "feat(builder): add drag & drop for blocks"
git commit -m "fix(api): correct form validation logic"
git commit -m "test(runtime): add unit tests for autosave"
```

---

## ⚛️ Frontend Development

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 19 RC
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + Immer
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios
- **Testing**: Jest + React Testing Library

### Project Structure

```
apps/builder/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Auth routes
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/           # Dashboard page
│   ├── forms/              # Forms routes
│   │   └── [id]/
│   │       ├── edit/       # Form builder
│   │       ├── submissions/ # View submissions
│   │       └── analytics/   # Analytics
│   └── layout.tsx
│
├── components/              # React components
│   ├── builder/            # Form builder components
│   │   ├── BlockLibrary/
│   │   ├── Canvas/
│   │   ├── Inspector/
│   │   └── Toolbar/
│   ├── blocks/            # Block type components
│   └── ui/                # shadcn/ui components
│
├── lib/                    # Utilities & logic
│   ├── api/               # API clients
│   ├── stores/            # Zustand stores
│   ├── hooks/             # Custom React hooks
│   ├── validators/        # Validation logic
│   └── utils.ts           # Helper functions
│
└── styles/                # Global styles
```

### State Management with Zustand

**Form Builder Store** (`lib/stores/form-builder-store.ts`):

```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface FormBuilderState {
  form: Form | null;
  selectedBlockId: string | null;
  isDirty: boolean;
  history: Form[];
  historyIndex: number;

  // Actions
  setForm: (form: Form) => void;
  addBlock: (block: Block, pageId: string, index?: number) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (blockId: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useFormBuilderStore = create<FormBuilderState>()(
  immer((set, get) => ({
    form: null,
    selectedBlockId: null,
    isDirty: false,
    history: [],
    historyIndex: -1,

    setForm: (form) => set({ form, history: [form], historyIndex: 0 }),

    addBlock: (block, pageId, index) => {
      set((state) => {
        const page = state.form?.pages.find(p => p.id === pageId);
        if (page) {
          if (index !== undefined) {
            page.blocks.splice(index, 0, block);
          } else {
            page.blocks.push(block);
          }
          state.isDirty = true;
        }
      });
      get().saveHistory();
    },

    // ... more actions
  }))
);
```

### Drag & Drop System

**Key Components**:

1. **FormBuilder.tsx** - DndContext provider
2. **BlockLibrary/BlockItem.tsx** - Draggable blocks
3. **Canvas/BlockRenderer.tsx** - Droppable targets

**Implementation Example**:

```typescript
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

// Draggable block
function BlockItem({ block }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `new-${block.type}`,
    data: { type: "new-block", blockType: block.type },
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      {block.label}
    </div>
  );
}

// Drop handler
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.data.current?.type === "new-block") {
    addBlock(createBlock(active.data.current.blockType), over.id);
  }
}
```

### API Client

**Forms API** (`lib/api/forms.ts`):

```typescript
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const formsApi = {
  list: async () => {
    const { data } = await axios.get(`${API_BASE}/api/v1/forms/`);
    return data;
  },

  get: async (id: string) => {
    const { data } = await axios.get(`${API_BASE}/api/v1/forms/${id}/`);
    return data;
  },

  create: async (formData: CreateFormData) => {
    const { data } = await axios.post(`${API_BASE}/api/v1/forms/`, formData);
    return data;
  },

  update: async (id: string, updates: Partial<Form>) => {
    const { data } = await axios.patch(`${API_BASE}/api/v1/forms/${id}/`, updates);
    return data;
  },

  publish: async (id: string, canaryPercentage = 0) => {
    const { data } = await axios.post(`${API_BASE}/api/v1/forms/${id}/publish/`, {
      canary_percentage: canaryPercentage,
    });
    return data;
  },
};
```

### Component Best Practices

1. **Use TypeScript strictly**
   ```typescript
   // ✅ Good
   interface ButtonProps {
     onClick: () => void;
     children: React.ReactNode;
     variant?: "primary" | "secondary";
   }

   // ❌ Bad
   function Button(props: any) { ... }
   ```

2. **Extract reusable logic to hooks**
   ```typescript
   // hooks/use-form-autosave.ts
   export function useFormAutosave(formId: string) {
     const { form, isDirty } = useFormBuilderStore();

     useEffect(() => {
       if (!isDirty) return;

       const timer = setTimeout(async () => {
         await formsApi.update(formId, form);
       }, 2000);

       return () => clearTimeout(timer);
     }, [form, isDirty, formId]);
   }
   ```

3. **Optimize re-renders**
   ```typescript
   // Use React.memo for expensive components
   const BlockRenderer = React.memo(({ block }) => {
     // ...
   });

   // Use useCallback for event handlers
   const handleClick = useCallback(() => {
     selectBlock(block.id);
   }, [block.id, selectBlock]);
   ```

---

## 🐍 Backend Development

### Technology Stack

- **Framework**: Django 5.0
- **API**: Django REST Framework 3.14
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **Task Queue**: Celery 5.3
- **Analytics**: ClickHouse
- **Testing**: pytest + pytest-django

### Project Structure

```
services/api/
├── api/                    # Django project settings
│   ├── settings/
│   ├── urls.py
│   └── wsgi.py
│
├── core/                   # Core app (User, Org, Auth)
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── permissions.py
│   └── tests/
│
├── forms/                  # Forms app
│   ├── models.py          # Form, FormVersion
│   ├── views.py           # FormViewSet
│   ├── serializers.py
│   ├── filters.py
│   └── tests/
│
├── submissions/            # Submissions app
│   ├── models.py          # Submission, Answer
│   ├── views.py
│   └── tests/
│
├── webhooks/              # Webhooks app
│   ├── models.py         # Webhook, WebhookDelivery
│   ├── tasks.py          # Celery tasks
│   └── tests/
│
└── importers/            # Import services
    ├── base.py           # Base importer
    ├── typeform.py
    ├── google_forms.py
    └── tests/
```

### Models

**Form Model** (`forms/models.py`):

```python
from django.db import models
from core.models import BaseModel, Organization, User

class Form(BaseModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    # JSON fields for flexible schema
    pages = models.JSONField(default=list)
    logic = models.JSONField(default=dict)
    theme = models.JSONField(default=dict)
    settings = models.JSONField(default=dict)

    # Metadata
    submission_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['organization', 'slug']]
```

### ViewSets

**Form ViewSet** (`forms/views.py`):

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return self.queryset.filter(
            organization__memberships__user=self.request.user
        ).distinct()

    @extend_schema(
        summary="Publish a form",
        request={"canary_percentage": int},
        responses={200: {"status": "published"}}
    )
    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        form = self.get_object()
        form.status = "published"
        form.save()
        return Response({"status": "published"})
```

### Serializers

```python
from rest_framework import serializers

class FormSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = Form
        fields = [
            'id', 'title', 'description', 'slug', 'status',
            'pages', 'logic', 'theme', 'settings',
            'submission_count', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'submission_count']

    def validate_pages(self, value):
        """Validate pages structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Pages must be a list")
        return value
```

### Celery Tasks

**Webhook Delivery** (`webhooks/tasks.py`):

```python
from celery import shared_task
import hmac
import hashlib

@shared_task(bind=True, max_retries=7)
def deliver_webhook(self, webhook_id, submission_id):
    webhook = Webhook.objects.get(id=webhook_id)
    submission = Submission.objects.get(id=submission_id)

    # Generate HMAC signature
    payload = json.dumps(submission.to_dict())
    signature = hmac.new(
        webhook.secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    headers = {
        'X-Webhook-Signature': f'sha256={signature}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(
            webhook.url,
            data=payload,
            headers=headers,
            timeout=30
        )
        response.raise_for_status()

        # Log successful delivery
        WebhookDelivery.objects.create(
            webhook=webhook,
            submission=submission,
            status='success',
            response_code=response.status_code
        )
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

### Testing

```python
import pytest
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestFormAPI:
    def test_create_form(self, authenticated_client, organization):
        data = {
            'organization_id': str(organization.id),
            'title': 'Test Form',
            'status': 'draft'
        }

        response = authenticated_client.post('/api/v1/forms/', data)
        assert response.status_code == 201
        assert response.data['title'] == 'Test Form'
```

---

## 🧪 Testing Guide

### Frontend Tests

**Unit Tests** (Jest + React Testing Library):

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:ci
```

**Example Test**:

```typescript
import { render, screen } from '@testing-library/react';
import { BlockItem } from './BlockItem';

describe('BlockItem', () => {
  it('renders block label', () => {
    const block = {
      type: 'short_text',
      label: 'Short Text',
      icon: TypeIcon,
      description: 'Single line input'
    };

    render(<BlockItem block={block} />);
    expect(screen.getByText('Short Text')).toBeInTheDocument();
  });
});
```

### Backend Tests

```bash
# Run all tests
cd services/api
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest forms/tests/test_forms_api.py

# Run specific test
pytest forms/tests/test_forms_api.py::TestFormAPI::test_create_form
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in UI mode
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e e2e/complete-form-workflow.spec.ts
```

---

## 🚀 Deployment

### Build Process

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @skemya/builder build
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: `Module not found` errors
```bash
# Solution: Clean install
rm -rf node_modules
pnpm install
```

**Issue**: Django migrations conflict
```bash
# Solution: Reset migrations
python manage.py migrate --fake-zero appname
python manage.py migrate appname
```

**Issue**: Port already in use
```bash
# Solution: Kill process
lsof -ti:3301 | xargs kill -9
```

---

## ✨ Best Practices

### Code Quality

1. **Always run tests before commit**
2. **Use TypeScript strictly** - no `any` types
3. **Follow ESLint rules** - fix all warnings
4. **Write meaningful commit messages**
5. **Keep functions small** - single responsibility
6. **Document complex logic** - comments where needed

### Performance

1. **Optimize bundle size** - check with `pnpm test:perf`
2. **Lazy load heavy components**
3. **Use React.memo judiciously**
4. **Index database queries**
5. **Cache API responses**

### Security

1. **Never commit secrets** - use `.env`
2. **Validate all user input**
3. **Use HMAC for webhooks**
4. **Sanitize HTML content**
5. **Rate limit API endpoints**

---

## 📞 Support

- **Documentation**: `/docs`
- **Issues**: [GitHub Issues](https://github.com/your-org/form-builder/issues)
- **Slack**: #form-builder-dev

---

*Last updated: 2025-01-06*
