# Analytics Integration Guide

The form runtime includes built-in analytics tracking to help you understand how users interact with your forms.

## Quick Start

Analytics is enabled by default when you create a form viewer:

```tsx
import { FormViewer } from "@forms/runtime";

const config = {
  formId: "your-form-id",
  apiUrl: "https://api.forms.app",
  enableAnalytics: true, // Default: true
  analyticsApiUrl: "https://analytics.forms.app", // Optional, defaults to apiUrl
  enableAnalyticsDebug: true, // Optional, logs events to console
};

<FormViewer schema={formSchema} config={config} />;
```

## Events Tracked

The runtime automatically tracks the following events:

### Form Lifecycle

- **form_view**: When the form is loaded
- **form_start**: When user begins interacting (first field change)
- **form_submit**: When form is successfully submitted
- **form_abandon**: When user leaves without submitting

### Step Navigation

- **step_view**: When a step/question is displayed
- **step_complete**: When user completes a step (with time spent)

### Field Interactions

- **field_change**: When user modifies a field value
- **field_error**: When validation errors occur

### Outcomes

- **outcome_reached**: When user reaches a specific outcome (if using logic)

## Event Properties

Each event includes:

- Form and respondent identification
- Session tracking
- Device information (type, browser, OS)
- UTM parameters from URL
- Timing metrics
- Field-specific data (for field events)

## Configuration Options

```typescript
interface RuntimeConfig {
  // Analytics settings
  enableAnalytics?: boolean; // Enable/disable tracking (default: true)
  analyticsApiUrl?: string; // Custom analytics endpoint
  enableAnalyticsDebug?: boolean; // Log events to console (default: false)
}
```

## Privacy Considerations

- Analytics respects user privacy by default
- No PII is collected unless explicitly included in form responses
- Session IDs are anonymous and temporary
- You can disable analytics entirely by setting `enableAnalytics: false`

## Custom Analytics Integration

If you need custom analytics behavior, you can use the event emitter:

```tsx
import { useFormRuntime } from "@forms/runtime";

function CustomForm({ schema, config }) {
  const { on, off, ...runtime } = useFormRuntime(schema, config);

  useEffect(() => {
    const handleFieldChange = ({ field, value }) => {
      // Send to your analytics provider
      myAnalytics.track("field_changed", { field, value });
    };

    on("field:change", handleFieldChange);
    return () => off("field:change", handleFieldChange);
  }, [on, off]);

  // ... render form
}
```

## Standalone Analytics Service

You can also use the analytics service directly:

```typescript
import { AnalyticsService } from "@forms/runtime";

const analytics = new AnalyticsService({
  apiUrl: "https://analytics.forms.app",
  enableTracking: true,
  batchSize: 10,
  flushInterval: 5000,
});

// Track custom events
analytics.track({
  event_type: "custom_interaction",
  form_id: "form-123",
  respondent_id: "resp-456",
  custom_data: "value",
});

// Clean up when done
analytics.destroy();
```

## Performance Impact

The analytics service is designed to have minimal impact:

- Events are batched and sent asynchronously
- Total overhead: <5KB gzipped
- No blocking operations
- Automatic retry with exponential backoff
- Graceful degradation if analytics endpoint is unavailable
