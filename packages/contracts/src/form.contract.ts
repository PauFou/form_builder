/**
 * Contract tests for form data structures between builder and runtime
 */

import { z } from "zod";

// Field types enum
export const FieldType = z.enum([
  "text",
  "long_text",
  "email",
  "phone",
  "number",
  "currency",
  "date",
  "address",
  "dropdown",
  "single_select",
  "multi_select",
  "matrix",
  "rating",
  "nps",
  "scale",
  "ranking",
  "signature",
  "file_upload",
  "payment",
  "scheduler",
]);

// Validation rules
export const ValidationRule = z.object({
  type: z.enum(["required", "min", "max", "pattern", "custom"]),
  value: z.any().optional(),
  message: z.string().optional(),
});

// Field schema
export const Field = z.object({
  id: z.string(),
  type: FieldType,
  title: z.string(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  validation: z.array(ValidationRule).optional(),
  options: z
    .array(
      z.object({
        id: z.string().optional(),
        value: z.string(),
        label: z.string(),
        text: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .optional(),
  config: z.record(z.any()).optional(),
});

// Logic rule
export const LogicRule = z.object({
  id: z.string(),
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        "equals",
        "not_equals",
        "contains",
        "not_contains",
        "greater_than",
        "less_than",
      ]),
      value: z.any(),
    })
  ),
  actions: z.array(
    z.object({
      type: z.enum(["show", "hide", "skip", "jump", "set_value"]),
      target: z.string(),
      value: z.any().optional(),
    })
  ),
});

// Page schema
export const Page = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  blocks: z.array(Field),
});

// Theme schema
export const Theme = z.object({
  colors: z
    .object({
      primary: z.string(),
      background: z.string(),
      surface: z.string(),
      text: z.string(),
      textMuted: z.string(),
      border: z.string(),
      error: z.string(),
      success: z.string(),
    })
    .optional(),
  typography: z
    .object({
      fontFamily: z.string(),
      fontSize: z.object({
        base: z.string(),
        sm: z.string(),
        lg: z.string(),
        xl: z.string(),
      }),
      fontWeight: z.object({
        normal: z.number(),
        medium: z.number(),
        bold: z.number(),
      }),
    })
    .optional(),
  spacing: z
    .object({
      xs: z.string(),
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
      xl: z.string(),
    })
    .optional(),
  borderRadius: z
    .object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
    })
    .optional(),
});

// Form settings
export const FormSettings = z.object({
  submitLabel: z.string().default("Submit"),
  showProgressBar: z.boolean().default(true),
  allowSaveAndResume: z.boolean().default(true),
  redirectUrl: z.string().optional(),
  thankYouMessage: z.string().optional(),
  notifications: z
    .object({
      email: z.string().email().optional(),
      slack: z.string().url().optional(),
    })
    .optional(),
});

// Complete form schema
export const FormSchema = z.object({
  id: z.string(),
  version: z.number(),
  title: z.string(),
  description: z.string().optional(),
  pages: z.array(Page),
  logic: z.array(LogicRule).optional(),
  theme: Theme.optional(),
  settings: FormSettings.optional(),
  metadata: z.record(z.any()).optional(),
});

// Submission schema
export const SubmissionSchema = z.object({
  id: z.string(),
  formId: z.string(),
  formVersion: z.number(),
  respondentId: z.string(),
  sessionId: z.string(),
  answers: z.record(z.any()),
  metadata: z
    .object({
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime().optional(),
      timeSpentSeconds: z.number().optional(),
      device: z.enum(["desktop", "mobile", "tablet"]).optional(),
      browser: z.string().optional(),
      ipAddress: z.string().optional(),
      location: z
        .object({
          country: z.string(),
          region: z.string().optional(),
          city: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  partial: z.boolean().default(false),
});

// Export type aliases
export type FieldType = z.infer<typeof FieldType>;
export type Field = z.infer<typeof Field>;
export type Page = z.infer<typeof Page>;
export type LogicRule = z.infer<typeof LogicRule>;
export type Theme = z.infer<typeof Theme>;
export type FormSettings = z.infer<typeof FormSettings>;
export type Form = z.infer<typeof FormSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
