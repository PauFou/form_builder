# Undo/Redo System Documentation

## Overview

The form builder implements a robust undo/redo system with a 50-step history that tracks all form modifications and provides a smooth user experience.

## Features

### 50-Step History
- Maintains up to 50 states in the history buffer
- Automatically removes oldest states when the limit is exceeded
- Each state is a complete snapshot of the form

### Tracked Operations
All form modifications are tracked, including:
- Form property changes (title, description, settings)
- Block operations (add, update, delete, move, duplicate)
- Page operations (add, update, delete, move)
- Logic rule changes (add, update, delete)
- Theme modifications

### Keyboard Shortcuts
- **Undo**: `⌘Z` (Mac) / `Ctrl+Z` (Windows/Linux)
- **Redo**: `⇧⌘Z` (Mac) / `Ctrl+Shift+Z` (Windows/Linux)
- Alternative redo: `⌘Y` (Mac) / `Ctrl+Y` (Windows/Linux)

Additional shortcuts:
- **Save**: `⌘S` (Mac) / `Ctrl+S` (Windows/Linux)
- **Preview**: `⌘P` (Mac) / `Ctrl+P` (Windows/Linux)

### UI Components

#### Toolbar
The toolbar displays undo/redo buttons with:
- Visual enabled/disabled states
- Tooltips showing keyboard shortcuts
- History status indicator (current position/total states)

#### Toast Notifications
Visual feedback appears when undo/redo is performed:
- Shows "Undo" or "Redo" with appropriate icon
- Auto-dismisses after 2 seconds
- Positioned at bottom center of screen

#### Command Palette
Undo/redo actions are available in the command palette (`⌘K`):
- Only shows enabled actions
- Displays keyboard shortcuts

## Implementation Details

### Store Architecture

The undo/redo system is implemented in the Zustand store with:

```typescript
interface FormBuilderState {
  history: Form[];           // Array of form snapshots
  historyIndex: number;      // Current position in history
  isUndoing: boolean;        // Flag to prevent history save during undo/redo
  lastSavedTimestamp: number; // For debouncing history saves
  
  // Methods
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistoryStatus: () => { current: number; total: number };
}
```

### Key Features

1. **Debounced History Saves**: Prevents excessive history entries during rapid changes (100ms debounce)

2. **Smart Selection Handling**: When undoing/redoing:
   - Preserves page selection if the page still exists
   - Clears block selection if the block was removed
   - Selects first page if current page was removed

3. **Future History Clearing**: Making changes after undo automatically clears the "future" history

4. **Deep Cloning**: Uses JSON serialization to ensure complete state isolation between history entries

### Performance Considerations

- History entries are deep cloned to prevent reference issues
- Maximum 50 entries prevents memory bloat
- Debouncing reduces unnecessary history entries
- History operations are synchronous for predictable behavior

## Usage Example

```tsx
import { useFormBuilderStore } from "@/lib/stores/form-builder-store";

function MyComponent() {
  const { undo, redo, canUndo, canRedo, getHistoryStatus } = useFormBuilderStore();
  
  return (
    <div>
      <button onClick={undo} disabled={!canUndo()}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo()}>
        Redo
      </button>
      <span>
        History: {getHistoryStatus().current}/{getHistoryStatus().total}
      </span>
    </div>
  );
}
```

## Testing

The undo/redo system includes comprehensive tests covering:
- History initialization
- History limits
- Undo/redo operations
- Selection state preservation
- Future history clearing
- Block operations with undo/redo

Run tests with: `pnpm test undo-redo.test.ts`