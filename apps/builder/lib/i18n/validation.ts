import { z } from "zod";
import { Translation } from "./types";

// Custom error map factory that uses i18n translations
export function createI18nErrorMap(t: Translation): z.ZodErrorMap {
  return (issue, ctx) => {
    let message: string;

    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.expected === "string") {
          message = t.validation.custom;
        } else if (issue.expected === "number") {
          message = t.validation.number;
        } else {
          message = t.validation.custom;
        }
        break;

      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") {
          message = t.validation.email;
        } else if (issue.validation === "url") {
          message = t.validation.url;
        } else {
          message = t.validation.custom;
        }
        break;

      case z.ZodIssueCode.too_small:
        if (issue.type === "string") {
          message = t.validation.minLength.replace("{min}", String(issue.minimum));
        } else if (issue.type === "number") {
          message = t.validation.minValue.replace("{min}", String(issue.minimum));
        } else if (issue.type === "array") {
          message = t.validation.required;
        } else {
          message = t.validation.custom;
        }
        break;

      case z.ZodIssueCode.too_big:
        if (issue.type === "string") {
          message = t.validation.maxLength.replace("{max}", String(issue.maximum));
        } else if (issue.type === "number") {
          message = t.validation.maxValue.replace("{max}", String(issue.maximum));
        } else {
          message = t.validation.custom;
        }
        break;

      case z.ZodIssueCode.custom:
        message = issue.message || t.validation.custom;
        break;

      default:
        message = t.validation.custom;
    }

    return { message };
  };
}

// Common validation schemas with i18n support
export function createValidationSchemas(t: Translation) {
  return {
    email: z.string().email({ message: t.validation.email }),

    phone: z.string().regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{4,6}$/, {
      message: t.validation.phone,
    }),

    url: z.string().url({ message: t.validation.url }),

    required: z.string().min(1, { message: t.validation.required }),

    number: z.number({
      required_error: t.validation.required,
      invalid_type_error: t.validation.number,
    }),

    positiveNumber: z.number().positive({ message: t.validation.positive }),

    integer: z.number().int({ message: t.validation.integer }),

    date: z.date({
      required_error: t.validation.required,
      invalid_type_error: t.validation.date,
    }),

    file: (maxSize?: number, allowedTypes?: string[]) => {
      let schema = z.instanceof(File);

      if (maxSize) {
        schema = schema.refine((file) => file.size <= maxSize, {
          message: t.validation.fileSize.replace("{max}", formatBytes(maxSize)),
        });
      }

      if (allowedTypes && allowedTypes.length > 0) {
        schema = schema.refine((file) => allowedTypes.includes(file.type), {
          message: t.validation.fileType.replace("{types}", allowedTypes.join(", ")),
        });
      }

      return schema;
    },
  };
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Form field validation rules
export interface FieldValidationRule {
  type:
    | "required"
    | "minLength"
    | "maxLength"
    | "minValue"
    | "maxValue"
    | "pattern"
    | "email"
    | "url"
    | "phone";
  value?: any;
  message?: string;
}

// Apply validation rules to a Zod schema
export function applyValidationRules(
  baseSchema: z.ZodSchema<any>,
  rules: FieldValidationRule[],
  t: Translation
): z.ZodSchema<any> {
  let schema = baseSchema;

  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        if (schema instanceof z.ZodString) {
          schema = schema.min(1, { message: rule.message || t.validation.required });
        }
        break;

      case "minLength":
        if (schema instanceof z.ZodString && rule.value) {
          schema = schema.min(rule.value, {
            message: rule.message || t.validation.minLength.replace("{min}", String(rule.value)),
          });
        }
        break;

      case "maxLength":
        if (schema instanceof z.ZodString && rule.value) {
          schema = schema.max(rule.value, {
            message: rule.message || t.validation.maxLength.replace("{max}", String(rule.value)),
          });
        }
        break;

      case "minValue":
        if (schema instanceof z.ZodNumber && rule.value) {
          schema = schema.min(rule.value, {
            message: rule.message || t.validation.minValue.replace("{min}", String(rule.value)),
          });
        }
        break;

      case "maxValue":
        if (schema instanceof z.ZodNumber && rule.value) {
          schema = schema.max(rule.value, {
            message: rule.message || t.validation.maxValue.replace("{max}", String(rule.value)),
          });
        }
        break;

      case "pattern":
        if (schema instanceof z.ZodString && rule.value) {
          schema = schema.regex(new RegExp(rule.value), {
            message: rule.message || t.validation.pattern,
          });
        }
        break;

      case "email":
        if (schema instanceof z.ZodString) {
          schema = schema.email({ message: rule.message || t.validation.email });
        }
        break;

      case "url":
        if (schema instanceof z.ZodString) {
          schema = schema.url({ message: rule.message || t.validation.url });
        }
        break;

      case "phone":
        if (schema instanceof z.ZodString) {
          schema = schema.regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{4,6}$/, {
            message: rule.message || t.validation.phone,
          });
        }
        break;
    }
  }

  return schema;
}
