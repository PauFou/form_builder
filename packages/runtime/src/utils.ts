import type { Block, LogicRule, ValidationRule } from './types';

export function validateField(block: Block, value: any): string | null {
  // Required validation
  if (block.required && !value) {
    return `${block.question} is required`;
  }

  // Type-specific validations
  switch (block.type) {
    case 'email':
      if (value && !isValidEmail(value)) {
        return 'Please enter a valid email address';
      }
      break;

    case 'phone':
      if (value && !isValidPhone(value)) {
        return 'Please enter a valid phone number';
      }
      break;

    case 'number':
    case 'currency':
      if (value && isNaN(Number(value))) {
        return 'Please enter a valid number';
      }
      break;

    case 'date':
      if (value && !isValidDate(value)) {
        return 'Please enter a valid date';
      }
      break;
  }

  // Custom validation rules
  if (block.validation) {
    for (const rule of block.validation) {
      const error = applyValidationRule(rule, value);
      if (error) return error;
    }
  }

  return null;
}

function applyValidationRule(rule: ValidationRule, value: any): string | null {
  switch (rule.type) {
    case 'min':
      if (typeof value === 'string' && value.length < rule.value) {
        return rule.message || `Minimum length is ${rule.value}`;
      }
      if (typeof value === 'number' && value < rule.value) {
        return rule.message || `Minimum value is ${rule.value}`;
      }
      break;

    case 'max':
      if (typeof value === 'string' && value.length > rule.value) {
        return rule.message || `Maximum length is ${rule.value}`;
      }
      if (typeof value === 'number' && value > rule.value) {
        return rule.message || `Maximum value is ${rule.value}`;
      }
      break;

    case 'pattern':
      if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
        return rule.message || 'Invalid format';
      }
      break;
  }

  return null;
}

export function evaluateLogic(
  rules: LogicRule[],
  values: Record<string, any>
): LogicRule | null {
  for (const rule of rules) {
    if (evaluateCondition(rule.condition, values)) {
      return rule;
    }
  }
  return null;
}

function evaluateCondition(
  condition: LogicRule['condition'],
  values: Record<string, any>
): boolean {
  const fieldValue = values[condition.field];
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === compareValue;
    
    case 'not_equals':
      return fieldValue !== compareValue;
    
    case 'contains':
      return String(fieldValue).includes(String(compareValue));
    
    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);
    
    case 'less_than':
      return Number(fieldValue) < Number(compareValue);
    
    default:
      return false;
  }
}

export function shouldShowBlock(
  block: Block,
  values: Record<string, any>
): boolean {
  if (!block.logic || block.logic.length === 0) {
    return true;
  }

  const applicableRule = evaluateLogic(block.logic, values);
  
  if (applicableRule) {
    return applicableRule.action.type === 'show';
  }

  return true; // Default to showing if no rules match
}

// Validation helpers
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - can be customized per locale
  return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function isValidDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

// Debounce for auto-save
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format display values
export function formatValue(value: any, type: Block['type']): string {
  if (value == null) return '';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value));
    
    case 'date':
      return new Date(value).toLocaleDateString();
    
    case 'datetime':
      return new Date(value).toLocaleString();
    
    case 'multi_select':
      return Array.isArray(value) ? value.join(', ') : String(value);
    
    default:
      return String(value);
  }
}