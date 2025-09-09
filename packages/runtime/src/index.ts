// Ultra-lightweight form runtime (<30KB)
export const VERSION = '1.0.0';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
}

export interface FormPage {
  id: string;
  fields: FormField[];
  conditions?: Array<{
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
    action: 'show' | 'hide' | 'jump_to';
    targetId?: string;
  }>;
}

export interface FormTheme {
  primaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  spacing?: string;
}

export interface FormConfig {
  id: string;
  version: number;
  pages: FormPage[];
  theme?: FormTheme;
  submitUrl: string;
  redirectUrl?: string;
  partialSubmission?: boolean;
  offlineMode?: boolean;
}

export interface FormState {
  currentPage: number;
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isComplete: boolean;
}

// Lightweight event emitter
class EventEmitter {
  private events: Record<string, Function[]> = {};
  
  on(event: string, handler: Function) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(handler);
  }
  
  off(event: string, handler: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }
  
  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(handler => handler(...args));
  }
}

// Main runtime class
export class FormRuntime extends EventEmitter {
  private config: FormConfig;
  private state: FormState;
  private container: HTMLElement | null = null;
  private saveTimer: number | null = null;
  
  constructor(config: FormConfig) {
    super();
    this.config = config;
    this.state = {
      currentPage: 0,
      values: this.loadFromStorage() || {},
      errors: {},
      touched: {},
      isSubmitting: false,
      isComplete: false
    };
  }
  
  mount(container: HTMLElement) {
    this.container = container;
    this.render();
    this.attachEventListeners();
    this.emit('mount');
  }
  
  unmount() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.emit('unmount');
  }
  
  private render() {
    if (!this.container) return;
    
    const page = this.config.pages[this.state.currentPage];
    if (!page) return;
    
    // Apply theme
    if (this.config.theme) {
      const style = `
        --form-primary: ${this.config.theme.primaryColor || '#3b82f6'};
        --form-font: ${this.config.theme.fontFamily || 'sans-serif'};
        --form-radius: ${this.config.theme.borderRadius || '8px'};
        --form-spacing: ${this.config.theme.spacing || '16px'};
      `;
      this.container.setAttribute('style', style);
    }
    
    // Render form
    this.container.innerHTML = `
      <form class="form-runtime" novalidate>
        <div class="form-page">
          ${page.fields.map(field => this.renderField(field)).join('')}
        </div>
        <div class="form-actions">
          ${this.state.currentPage > 0 ? '<button type="button" class="form-btn form-btn-secondary" data-action="prev">Previous</button>' : ''}
          ${this.state.currentPage < this.config.pages.length - 1 
            ? '<button type="button" class="form-btn form-btn-primary" data-action="next">Next</button>'
            : '<button type="submit" class="form-btn form-btn-primary" data-action="submit">Submit</button>'
          }
        </div>
        <div class="form-progress">
          <div class="form-progress-bar" style="width: ${((this.state.currentPage + 1) / this.config.pages.length) * 100}%"></div>
        </div>
      </form>
    `;
    
    // Restore field values
    page.fields.forEach(field => {
      const element = this.container?.querySelector(`[name="${field.id}"]`) as HTMLInputElement;
      if (element && this.state.values[field.id] !== undefined) {
        if (field.type === 'checkbox') {
          element.checked = this.state.values[field.id];
        } else {
          element.value = this.state.values[field.id];
        }
      }
    });
  }
  
  private renderField(field: FormField): string {
    const error = this.state.errors[field.id];
    const value = this.state.values[field.id] || field.defaultValue || '';
    
    let input = '';
    switch (field.type) {
      case 'textarea':
        input = `<textarea name="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>${value}</textarea>`;
        break;
      case 'select':
        input = `
          <select name="${field.id}" ${field.required ? 'required' : ''}>
            <option value="">Choose...</option>
            ${field.options?.map(opt => `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('') || ''}
          </select>
        `;
        break;
      case 'radio':
        input = field.options?.map(opt => `
          <label class="form-radio">
            <input type="radio" name="${field.id}" value="${opt.value}" ${value === opt.value ? 'checked' : ''} ${field.required ? 'required' : ''}>
            <span>${opt.label}</span>
          </label>
        `).join('') || '';
        break;
      case 'checkbox':
        input = `
          <label class="form-checkbox">
            <input type="checkbox" name="${field.id}" ${value ? 'checked' : ''} ${field.required ? 'required' : ''}>
            <span>${field.label}</span>
          </label>
        `;
        return `<div class="form-field">${input}${error ? `<span class="form-error">${error}</span>` : ''}</div>`;
      default:
        input = `<input type="${field.type}" name="${field.id}" value="${value}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
    }
    
    return `
      <div class="form-field ${error ? 'form-field-error' : ''}">
        ${field.type !== 'checkbox' ? `<label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>` : ''}
        ${input}
        ${error ? `<span class="form-error">${error}</span>` : ''}
      </div>
    `;
  }
  
  private attachEventListeners() {
    if (!this.container) return;
    
    // Form submission
    const form = this.container.querySelector('form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    // Button actions
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      
      if (action === 'prev') {
        this.previousPage();
      } else if (action === 'next') {
        this.nextPage();
      }
    });
    
    // Field changes
    this.container.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const fieldId = target.name;
      if (!fieldId) return;
      
      // Update value
      if (target.type === 'checkbox') {
        this.state.values[fieldId] = target.checked;
      } else {
        this.state.values[fieldId] = target.value;
      }
      
      // Mark as touched
      this.state.touched[fieldId] = true;
      
      // Clear error
      if (this.state.errors[fieldId]) {
        delete this.state.errors[fieldId];
        this.render();
      }
      
      // Auto-save
      this.scheduleSave();
      
      // Emit change event
      this.emit('change', { fieldId, value: this.state.values[fieldId] });
    });
  }
  
  private validatePage(): boolean {
    const page = this.config.pages[this.state.currentPage];
    if (!page) return false;
    
    let isValid = true;
    const errors: Record<string, string> = {};
    
    page.fields.forEach(field => {
      const value = this.state.values[field.id];
      
      // Required validation
      if (field.required && !value) {
        errors[field.id] = 'This field is required';
        isValid = false;
      }
      
      // Pattern validation
      if (value && field.validation?.pattern) {
        const pattern = new RegExp(field.validation.pattern);
        if (!pattern.test(value)) {
          errors[field.id] = 'Invalid format';
          isValid = false;
        }
      }
      
      // Min/Max validation
      if (field.type === 'number' && value) {
        const num = parseFloat(value);
        if (field.validation?.min !== undefined && num < field.validation.min) {
          errors[field.id] = `Must be at least ${field.validation.min}`;
          isValid = false;
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          errors[field.id] = `Must be at most ${field.validation.max}`;
          isValid = false;
        }
      }
    });
    
    this.state.errors = errors;
    if (!isValid) {
      this.render();
    }
    
    return isValid;
  }
  
  private nextPage() {
    if (!this.validatePage()) return;
    
    if (this.state.currentPage < this.config.pages.length - 1) {
      this.state.currentPage++;
      this.render();
      this.emit('pageChange', this.state.currentPage);
    }
  }
  
  private previousPage() {
    if (this.state.currentPage > 0) {
      this.state.currentPage--;
      this.render();
      this.emit('pageChange', this.state.currentPage);
    }
  }
  
  private async handleSubmit() {
    if (!this.validatePage()) return;
    
    this.state.isSubmitting = true;
    this.render();
    
    try {
      const response = await fetch(this.config.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: this.config.id,
          version: this.config.version,
          data: this.state.values,
          completedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Submission failed');
      }
      
      this.state.isComplete = true;
      this.clearStorage();
      this.emit('submit', this.state.values);
      
      if (this.config.redirectUrl) {
        window.location.href = this.config.redirectUrl;
      } else {
        this.showThankYou();
      }
    } catch (error) {
      this.state.isSubmitting = false;
      this.emit('error', error);
      alert('Failed to submit form. Please try again.');
      this.render();
    }
  }
  
  private showThankYou() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="form-complete">
        <h2>Thank you!</h2>
        <p>Your response has been submitted successfully.</p>
      </div>
    `;
  }
  
  private scheduleSave() {
    if (!this.config.partialSubmission) return;
    
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    this.saveTimer = window.setTimeout(() => {
      this.saveToStorage();
      this.savePartial();
    }, 1000);
  }
  
  private async savePartial() {
    try {
      await fetch(this.config.submitUrl + '/partial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: this.config.id,
          version: this.config.version,
          data: this.state.values,
          currentPage: this.state.currentPage,
          updatedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      // Silent fail for partial saves
    }
  }
  
  private loadFromStorage(): Record<string, any> | null {
    if (!this.config.offlineMode) return null;
    
    try {
      const data = localStorage.getItem(`form_${this.config.id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  private saveToStorage() {
    if (!this.config.offlineMode) return;
    
    try {
      localStorage.setItem(`form_${this.config.id}`, JSON.stringify(this.state.values));
    } catch {
      // Silent fail
    }
  }
  
  private clearStorage() {
    if (!this.config.offlineMode) return;
    
    try {
      localStorage.removeItem(`form_${this.config.id}`);
    } catch {
      // Silent fail
    }
  }
}

// Factory function for easy initialization
export function createForm(config: FormConfig): FormRuntime {
  return new FormRuntime(config);
}

// Export FormViewer component
export { FormViewer } from './FormViewer';
export type { FormViewerProps } from './FormViewer';