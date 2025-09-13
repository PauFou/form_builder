export type ValidationType = "min" | "max" | "minLength" | "maxLength" | "pattern" | "custom";

export interface ValidationRule {
  id: string;
  type: ValidationType;
  value?: string | number;
  message?: string;
  pattern?: string; // For regex validation
}

export interface FieldValidation {
  required?: boolean;
  requiredMessage?: string;
  rules: ValidationRule[];
}

// Default validation messages
export const DEFAULT_VALIDATION_MESSAGES = {
  required: "This field is required",
  min: "Value must be at least {{value}}",
  max: "Value must be at most {{value}}",
  minLength: "Must be at least {{value}} characters",
  maxLength: "Must be at most {{value}} characters",
  pattern: "Invalid format",
  custom: "Invalid value",
};

// Common regex patterns
export const COMMON_PATTERNS = {
  email: {
    pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
    label: "Email",
    message: "Please enter a valid email address",
  },
  url: {
    pattern:
      "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
    label: "URL",
    message: "Please enter a valid URL",
  },
  phone: {
    pattern: "^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}$",
    label: "Phone (International)",
    message: "Please enter a valid phone number",
  },
  alphanumeric: {
    pattern: "^[a-zA-Z0-9]+$",
    label: "Alphanumeric only",
    message: "Only letters and numbers allowed",
  },
  letters: {
    pattern: "^[a-zA-Z]+$",
    label: "Letters only",
    message: "Only letters allowed",
  },
  numbers: {
    pattern: "^[0-9]+$",
    label: "Numbers only",
    message: "Only numbers allowed",
  },
};
