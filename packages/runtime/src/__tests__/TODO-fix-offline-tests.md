# TODO: Fix Offline Integration Tests

## Problem

Three tests in `offline-full-integration.test.tsx` are currently skipped because they fail in CI:

1. **"should restore form state from IndexedDB on reload"**
   - Issue: After unmounting and remounting, the form doesn't restore values from IndexedDB
   - Possible cause: IndexedDB async timing or fake-indexeddb limitations

2. **"should handle offline/online transitions"**
   - Issue: The offline/online events don't properly trigger state updates
   - Possible cause: Event simulation doesn't work correctly in jsdom

3. **"should clear offline data after successful submission"**
   - Issue: The thank you message isn't found after submission
   - Possible cause: Component state not updating correctly in test environment

## React 19 act() Warnings

Additionally, all tests show React 19 act() warnings for async state updates.
These warnings don't cause test failures but indicate that state updates happen outside of act().

## Solution Approaches

### 1. Fix act() warnings

```typescript
import { act } from "@testing-library/react";

// Wrap events that cause state updates
await act(async () => {
  window.dispatchEvent(new Event("offline"));
});
```

### 2. Fix IndexedDB timing

- Add proper waits for IndexedDB operations
- Consider using a more robust IndexedDB mock

### 3. Fix component state issues

- Ensure all async operations complete before assertions
- Add proper cleanup between tests

## Priority

These tests should be fixed before the offline feature is considered production-ready.
The offline functionality itself works, but the tests need improvement.
