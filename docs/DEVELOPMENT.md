# Development Guide

## 🏗️ Architecture Overview

### Design Principles

1. **Performance First**: <30KB runtime bundle, <200ms API response time
2. **Type Safety**: TypeScript everywhere, validated at runtime
3. **EU Data Residency**: All customer data stored in EU regions
4. **Progressive Enhancement**: Works without JavaScript, enhanced with it
5. **Accessibility**: WCAG AA compliant by default

### Service Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[Marketing Site]
        B[Builder App]
        C[Runtime Viewer]
    end
    
    subgraph "API Layer"
        D[Django API]
        E[Analytics API]
        F[Edge Functions]
    end
    
    subgraph "Workers"
        G[Celery Workers]
        H[Webhook Processor]
    end
    
    subgraph "Data"
        I[(PostgreSQL)]
        J[(ClickHouse)]
        K[(Redis)]
        L[S3 Storage]
    end
    
    A --> D
    B --> D
    C --> F
    F --> D
    D --> G
    D --> I
    D --> K
    E --> J
    G --> H
    H --> External[External Services]
```

## 🚀 Getting Started

### Prerequisites

1. **Required Tools**
   ```bash
   # Check versions
   node --version  # >= 20.0.0
   python --version  # >= 3.11
   pnpm --version  # >= 8.0.0
   docker --version
   ```

2. **Environment Setup**
   ```bash
   # Clone and setup
   git clone <repo>
   cd forms-platform
   cp .env.example .env
   
   # Install dependencies
   pnpm install
   
   # Python virtual environment
   cd services/api
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   cd ../..
   ```

3. **Database Setup**
   ```bash
   # Start services
   docker-compose up -d
   
   # Run migrations
   cd services/api
   python manage.py migrate
   python manage.py createsuperuser
   cd ../..
   ```

### Development Workflow

1. **Start Everything**
   ```bash
   # Terminal 1: Frontend apps
   pnpm dev
   
   # Terminal 2: API
   cd services/api
   python manage.py runserver
   
   # Terminal 3: Workers
   cd services/api
   celery -A api worker -l info
   
   # Terminal 4: Analytics
   cd services/analytics
   uvicorn app:app --reload
   ```

2. **Access Services**
   - Marketing: http://localhost:3000
   - Builder: http://localhost:3001
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/v1/docs
   - Analytics: http://localhost:8002
   - MailHog: http://localhost:8025

## 💻 Frontend Development

### Next.js Apps

#### Project Structure
```
apps/builder/
├── app/              # App Router pages
├── components/       # React components
│   ├── ui/          # Base UI components
│   ├── forms/       # Form-specific components
│   └── analytics/   # Analytics components
├── lib/             # Utilities
│   ├── api/         # API client
│   └── utils/       # Helper functions
└── public/          # Static assets
```

#### Key Patterns

**1. Data Fetching with React Query**
```typescript
// lib/api/forms.ts
export const useForm = (id: string) => {
  return useQuery({
    queryKey: ['form', id],
    queryFn: () => formsApi.get(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// In component
const { data: form, isLoading, error } = useForm(formId);
```

**2. Optimistic Updates**
```typescript
const updateMutation = useMutation({
  mutationFn: (data) => formsApi.update(id, data),
  onMutate: async (newData) => {
    // Cancel queries
    await queryClient.cancelQueries(['form', id]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['form', id]);
    
    // Optimistically update
    queryClient.setQueryData(['form', id], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['form', id], context.previous);
  },
});
```

**3. Form State Management**
```typescript
// Use React Hook Form for complex forms
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const FormEditor = () => {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      pages: [{ id: 'page_1', blocks: [] }],
    },
  });
  
  const onSubmit = (data) => {
    // Handle submission
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};
```

### Runtime Package

The runtime viewer is the most performance-critical component.

#### Bundle Size Optimization

1. **Tree Shaking**
   ```typescript
   // ❌ Bad - imports entire library
   import _ from 'lodash';
   
   // ✅ Good - imports only what's needed
   import debounce from 'lodash/debounce';
   ```

2. **Dynamic Imports**
   ```typescript
   // Load heavy components only when needed
   const SignatureField = lazy(() => 
     import('./fields/SignatureField')
   );
   ```

3. **Custom Hooks**
   ```typescript
   // Minimal React hooks for form state
   export function useFormState(initial) {
     const [state, setState] = useState(initial);
     const updateField = useCallback((id, value) => {
       setState(prev => ({ ...prev, [id]: value }));
     }, []);
     return [state, updateField];
   }
   ```

## 🐍 Backend Development

### Django API

#### Project Structure
```
services/api/
├── api/              # Main app config
├── core/             # Core models & utils
├── forms/            # Forms app
├── submissions/      # Submissions app
├── webhooks/         # Webhooks app
├── integrations/     # Integrations app
└── importers/        # Import functionality
```

#### Key Patterns

**1. ViewSets with DRF**
```python
class FormViewSet(viewsets.ModelViewSet):
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return Form.objects.filter(
            organization=self.request.user.membership.organization
        ).select_related('created_by').prefetch_related('versions')
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        form = self.get_object()
        version = form.publish(
            user=request.user,
            canary_percentage=request.data.get('canary_percentage', 0)
        )
        return Response(FormVersionSerializer(version).data)
```

**2. Async Tasks with Celery**
```python
@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(RequestException,)
)
def process_webhook_delivery(self, delivery_id):
    delivery = WebhookDelivery.objects.get(id=delivery_id)
    
    try:
        response = requests.post(
            delivery.webhook.url,
            json=delivery.payload,
            headers=delivery.get_headers(),
            timeout=30
        )
        response.raise_for_status()
        
        delivery.mark_success(response)
    except Exception as exc:
        delivery.mark_failure(str(exc))
        raise self.retry(exc=exc)
```

**3. Database Optimization**
```python
# Use select_related for ForeignKeys
forms = Form.objects.select_related('organization', 'created_by')

# Use prefetch_related for reverse ForeignKeys and ManyToMany
forms = Form.objects.prefetch_related('submissions', 'versions')

# Use only() for specific fields
forms = Form.objects.only('id', 'title', 'status')

# Use bulk operations
Form.objects.bulk_create([...])
Form.objects.bulk_update([...], ['status'])
```

### Analytics Service

Built with FastAPI for high performance.

```python
@app.post("/events/batch")
async def track_events_batch(
    events: List[Event],
    background_tasks: BackgroundTasks
):
    # Quick validation
    validated_events = [event.dict() for event in events]
    
    # Queue for processing
    background_tasks.add_task(
        process_events,
        validated_events
    )
    
    # Immediate response
    return {"status": "accepted", "count": len(events)}
```

## 🧪 Testing

### Frontend Testing

**1. Unit Tests**
```typescript
// components/__tests__/FormField.test.tsx
describe('FormField', () => {
  it('should render required indicator', () => {
    render(
      <FormField
        field={{ id: 'test', type: 'text', required: true }}
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
```

**2. Integration Tests**
```typescript
// Use MSW for API mocking
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/forms/:id', (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, title: 'Test Form' }));
  })
);
```

### Backend Testing

**1. Model Tests**
```python
@pytest.mark.django_db
class TestForm:
    def test_slug_generation(self):
        form = Form.objects.create(
            title="My Test Form",
            organization=organization
        )
        assert form.slug == "my-test-form"
    
    def test_unique_slug_constraint(self):
        Form.objects.create(title="Test", slug="test", organization=org)
        with pytest.raises(IntegrityError):
            Form.objects.create(title="Test 2", slug="test", organization=org)
```

**2. API Tests**
```python
def test_create_form(authenticated_client):
    response = authenticated_client.post('/v1/forms/', {
        'title': 'New Form',
        'pages': [{'id': 'page_1', 'blocks': []}]
    })
    
    assert response.status_code == 201
    assert response.data['title'] == 'New Form'
```

### E2E Testing

```typescript
// e2e/form-creation.spec.ts
test('should create and publish form', async ({ page }) => {
  await page.goto('/forms');
  await page.click('button:has-text("Create Form")');
  
  await page.fill('[name="title"]', 'E2E Test Form');
  await page.click('button:has-text("Create")');
  
  await expect(page).toHaveURL(/\/forms\/.*\/edit/);
  
  // Add fields and publish
  await page.click('button:has-text("Add Field")');
  await page.click('[data-field-type="text"]');
  await page.click('button:has-text("Publish")');
  
  await expect(page.locator('.toast')).toHaveText('Form published');
});
```

## 🚢 Deployment

### Build Process

```bash
# Frontend build
pnpm build

# API Docker image
docker build -f services/api/Dockerfile -t forms/api:latest services/api

# Analytics Docker image
docker build -f services/analytics/Dockerfile -t forms/analytics:latest services/analytics
```

### Environment Configuration

**Required Environment Variables:**
```bash
# Database
POSTGRES_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379/0

# Security
JWT_SECRET=<random-32-chars>
HMAC_SECRET=<random-32-chars>
DJANGO_SECRET_KEY=<random-50-chars>

# Storage
S3_BUCKET=forms-uploads
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=yyy
S3_REGION=eu-west-1

# Feature Flags
FEATURE_PAYMENTS_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
```

### Performance Optimization

1. **Database Indexes**
   ```sql
   -- Most common queries
   CREATE INDEX idx_forms_org_status ON forms(organization_id, status);
   CREATE INDEX idx_submissions_form_created ON submissions(form_id, created_at);
   CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status, next_retry_at);
   ```

2. **Caching Strategy**
   ```python
   # Cache form schema (rarely changes)
   @cache_page(60 * 15)  # 15 minutes
   def form_runtime_view(request, form_id):
       # ...
   
   # Cache analytics (updates hourly)
   cache_key = f"analytics:{form_id}:{date}"
   data = cache.get(cache_key)
   if not data:
       data = calculate_analytics(form_id, date)
       cache.set(cache_key, data, 3600)  # 1 hour
   ```

3. **CDN Configuration**
   ```nginx
   # Cache static assets forever
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   
   # Cache form runtime for 5 minutes
   location ~ ^/f/[a-zA-Z0-9-]+$ {
       expires 5m;
       add_header Cache-Control "public, max-age=300";
   }
   ```

## 🐛 Debugging

### Common Issues

**1. CORS Errors**
```python
# Check CORS settings in settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]
```

**2. Database Connection Issues**
```bash
# Test connection
python manage.py dbshell

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

**3. Celery Task Failures**
```bash
# Monitor tasks
celery -A api flower

# Retry failed tasks
python manage.py retry_failed_tasks
```

### Debugging Tools

1. **Django Debug Toolbar**
   ```python
   # Add to INSTALLED_APPS in development
   INSTALLED_APPS += ['debug_toolbar']
   MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
   ```

2. **React Developer Tools**
   - Install browser extension
   - Use Profiler for performance issues

3. **Network Inspector**
   - Check API calls
   - Verify request/response headers
   - Monitor bundle sizes

## 📚 Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [ClickHouse Documentation](https://clickhouse.com/docs/)
- [Celery Documentation](https://docs.celeryproject.org/)