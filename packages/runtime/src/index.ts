// Core exports
export { FormViewer } from './components/FormViewer';
export { FormField } from './components/FormField';
export { ProgressBar } from './components/ProgressBar';

// Hooks
export { useFormRuntime } from './hooks';

// Utilities
export { validateField, evaluateLogic, shouldShowBlock, formatValue } from './utils';
export { injectStyles, generateStyles } from './styles';
export { OfflineStore } from './store';

// Types
export type {
  FormSchema,
  FormSettings,
  Theme,
  Block,
  BlockType,
  ValidationRule,
  LogicRule,
  LogicCondition,
  LogicAction,
  FormState,
  RuntimeConfig,
  FormData,
} from './types';

// Embed helper
export function embed(config: {
  containerId: string;
  formId: string;
  apiUrl: string;
  theme?: any;
  locale?: string;
  onSubmit?: (data: any) => void;
  onError?: (error: Error) => void;
}): void {
  if (typeof window === 'undefined') {
    throw new Error('embed() can only be called in browser environment');
  }

  import('./styles').then(({ injectStyles }) => {
    injectStyles(config.theme);
  });

  // Fetch form schema
  fetch(`${config.apiUrl}/forms/${config.formId}`)
    .then(res => res.json())
    .then(schema => {
      const container = document.getElementById(config.containerId);
      if (!container) {
        throw new Error(`Container #${config.containerId} not found`);
      }

      // Mount React app
      import('react').then(React => {
        import('react-dom/client').then(({ createRoot }) => {
          import('./components/FormViewer').then(({ FormViewer }) => {
            const root = createRoot(container);
            root.render(
              React.createElement(FormViewer, {
                schema,
                config: {
                  formId: config.formId,
                  apiUrl: config.apiUrl,
                  locale: config.locale,
                  onSubmit: config.onSubmit,
                  onError: config.onError,
                  enableOffline: true,
                  autoSaveInterval: 5000,
                },
              })
            );
          });
        });
      });
    })
    .catch(error => {
      if (config.onError) {
        config.onError(error);
      } else {
        console.error('Failed to load form:', error);
      }
    });
}

// Version
export const VERSION = '1.0.0';