# Partial Save and Resume

The Form Runtime provides comprehensive partial save and resume functionality that automatically saves form progress and allows users to continue where they left off.

## Features

- **Automatic Local Storage**: Form data is automatically saved to localStorage as users fill out the form
- **API Integration**: Optional server-side partial saves with 2-second throttling
- **Resume Links**: Generate unique URLs that allow users to resume their progress
- **Offline Support**: Works seamlessly offline with automatic sync when connection returns
- **Visual Indicators**: Built-in components show save status and provide resume options
- **Data Cleanup**: Automatic cleanup of old partial saves (30+ days)

## Basic Usage

```tsx
import { useFormRuntime, SaveStatus, ResumeBanner } from "@forms/runtime";

const config = {
  formId: "my-form",
  apiUrl: "https://api.example.com",
  
  // Enable partial saves to API (optional)
  onPartialSave: async (data) => {
    // Custom save logic
    await saveToServer(data);
  },
  
  // Or use default API endpoint
  // POST /partials endpoint will be called automatically
};

function MyForm() {
  const {
    state,
    isSaving,
    hasUnsyncedData,
    isOnline,
    getResumeUrl,
    // ... other runtime methods
  } = useFormRuntime(schema, config);

  return (
    <div>
      {/* Show save status */}
      <SaveStatus
        isSaving={isSaving}
        hasUnsyncedData={hasUnsyncedData}
        isOnline={isOnline}
        resumeUrl={getResumeUrl()}
      />
      
      {/* Form fields */}
    </div>
  );
}
```

## Resume Functionality

### Automatic Resume Detection

The runtime automatically checks for saved data on initialization:

1. **URL Parameter**: Checks for `?resume=TOKEN` in the URL
2. **Local Storage**: Falls back to localStorage if no token is provided
3. **API Fetch**: If a resume token exists, fetches data from the server

### Resume Banner

Show a banner when resumable data is detected:

```tsx
import { ResumeBanner } from "@forms/runtime";

function FormWithResume() {
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  
  useEffect(() => {
    // Check if saved data exists
    const hasSavedData = checkForSavedData();
    setShowResumeBanner(hasSavedData);
  }, []);

  if (showResumeBanner) {
    return (
      <ResumeBanner
        onResume={() => {
          // Continue with saved data
          setShowResumeBanner(false);
        }}
        onStartFresh={() => {
          // Clear saved data and start over
          clearSavedData();
          setShowResumeBanner(false);
        }}
        lastUpdated={savedDataTimestamp}
        progress={savedProgress}
      />
    );
  }
  
  // Regular form rendering
}
```

## API Integration

### Default Endpoints

When using the default API integration:

```
POST /partials
Body: {
  formId: string
  respondentKey: string
  values: Record<string, any>
  currentStep: number
  progress: number
  startedAt: string
  lastUpdatedAt: string
  metadata?: Record<string, any>
}

Response: {
  id: string
  resumeToken: string
  expiresAt: string
}
```

```
GET /partials/:resumeToken
Response: {
  // Same as POST body
}
```

```
DELETE /partials/:resumeToken
Response: 204 No Content
```

### Custom Integration

```tsx
const config = {
  onPartialSave: async (data) => {
    // Your custom save logic
    const response = await fetch("/my-api/save", {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    // Return resume token if needed
    const { token } = await response.json();
    return token;
  },
};
```

## Save Throttling

- **Local Storage**: Immediate save on every change
- **API Calls**: Throttled to maximum once every 2 seconds
- **Offline Queue**: Changes are queued when offline and synced when connection returns

## Configuration Options

```tsx
interface RuntimeConfig {
  // Form identifier
  formId: string;
  
  // API base URL
  apiUrl?: string;
  
  // Custom partial save handler
  onPartialSave?: (data: PartialSaveData) => Promise<void>;
  
  // Auto-save interval for offline service (ms)
  autoSaveInterval?: number;
  
  // Enable offline support
  enableOffline?: boolean;
  
  // Initial respondent key
  respondentKey?: string;
}
```

## Save Status Component

The `SaveStatus` component provides visual feedback:

```tsx
<SaveStatus
  isSaving={isSaving}           // Currently saving
  hasUnsyncedData={hasUnsynced} // Has local changes not synced
  isOnline={isOnline}           // Online/offline status
  resumeUrl={resumeUrl}         // Generated resume URL
  lastSaveTime={lastSave}       // Optional: show time since save
  className="my-custom-class"   // Optional: custom styling
/>
```

Status indicators:
- 🟢 Green: All changes saved
- 🟡 Amber: Changes saved locally / Offline
- 🔵 Gray: Currently saving

## Data Structure

### Partial Save Data

```typescript
interface PartialSaveData {
  formId: string;
  respondentKey: string;
  values: Record<string, any>;
  currentStep: number;
  progress: number;
  startedAt: string;
  lastUpdatedAt: string;
  metadata?: {
    userAgent: string;
    viewport: { width: number; height: number };
    locale?: string;
  };
}
```

## Security Considerations

1. **Session Keys**: Unique keys prevent data collision between forms/users
2. **Token Expiration**: Resume tokens should expire after a reasonable period (e.g., 7 days)
3. **Data Validation**: Always validate restored data structure
4. **HTTPS Only**: Resume URLs should only work over HTTPS in production

## Best Practices

1. **Show Save Status**: Always display save status to build user confidence
2. **Provide Resume Links**: Offer users a way to save their progress URL
3. **Handle Conflicts**: Plan for scenarios where server and local data diverge
4. **Set Expiration**: Clear old partial saves to respect user privacy
5. **Test Offline**: Ensure forms work properly in offline scenarios

## Example Implementation

```tsx
import React, { useState, useEffect } from "react";
import {
  useFormRuntime,
  SaveStatus,
  ResumeBanner,
  FormViewer,
} from "@forms/runtime";

export function FormWithPartialSave({ schema }) {
  const [showResume, setShowResume] = useState(false);
  
  const config = {
    formId: schema.id,
    apiUrl: process.env.REACT_APP_API_URL,
    enableOffline: true,
    onPartialSave: async (data) => {
      // Custom save logic
      console.log("Saving partial:", data);
    },
    onSubmit: async (data) => {
      // Submit logic
      console.log("Submitting:", data);
    },
  };

  const runtime = useFormRuntime(schema, config);

  // Check for resumable data on mount
  useEffect(() => {
    if (runtime.state.values && Object.keys(runtime.state.values).length > 0) {
      // Data was auto-loaded
      setShowResume(false);
    }
  }, []);

  return (
    <div className="form-container">
      {/* Save status indicator */}
      <div className="form-header">
        <SaveStatus
          isSaving={runtime.isSaving}
          hasUnsyncedData={runtime.hasUnsyncedData}
          isOnline={runtime.isOnline}
          resumeUrl={runtime.getResumeUrl()}
        />
      </div>

      {/* Resume banner if needed */}
      {showResume && (
        <ResumeBanner
          onResume={() => setShowResume(false)}
          onStartFresh={() => {
            // Clear and restart
            localStorage.clear();
            window.location.reload();
          }}
          progress={runtime.progress}
        />
      )}

      {/* Form content */}
      <FormViewer
        schema={schema}
        config={config}
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Data Not Saving**
   - Check browser localStorage limits
   - Verify API endpoints are accessible
   - Check for CORS issues with API calls

2. **Resume Not Working**
   - Ensure resume token is valid and not expired
   - Check that form ID matches saved data
   - Verify localStorage permissions

3. **Sync Conflicts**
   - Implement conflict resolution strategy
   - Consider timestamp-based merging
   - Provide user choice for conflicts

### Debug Mode

Enable debug logging:

```tsx
const config = {
  // ... other config
  enableAnalyticsDebug: true, // Shows detailed logs
};
```