# Testing Guide - Runtime Offline Features

## How to Test Locally

### 1. Offline Autosave

1. Open a form in your browser
2. Start filling out fields
3. Open DevTools > Application > IndexedDB
4. Look for `forms-runtime-[formId]` database
5. Check the `submissions` table - you should see your data being saved
6. Refresh the page - your progress should be restored

### 2. Anti-Spam Protection

```javascript
// Test too-fast submission
const config = {
  enableAntiSpam: true,
  minCompletionTime: 3000, // 3 seconds
  onSpamDetected: (reason) => {
    console.log("Spam detected:", reason);
  },
};

// Try submitting immediately - should trigger spam detection
```

### 3. Popover Embed

```html
<!DOCTYPE html>
<html>
  <body>
    <button id="open-form">Open Contact Form</button>

    <script src="/dist/embed.global.js"></script>
    <script>
      Forms.load({
        formId: "contact-form",
        mode: "popup",
        trigger: "#open-form",
        onSubmit: (data) => {
          console.log("Submitted:", data);
        },
      });
    </script>
  </body>
</html>
```

### 4. Drawer Embed

```html
<button id="feedback-btn">Give Feedback</button>

<script>
  Forms.load({
    formId: "feedback-form",
    mode: "drawer",
    trigger: "#feedback-btn",
    position: "right",
  });
</script>
```

### 5. Offline/Online Transitions

1. Fill out a form partially
2. Go offline (DevTools > Network > Offline)
3. Continue filling - note the "Working offline" indicator
4. Go back online
5. Check network tab - partial submission should sync

## Performance Testing

### Bundle Size

```bash
pnpm size
# Should show < 10KB gzipped
```

### Step Navigation Performance

```bash
pnpm test -- performance.test.ts
# P95 should be < 400ms
```

## Accessibility Testing

```bash
pnpm test:a11y
# Should pass all WCAG AA checks
```

## E2E Testing

```bash
pnpm test:e2e
# Tests offline scenarios, anti-spam, and embeds
```

## Manual Test Checklist

- [ ] Form saves progress automatically
- [ ] Progress restored after page refresh
- [ ] Offline indicator appears when disconnected
- [ ] Data syncs when reconnected
- [ ] Anti-spam blocks rapid submissions
- [ ] Popover opens/closes properly
- [ ] Drawer slides in/out smoothly
- [ ] Keyboard navigation works in all embed types
- [ ] Focus is properly managed
- [ ] No console errors
- [ ] Bundle size < 10KB
