# Skemya Theme and Internationalization (i18n)

This document describes the implementation of the Skemya theme and internationalization system for the form builder.

## Overview

The implementation includes:
- **Skemya Theme**: A professional, tech-focused design system with light/dark mode support
- **Internationalization (i18n)**: Full support for English and French with auto-detection and URL parameter override

## Theme System

### Design Tokens

The Skemya theme provides comprehensive design tokens:

```typescript
// Colors
- Primary: Electric Blue (#3385ff)
- Secondary: Deep Purple
- Accent: Cyan
- Semantic colors (success, warning, error, info)
- Neutral scale (0-1000)

// Typography
- Font families (sans, serif, mono)
- Font sizes (xs to 9xl)
- Font weights (thin to black)
- Line heights and letter spacing

// Spacing
- Consistent spacing scale (0 to 96)
- Based on rem units

// Other tokens
- Border radius scale
- Shadow system
- Transition durations and easings
- Breakpoints
- Z-indices
```

### Usage

```tsx
import { useSkemyaTheme } from '@/lib/theme';

function MyComponent() {
  const { theme, mode, toggleMode } = useSkemyaTheme();
  
  return (
    <div>
      <button onClick={toggleMode}>
        Switch to {mode === 'light' ? 'dark' : 'light'} mode
      </button>
    </div>
  );
}
```

### Theme Switcher Component

```tsx
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

<ThemeSwitcher variant="ghost" size="icon" />
```

## Internationalization (i18n)

### Language Detection

The system automatically detects the user's language using the following priority:
1. URL parameter: `?lang=fr`
2. LocalStorage preference
3. Browser language (navigator.language)
4. Default: English

### Supported Languages

- English (en)
- French (fr)

### Translation Structure

Translations are organized by domain:
- `common`: Common UI elements
- `navigation`: Navigation items
- `auth`: Authentication related
- `forms`: Form builder specific
- `builder`: Builder interface
- `blocks`: Block types
- `validation`: Validation messages
- `analytics`: Analytics dashboard
- `integrations`: Integration settings
- `settings`: Application settings
- `errors`: Error messages
- `success`: Success messages
- `confirmations`: Confirmation dialogs
- `tooltips`: Tooltip texts
- `placeholders`: Input placeholders
- `time`: Relative time formatting
- `numbers`: Number formatting

### Usage

```tsx
import { useI18n } from '@/lib/i18n';

function MyComponent() {
  const { t, locale, setLocale, formatDate, formatCurrency } = useI18n();
  
  return (
    <div>
      <h1>{t.navigation.dashboard}</h1>
      <p>{t.forms.createForm}</p>
      
      {/* Formatted date */}
      <p>{formatDate(new Date(), { dateStyle: 'full' })}</p>
      
      {/* Formatted currency */}
      <p>{formatCurrency(1234.56, 'EUR')}</p>
      
      {/* Switch language */}
      <button onClick={() => setLocale('fr')}>
        Français
      </button>
    </div>
  );
}
```

### Language Switcher Component

```tsx
import { LanguageSwitcher } from '@/components/ui/language-switcher';

<LanguageSwitcher variant="ghost" size="icon" />
```

### Validation with i18n

The system provides localized validation messages for Zod schemas:

```tsx
import { z } from 'zod';
import { createI18nErrorMap, createValidationSchemas } from '@/lib/i18n/validation';
import { useI18n } from '@/lib/i18n';

function MyForm() {
  const { t } = useI18n();
  
  // Set global error map
  z.setErrorMap(createI18nErrorMap(t));
  
  // Use predefined schemas
  const schemas = createValidationSchemas(t);
  
  const formSchema = z.object({
    email: schemas.email,
    phone: schemas.phone,
    age: schemas.positiveNumber,
  });
}
```

### Formatting Functions

The i18n system provides several formatting utilities:

```tsx
const { formatMessage, formatNumber, formatDate, formatCurrency, formatRelativeTime } = useI18n();

// Format message with placeholders
formatMessage('validation.minLength', { min: 5 }); // "Must be at least 5 characters"

// Format numbers
formatNumber(1234.56); // "1,234.56" (en) or "1 234,56" (fr)

// Format dates
formatDate(new Date(), { dateStyle: 'full' }); // "Monday, January 15, 2024"

// Format currency
formatCurrency(99.99, 'EUR'); // "$99.99" (en) or "99,99 €" (fr)

// Format relative time
formatRelativeTime(pastDate); // "2 days ago" or "Il y a 2 jours"
```

## Demo Page

Visit `/demo/i18n-theme` to see a live demonstration of the theme and i18n features.

## Adding New Languages

To add a new language:

1. Create a new translation file in `/lib/i18n/locales/[lang].ts`
2. Import and export the Translation type
3. Add the language code to the Locale type in `/lib/i18n/types.ts`
4. Update the browser locale mapping in `/lib/i18n/context.tsx`
5. Add the language option to the LanguageSwitcher component

## Best Practices

1. **Always use translation keys** instead of hardcoded strings
2. **Use formatting functions** for dates, numbers, and currencies
3. **Test with both languages** to ensure UI doesn't break with longer text
4. **Provide context** in translation keys (e.g., `forms.createForm` not just `create`)
5. **Use placeholders** for dynamic values in translations
6. **Validate forms** with localized error messages

## CSS Variables

The theme system generates CSS variables that can be used directly:

```css
.my-component {
  color: hsl(var(--primary));
  background: hsl(var(--background));
  border-radius: var(--radius);
  padding: var(--spacing-4);
  font-size: var(--font-size-base);
  transition: all var(--transition-base) var(--easing);
}
```