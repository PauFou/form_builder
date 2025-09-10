# Design System Documentation

## Overview

This document outlines the comprehensive design system for the Forms Platform. Our design philosophy emphasizes clarity, performance, and accessibility while maintaining a modern, professional aesthetic.

## Design Principles

### 1. **Clarity First**

- Clear visual hierarchy
- Predictable interactions
- Meaningful feedback

### 2. **Performance Obsessed**

- Minimal CSS footprint
- Optimized animations
- Fast perceived performance

### 3. **Accessibility Native**

- WCAG AA compliant
- Keyboard navigation
- Screen reader optimized

### 4. **Consistently Flexible**

- Systematic design tokens
- Composable components
- Themeable architecture

## Visual Language

### Color System

All colors use HSL format with CSS variables for dynamic theming:

```css
/* Brand Colors */
--primary: 231 100% 60%; /* Electric Blue #4D6CFF */
--primary-foreground: 0 0% 100%;
--accent: 192 95% 43%; /* Cyan #0ABAB5 */
--accent-foreground: 0 0% 100%;

/* Neutral Scale */
--background: 0 0% 100%; /* White */
--foreground: 222.2 47.4% 11.2%; /* Near black */
--muted: 210 40% 96.1%; /* Light gray */
--muted-foreground: 215.4 16.3% 46.9%;

/* Semantic Colors */
--destructive: 0 84.2% 60.2%; /* Red */
--success: 142 76% 36%; /* Green */
--warning: 38 92% 50%; /* Orange */
```

### Typography

**Font Stack:**

- **Headings**: Geist (modern geometric sans)
- **Body**: Inter (optimized for screens)
- **Code**: Geist Mono (clear at all sizes)

**Type Scale:**

```css
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem; /* 36px */
--font-size-5xl: 3rem; /* 48px */
--font-size-6xl: 3.75rem; /* 60px */
```

### Spacing

Consistent spacing scale based on 4px grid:

```css
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
--spacing-20: 5rem; /* 80px */
--spacing-24: 6rem; /* 96px */
```

### Border Radius

Global radius for consistency:

```css
--radius: 1rem; /* 16px - Applied everywhere */
```

Component-specific variations:

- Small elements (tags, badges): `calc(var(--radius) / 2)`
- Large cards: `calc(var(--radius) * 1.5)`
- Full round: `9999px`

### Shadows

Elevation system with consistent light source:

```css
--shadow-sm: 0 1px 2px 0 hsl(0 0% 0% / 0.06);
--shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.08);
--shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.08);
--shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.08);
```

## Motion System

### Duration Standards

```css
--transition-fast: 150ms;
--transition-base: 250ms;
--transition-slow: 300ms;
```

### Easing Function

```css
--easing: cubic-bezier(0.2, 0.8, 0.2, 1);
```

### Animation Principles

1. **Purposeful**: Every animation has meaning
2. **Smooth**: 60fps minimum, prefer transforms
3. **Subtle**: Enhance, don't distract
4. **Responsive**: Respect prefers-reduced-motion

## Component Architecture

### Base Components

**Button**

```tsx
// Primary action
<Button>Submit</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Default</Button>
<Button size="lg">Large</Button>
```

**Form Controls**

- Text inputs with floating labels
- Select dropdowns with custom styling
- Checkboxes and radios with custom icons
- File upload with drag & drop
- Date pickers with calendar UI

**Cards**

- Consistent padding: `--spacing-6`
- Border: `1px solid hsl(var(--border))`
- Shadow: `var(--shadow-sm)` (hover: `var(--shadow-lg)`)

### Layout Patterns

**Container**

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-6);
}
```

**Grid System**

- 12-column grid on desktop
- 6-column grid on tablet
- Single column on mobile

**Section Spacing**

- Between sections: `--spacing-24`
- Within sections: `--spacing-12`
- Component spacing: `--spacing-6`

## Responsive Design

### Breakpoints

```css
--screen-sm: 640px; /* Mobile landscape */
--screen-md: 768px; /* Tablet */
--screen-lg: 1024px; /* Desktop */
--screen-xl: 1280px; /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Mobile First

- Base styles for mobile
- Progressive enhancement for larger screens
- Touch targets minimum 44x44px

## Accessibility Standards

### Color Contrast

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Keyboard Navigation

- Visible focus indicators
- Logical tab order
- Skip links for navigation

### ARIA Implementation

- Semantic HTML first
- ARIA labels for icons
- Live regions for updates
- Error announcements

### Screen Reader Support

- Descriptive alt text
- Form field associations
- Status messages
- Loading states

## Dark Mode

Automatic dark mode with system preference detection:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... other dark mode tokens ... */
  }
}
```

## Performance Guidelines

### CSS Architecture

- Use CSS variables for theming
- Avoid deep nesting (max 3 levels)
- Minimize specificity
- Use CSS Grid/Flexbox for layout

### Asset Optimization

- SVG icons inline or sprite
- Lazy load images
- Use WebP with fallbacks
- Optimize font loading

### Animation Performance

- Use transform and opacity only
- Leverage will-change sparingly
- Avoid animating layout properties
- Use CSS containment

## Implementation Examples

### Form Builder Interface

- Left sidebar: 256px fixed width
- Main canvas: Fluid with max-width
- Right panel: 320px fixed width
- Consistent 16px gaps

### Marketing Landing

- Hero: Full viewport height
- Sections: Alternating backgrounds
- Cards: 3-column grid (desktop)
- CTAs: Primary color prominence

### Viewer Runtime

- Minimal CSS (~3KB gzipped)
- Single column layout
- Progressive enhancement
- Inline critical styles

## Brand Guidelines

### Voice & Tone

- **Professional**: Authoritative but approachable
- **Clear**: Simple language, no jargon
- **Helpful**: Guide users to success
- **Confident**: We know forms

### Visual Identity

- Clean, modern aesthetic
- Generous whitespace
- Subtle animations
- Professional color palette

## Component Library

All components are built with:

- **shadcn/ui**: Base component architecture
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible primitives
- **Framer Motion**: Animation library

## Testing Standards

### Visual Regression

- Screenshot tests for components
- Cross-browser testing
- Responsive breakpoint testing

### Accessibility Testing

- Automated axe-core tests
- Manual keyboard testing
- Screen reader testing
- Color contrast validation

## Maintenance

### Design Tokens

- Centralized in CSS variables
- Version controlled
- Documented changes
- Migration guides

### Component Evolution

- Backward compatibility
- Deprecation warnings
- Progressive enhancement
- Feature flags

---

This design system is a living document. Updates should be discussed with the team and documented here before implementation.
