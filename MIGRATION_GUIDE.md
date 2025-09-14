# Block Type Migration Guide

## Overview

As part of aligning with Brief v2 requirements, we've renamed two block types:

- `single_select` → `select`
- `multi_select` → `checkboxGroup`

## Changes Made

### 1. Contract Updates

- Updated `@forms/contracts` to use new type names
- Field types enum now includes `select` and `checkboxGroup` instead of `single_select` and `multi_select`

### 2. Runtime Updates

- Updated block type definitions in `@forms/runtime`
- Updated FormField component to handle new types
- Added migration utilities for backward compatibility

### 3. Builder Updates

- Updated block library to use new type names
- Updated block component mappings
- Fixed test files to use new types

### 4. Importer Updates

- Updated Typeform importer mappings
- Updated Google Forms importer mappings

## Migration Path

### For Existing Forms

The runtime package now includes migration utilities to help with the transition:

```typescript
import { migrateFormSchema, needsMigration } from "@forms/runtime";

// Check if a form needs migration
if (needsMigration(formSchema)) {
  // Migrate the form schema
  const migratedSchema = migrateFormSchema(formSchema);
}
```

### For New Forms

All new forms will automatically use the new block types:

- Use `select` for dropdown selection (single choice)
- Use `checkboxGroup` for multiple choice selection

## Component Mapping

The following components are now mapped to the new types:

- `select` → `SelectBlock` (dropdown component)
- `checkboxGroup` → `CheckboxGroupBlock` (checkbox group component)

## API Compatibility

The API will continue to accept both old and new type names during a transition period. However, we recommend updating to the new types as soon as possible.

## Testing

All tests have been updated to use the new type names. Make sure to update any custom tests in your applications.
