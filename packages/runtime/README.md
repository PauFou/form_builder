# @forms/runtime

Ultra-lightweight form viewer with SSR support and offline capabilities. < 30KB gzipped.

## Features

- 🚀 **Ultra-light**: < 30KB gzipped bundle size
- ⚡ **Fast**: Optimized for performance with minimal re-renders
- 📱 **Mobile-first**: Touch-optimized, responsive design
- ♿ **Accessible**: WCAG AA compliant with full keyboard navigation
- 🔌 **Offline**: Automatic progress saving with IndexedDB
- 🎨 **Themeable**: CSS variables for easy customization
- 🌐 **SSR**: Server-side rendering support
- 🔒 **Secure**: No external dependencies, sandboxed execution

## Usage

### Basic Embed

```html
<div id="my-form"></div>
<script src="https://cdn.forms.example/runtime.min.js"></script>
<script>
  FormsRuntime.embed({
    containerId: 'my-form',
    formId: 'contact-form',
    apiUrl: 'https://api.forms.example/v1',
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    }
  });
</script>
```

### React Component

```tsx
import { FormViewer } from '@forms/runtime';

function App() {
  const schema = {
    id: 'my-form',
    version: 1,
    blocks: [
      {
        id: 'name',
        type: 'text',
        question: 'What is your name?',
        required: true
      }
    ],
    settings: {
      submitText: 'Send',
      showProgressBar: true
    }
  };

  const config = {
    formId: 'my-form',
    apiUrl: 'https://api.forms.example/v1',
    enableOffline: true,
    onSubmit: async (data) => {
      console.log('Submitted:', data);
    }
  };

  return <FormViewer schema={schema} config={config} />;
}
```

### Server-Side Rendering

```tsx
import { renderFormHTML, renderFormStyles, generateHydrationScript } from '@forms/runtime/ssr';

// In your server
app.get('/form/:id', async (req, res) => {
  const schema = await fetchFormSchema(req.params.id);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${renderFormStyles(schema.theme)}
      </head>
      <body>
        ${renderFormHTML({ schema })}
        ${generateHydrationScript(schema, { 
          formId: schema.id,
          apiUrl: process.env.API_URL 
        })}
        <script src="/runtime.js" defer></script>
      </body>
    </html>
  `;
  
  res.send(html);
});
```

## Customization

### Theming

```css
.fr-container {
  --fr-primary: #4F46E5;
  --fr-font: 'Inter', sans-serif;
  --fr-radius: 8px;
  --fr-spacing: 1.25rem;
}
```

### Custom Field Types

```tsx
import { FormField } from '@forms/runtime';

// Extend with your custom field
function CustomField({ block, value, onChange }) {
  if (block.type === 'custom-map') {
    return <MapPicker value={value} onChange={onChange} />;
  }
  
  return <FormField {...props} />;
}
```

## Bundle Size

| Export | Size (gzip) |
|--------|------------|
| Full bundle | 28 KB |
| Core only | 18 KB |
| SSR only | 8 KB |

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- iOS Safari 14+
- Chrome Android 88+

## Performance

- First Input Delay: < 50ms
- Time to Interactive: < 1s
- Largest Contentful Paint: < 1s
- Cumulative Layout Shift: < 0.01