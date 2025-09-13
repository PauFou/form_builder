# Anti-Spam Protection

The form runtime includes comprehensive anti-spam protection with three layers of defense:

1. **Honeypot Field** - Invisible field that bots typically fill
2. **Time Trap** - Minimum completion time requirement
3. **Rate Limiting** - Prevents abuse from single IP or form

## Quick Start

Enable anti-spam protection by setting `enableAntiSpam` to `true` in your runtime config:

```typescript
const config: RuntimeConfig = {
  formId: "contact-form",
  apiUrl: "https://api.example.com",
  enableAntiSpam: true, // Enable all anti-spam features
  minCompletionTime: 3000, // 3 seconds minimum
  onSpamDetected: (reason) => {
    console.warn("Spam detected:", reason);
  },
};
```

## Features

### Honeypot Protection

A hidden field is automatically added to forms that legitimate users won't see or interact with, but bots often fill:

- Field name: `_website_url` (by default)
- Completely invisible with `aria-hidden="true"`
- Positioned off-screen with multiple CSS properties
- Accessible to screen readers as hidden

### Time Trap

Prevents instant form submissions by requiring a minimum completion time:

- Default: 3 seconds
- Tracks time from form load to submission
- Configurable per form

### Rate Limiting

Prevents abuse through submission limits:

- **IP-based**: 10 submissions per minute per IP (default)
- **Form-based**: 50 submissions per minute per form (default)
- Configurable limits and time windows
- Automatic cleanup of old tracking data

## Configuration

### Basic Configuration

```typescript
const config: RuntimeConfig = {
  formId: "my-form",
  apiUrl: "https://api.example.com",
  enableAntiSpam: true,
  minCompletionTime: 5000, // 5 seconds
  onSpamDetected: (reason) => {
    // Handle spam detection
    switch (reason) {
      case "honeypot_filled":
        console.log("Bot detected");
        break;
      case "too_fast":
        alert("Please take your time");
        break;
      case "rate_limit_ip":
        alert("Too many attempts");
        break;
    }
  },
};
```

### Advanced Configuration

For fine-grained control, configure the anti-spam service directly:

```typescript
import { antiSpamService } from "@forms/runtime";

antiSpamService.updateConfig({
  honeypot: {
    enabled: true,
    fieldName: "_url_field", // Custom field name
  },
  timeTrap: {
    enabled: true,
    minCompletionTimeMs: 5000, // 5 seconds
  },
  rateLimit: {
    enabled: true,
    byIP: {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
    },
    byFormId: {
      maxRequests: 100,
      windowMs: 60 * 1000,
    },
  },
});
```

## Using the Hook

For custom implementations, use the `useAntiSpam` hook:

```typescript
import { useAntiSpam } from "@forms/runtime";

function MyCustomForm() {
  const { validateAntiSpam, getCompletionTime } = useAntiSpam({
    enabled: true,
    minCompletionTime: 3000,
    formId: "my-form",
  });

  const handleSubmit = async () => {
    const validation = await validateAntiSpam();
    
    if (!validation.isValid) {
      console.log("Spam detected:", validation.reason);
      return;
    }

    // Proceed with submission
    const completionTime = getCompletionTime();
    console.log(`Form completed in ${completionTime}ms`);
  };
}
```

## Server-Side Validation

While client-side protection is effective, always validate on the server too:

```typescript
// Example Express.js endpoint
app.post("/api/submissions", async (req, res) => {
  const clientIP = req.headers["x-forwarded-for"] || req.ip;
  
  // Validate using anti-spam service
  const validation = await antiSpamService.validate(
    req.body.sessionId,
    {
      ip: clientIP,
      formId: req.body.formId,
    }
  );

  if (!validation.isValid) {
    return res.status(429).json({
      error: "Spam detected",
      reason: validation.reason,
    });
  }

  // Additional server checks
  const completionTime = req.body.metadata?.completionTime;
  if (completionTime < 3000) {
    return res.status(429).json({
      error: "Submission too fast",
    });
  }

  // Process valid submission...
});
```

## Monitoring

Track anti-spam effectiveness:

```typescript
const stats = antiSpamService.getStatistics();
console.log({
  totalAttempts: stats.totalAttempts,
  recentAttempts: stats.recentAttempts,
});
```

## Accessibility

The anti-spam measures are designed to be transparent to legitimate users:

- Honeypot field is properly hidden from screen readers
- Time requirements are reasonable for all users
- No CAPTCHAs or puzzles required
- Rate limits are generous for normal usage

## Best Practices

1. **Always enable in production** - Anti-spam should be on by default
2. **Adjust time limits carefully** - Too short allows spam, too long frustrates users
3. **Monitor statistics** - Track effectiveness and adjust settings
4. **Server validation** - Never trust client-side validation alone
5. **User feedback** - Provide clear messages when blocking submissions

## Spam Detection Reasons

| Reason | Description | User Action |
|--------|-------------|-------------|
| `honeypot_filled` | Hidden field was filled | Likely a bot |
| `too_fast` | Submitted too quickly | Ask user to review |
| `rate_limit_ip` | Too many from one IP | Temporary block |
| `rate_limit_form` | Form getting too many | High traffic warning |

## Troubleshooting

### False Positives

If legitimate users are being blocked:

1. Increase `minCompletionTime` (some users are very fast)
2. Increase rate limits
3. Check if browser extensions are filling the honeypot
4. Monitor completion times to find appropriate threshold

### Testing

Test anti-spam in development:

```typescript
// Simulate bot behavior
const honeypot = document.querySelector('input[name="_website_url"]');
honeypot.value = "test"; // Will trigger honeypot detection

// Test rate limiting
for (let i = 0; i < 15; i++) {
  await validateAntiSpam(); // Will trigger rate limit
}
```

## Performance

The anti-spam system is designed to be lightweight:

- No external dependencies
- Minimal memory usage
- Automatic cleanup of old data
- No network requests required
- < 5KB additional bundle size