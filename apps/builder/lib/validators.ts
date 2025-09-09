import type { Block } from '@forms/contracts';

export function validateEmail(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateBlockData(block: Block, value: any): ValidationResult {
  // Check required
  if (block.required && !validateRequired(value)) {
    if (block.type === 'checkbox_group') {
      return { valid: false, error: 'Please select at least one option' };
    }
    if (block.type === 'select') {
      return { valid: false, error: 'Please select an option' };
    }
    return { valid: false, error: 'This field is required' };
  }

  // Skip validation if value is empty and not required
  if (!block.required && !validateRequired(value)) {
    return { valid: true };
  }

  // Type-specific validation
  switch (block.type) {
    case 'email':
      if (!validateEmail(value)) {
        return { valid: false, error: 'Please enter a valid email address' };
      }
      break;

    case 'date':
      if (block.validation?.min && value < block.validation.min) {
        return { valid: false, error: `Date must be after ${block.validation.min}` };
      }
      if (block.validation?.max && value > block.validation.max) {
        return { valid: false, error: `Date must be before ${block.validation.max}` };
      }
      break;

    case 'select':
      if (block.options) {
        const validValues = block.options.map(opt => opt.value);
        if (!validValues.includes(value)) {
          return { valid: false, error: 'Invalid selection' };
        }
      }
      break;

    case 'checkbox_group':
      if (Array.isArray(value)) {
        if (block.validation?.min && value.length < block.validation.min) {
          return { valid: false, error: `Please select at least ${block.validation.min} option${block.validation.min > 1 ? 's' : ''}` };
        }
        if (block.validation?.max && value.length > block.validation.max) {
          return { valid: false, error: `Please select at most ${block.validation.max} option${block.validation.max > 1 ? 's' : ''}` };
        }
        if (block.options) {
          const validValues = block.options.map(opt => opt.value);
          const allValid = value.every(v => validValues.includes(v));
          if (!allValid) {
            return { valid: false, error: 'Invalid selection' };
          }
        }
      } else {
        return { valid: false, error: 'Invalid value format' };
      }
      break;

    case 'short_text':
    case 'long_text':
      if (block.validation?.minLength && value.length < block.validation.minLength) {
        return { valid: false, error: `Minimum ${block.validation.minLength} characters required` };
      }
      if (block.validation?.maxLength && value.length > block.validation.maxLength) {
        return { valid: false, error: `Maximum ${block.validation.maxLength} characters allowed` };
      }
      if (block.validation?.pattern) {
        const regex = new RegExp(block.validation.pattern);
        if (!regex.test(value)) {
          return { valid: false, error: 'Invalid format' };
        }
      }
      break;
  }

  return { valid: true };
}