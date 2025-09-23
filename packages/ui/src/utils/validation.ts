/**
 * Validation utilities with accessibility features
 * Provides ARIA-compliant validation for forms
 */

export interface ValidationError {
  field: string;
  message: string;
  type: "required" | "invalid" | "min" | "max" | "pattern" | "custom";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  errorSummary?: string;
}

/**
 * Creates an accessible error summary for screen readers
 */
export function createErrorSummary(errors: ValidationError[]): string {
  if (errors.length === 0) return "";

  const errorCount = errors.length;
  const plural = errorCount > 1 ? "s" : "";

  return `${errorCount} error${plural} found: ${errors.map((e) => e.message).join(", ")}`;
}

/**
 * Gets ARIA attributes for field validation state
 */
export function getFieldAriaAttributes(
  fieldName: string,
  error?: ValidationError,
  helperId?: string
) {
  const errorId = error ? `${fieldName}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return {
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-errormessage": errorId,
  };
}

/**
 * Validates required fields
 */
export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === "") {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      type: "required",
    };
  }
  return null;
}

/**
 * Validates email format
 */
export function validateEmail(value: string, fieldName: string = "Email"): ValidationError | null {
  if (!value) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      field: fieldName,
      message: `Please enter a valid email address`,
      type: "invalid",
    };
  }
  return null;
}

/**
 * Validates minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): ValidationError | null {
  if (!value) return null;

  if (value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters`,
      type: "min",
    };
  }
  return null;
}

/**
 * Validates maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): ValidationError | null {
  if (!value) return null;

  if (value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be no more than ${maxLength} characters`,
      type: "max",
    };
  }
  return null;
}

/**
 * Validates URL format
 */
export function validateUrl(value: string, fieldName: string = "URL"): ValidationError | null {
  if (!value) return null;

  try {
    new URL(value);
    return null;
  } catch {
    return {
      field: fieldName,
      message: `Please enter a valid URL`,
      type: "invalid",
    };
  }
}

/**
 * Validates phone number format (international)
 */
export function validatePhone(value: string, fieldName: string = "Phone"): ValidationError | null {
  if (!value) return null;

  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(value)) {
    return {
      field: fieldName,
      message: `Please enter a valid phone number`,
      type: "invalid",
    };
  }
  return null;
}

/**
 * Composite validator for form validation
 */
export class FormValidator {
  private rules: Map<string, Array<(value: any) => ValidationError | null>> = new Map();

  addRule(fieldName: string, validator: (value: any) => ValidationError | null) {
    if (!this.rules.has(fieldName)) {
      this.rules.set(fieldName, []);
    }
    this.rules.get(fieldName)!.push(validator);
    return this;
  }

  required(fieldName: string) {
    return this.addRule(fieldName, (value) => validateRequired(value, fieldName));
  }

  email(fieldName: string) {
    return this.addRule(fieldName, (value) => validateEmail(value, fieldName));
  }

  minLength(fieldName: string, minLength: number) {
    return this.addRule(fieldName, (value) => validateMinLength(value, minLength, fieldName));
  }

  maxLength(fieldName: string, maxLength: number) {
    return this.addRule(fieldName, (value) => validateMaxLength(value, maxLength, fieldName));
  }

  url(fieldName: string) {
    return this.addRule(fieldName, (value) => validateUrl(value, fieldName));
  }

  phone(fieldName: string) {
    return this.addRule(fieldName, (value) => validatePhone(value, fieldName));
  }

  custom(fieldName: string, validator: (value: any) => ValidationError | null) {
    return this.addRule(fieldName, validator);
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [fieldName, validators] of this.rules) {
      const value = data[fieldName];

      for (const validator of validators) {
        const error = validator(value);
        if (error) {
          errors.push(error);
          break; // Stop on first error for this field
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      errorSummary: createErrorSummary(errors),
    };
  }
}

/**
 * Hook for managing field validation with accessibility
 */
export function useFieldValidation(fieldName: string) {
  const [error, setError] = React.useState<ValidationError | null>(null);
  const [touched, setTouched] = React.useState(false);

  const validate = React.useCallback(
    (value: any, validators: Array<(value: any) => ValidationError | null>) => {
      for (const validator of validators) {
        const validationError = validator(value);
        if (validationError) {
          setError(validationError);
          return false;
        }
      }
      setError(null);
      return true;
    },
    []
  );

  const ariaAttributes = React.useMemo(() => {
    return getFieldAriaAttributes(fieldName, error || undefined);
  }, [fieldName, error]);

  return {
    error,
    touched,
    setTouched,
    validate,
    ariaAttributes,
    hasError: !!error && touched,
  };
}

// Re-export React for the hook
import * as React from "react";
