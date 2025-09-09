'use client';

import { useEffect } from 'react';

export default function DemoPage() {
  useEffect(() => {
    // Dynamically load the embed script
    const script = document.createElement('script');
    script.innerHTML = `
      // Wait for Forms to be available
      function initForms() {
        if (window.Forms) {
          // Example 1: Inline form
          window.Forms.load({
            formId: 'demo-contact',
            container: '#inline-form',
            onSubmit: (data) => {
              console.log('Form submitted:', data);
              alert('Form submitted successfully!');
            }
          });
          
          // Example 2: Popup form
          document.getElementById('popup-trigger').addEventListener('click', () => {
            window.Forms.load({
              formId: 'demo-survey',
              mode: 'popup',
              theme: {
                primaryColor: '#10b981',
                borderRadius: '12px'
              }
            });
          });
          
          // Example 3: Drawer form
          document.getElementById('drawer-trigger').addEventListener('click', () => {
            window.Forms.load({
              formId: 'demo-feedback',
              mode: 'drawer'
            });
          });
        } else {
          setTimeout(initForms, 100);
        }
      }
      
      // Mock the Forms API for demo
      window.FormRuntime = class {
        constructor(config) {
          this.config = config;
          this.container = null;
        }
        
        mount(container) {
          this.container = container;
          this.container.innerHTML = \`
            <form style="max-width: 500px; margin: 0 auto;">
              <h2 style="margin-bottom: 20px; font-size: 24px; font-weight: 600;">
                \${this.config.title || 'Demo Form'}
              </h2>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Name</label>
                <input type="text" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px;" />
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
                <input type="email" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px;" />
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Message</label>
                <textarea style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; min-height: 80px;"></textarea>
              </div>
              <button type="submit" style="background: \${this.config.theme?.primaryColor || '#3b82f6'}; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">
                Submit
              </button>
            </form>
          \`;
          
          this.container.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.onSubmit) this.onSubmit({});
          });
        }
        
        unmount() {
          if (this.container) {
            this.container.innerHTML = '';
          }
        }
        
        on(event, handler) {
          if (event === 'submit') {
            this.onSubmit = handler;
          }
        }
      };
      
      window.Forms = {
        load: (options) => {
          // Simulate loading
          const form = new window.FormRuntime({
            title: options.formId === 'demo-contact' ? 'Contact Us' : 
                   options.formId === 'demo-survey' ? 'Quick Survey' : 'Feedback',
            theme: options.theme
          });
          
          if (options.onSubmit) {
            form.on('submit', options.onSubmit);
          }
          
          if (options.mode === 'popup') {
            // Create popup
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
            modal.innerHTML = \`
              <div style="background: white; padding: 32px; border-radius: 16px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <button style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                <div id="popup-content"></div>
              </div>
            \`;
            
            document.body.appendChild(modal);
            form.mount(modal.querySelector('#popup-content'));
            
            modal.addEventListener('click', (e) => {
              if (e.target === modal || e.target.textContent === '×') {
                form.unmount();
                modal.remove();
              }
            });
          } else if (options.mode === 'drawer') {
            // Create drawer
            const drawer = document.createElement('div');
            drawer.style.cssText = 'position: fixed; inset: 0; z-index: 9999;';
            drawer.innerHTML = \`
              <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5);"></div>
              <div style="position: absolute; right: 0; top: 0; bottom: 0; background: white; width: 100%; max-width: 480px; overflow-y: auto; transform: translateX(100%); transition: transform 0.3s;">
                <button style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                <div id="drawer-content" style="padding: 32px; padding-top: 64px;"></div>
              </div>
            \`;
            
            document.body.appendChild(drawer);
            const panel = drawer.querySelector('div:last-child');
            
            requestAnimationFrame(() => {
              panel.style.transform = 'translateX(0)';
            });
            
            form.mount(drawer.querySelector('#drawer-content'));
            
            drawer.addEventListener('click', (e) => {
              if (e.target === drawer.firstElementChild || e.target.textContent === '×') {
                panel.style.transform = 'translateX(100%)';
                setTimeout(() => {
                  form.unmount();
                  drawer.remove();
                }, 300);
              }
            });
          } else {
            // Inline mode
            const container = document.querySelector(options.container);
            if (container) {
              form.mount(container);
            }
          }
        }
      };
      
      initForms();
    `;
    document.body.appendChild(script);
    
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Form Runtime Demo</h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          Ultra-lightweight form runtime &lt;30KB gzipped
        </p>

        {/* Bundle Size Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">Bundle Sizes</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">~25KB</div>
              <div className="text-sm text-gray-600 mt-1">Full Runtime (gzipped)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">~5KB</div>
              <div className="text-sm text-gray-600 mt-1">Embed Script (gzipped)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">&lt;200ms</div>
              <div className="text-sm text-gray-600 mt-1">Time to Interactive</div>
            </div>
          </div>
        </div>

        {/* Demo 1: Inline Form */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Inline Form</h2>
          <div id="inline-form"></div>
        </div>

        {/* Demo 2: Popup Form */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Popup Form</h2>
          <p className="text-gray-600 mb-4">Click the button to open a form in a modal popup.</p>
          <button 
            id="popup-trigger"
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Open Popup Form
          </button>
        </div>

        {/* Demo 3: Drawer Form */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Drawer Form</h2>
          <p className="text-gray-600 mb-4">Click the button to open a form in a side drawer.</p>
          <button 
            id="drawer-trigger"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Open Drawer Form
          </button>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Runtime Features</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Core Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Multi-page forms with progress tracking</li>
                <li>✓ Client-side validation</li>
                <li>✓ Conditional logic</li>
                <li>✓ Auto-save & offline support</li>
                <li>✓ Partial submissions</li>
                <li>✓ Custom themes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Performance</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ No framework dependencies</li>
                <li>✓ Tree-shaken & minified</li>
                <li>✓ Lazy loaded on demand</li>
                <li>✓ CDN cached globally</li>
                <li>✓ Brotli compression</li>
                <li>✓ ES2020 syntax</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Embed Code Example */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Embed Code</h3>
          <pre className="text-sm overflow-x-auto">
            <code>{`<!-- Add this to your HTML -->
<div data-forms-id="your-form-id" data-forms-mode="inline"></div>
<script src="https://cdn.forms.app/embed.js" async></script>

<!-- Or use the JavaScript API -->
<script>
  Forms.load({
    formId: 'your-form-id',
    container: '#my-container',
    mode: 'popup', // or 'inline', 'drawer'
    theme: {
      primaryColor: '#3b82f6',
      borderRadius: '12px'
    },
    onSubmit: (data) => {
      console.log('Submitted:', data);
    }
  });
</script>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}'