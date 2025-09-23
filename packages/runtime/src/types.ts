export interface Page {
  id: string;
  blocks: Block[];
}

// Type for form field values
export type FieldValue = string | number | boolean | Date | string[] | File | null | undefined;

// Type for block properties
export type BlockProperties = {
  min?: number;
  max?: number;
  step?: number;
  format?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  rows?: number;
  cols?: number;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  minDate?: string;
  maxDate?: string;
  defaultValue?: FieldValue;
  [key: string]: string | number | boolean | FieldValue | undefined;
};

// Type for metadata
export type FormMetadata = {
  userAgent?: string;
  referrer?: string;
  timezone?: string;
  language?: string;
  [key: string]: string | number | boolean | undefined;
};

export interface FormSchema {
  id: string;
  version?: number;
  title?: string;
  description?: string;
  pages?: Page[];
  blocks?: Block[]; // Keep for backward compatibility
  settings?: FormSettings;
  theme?: Theme;
  logic?: LogicRule[];
}

export interface FormSettings {
  submitText?: string;
  showProgressBar?: boolean;
  allowSave?: boolean;
  redirectUrl?: string;
  thankYouMessage?: string;
  displayMode?: "one-question" | "grid";
  allowModeSwitch?: boolean;
}

export interface Theme {
  primaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  spacing?: string;
}

export type BlockType =
  | "text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "currency"
  | "date"
  | "time"
  | "datetime"
  | "dropdown"
  | "select"
  | "checkboxGroup"
  | "checkbox"
  | "rating"
  | "scale"
  | "file_upload"
  | "signature"
  | "payment";

export interface Block {
  id: string;
  type: BlockType;
  question: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  properties?: BlockProperties;
  validation?: ValidationRule[];
  options?: BlockOption[];
}

export type ValidationValue = string | number | RegExp | ((value: FieldValue) => boolean);

export interface ValidationRule {
  type: "min" | "max" | "pattern" | "custom";
  value: ValidationValue;
  message?: string;
}

export interface BlockOption {
  id: string;
  text: string;
  value?: string;
}

export interface LogicRule {
  id: string;
  name?: string;
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export interface LogicCondition {
  id?: string;
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than";
  value: FieldValue;
}

export interface LogicAction {
  id?: string;
  type: "show" | "hide" | "skip" | "jump" | "set_value";
  target: string;
  value?: FieldValue | number; // number for jump actions (step/page index)
}

export interface FormState {
  currentStep: number;
  values: Record<string, FieldValue>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isComplete: boolean;
}

export interface RuntimeConfig {
  formId: string;
  apiUrl: string;
  respondentKey?: string;
  locale?: string;
  onSubmit?: (data: FormData) => void | Promise<void>;
  onPartialSave?: (data: Partial<FormData>) => void | Promise<void>;
  onError?: (error: Error) => void;
  enableOffline?: boolean;
  autoSaveInterval?: number;
  enableAntiSpam?: boolean;
  minCompletionTime?: number;
  onSpamDetected?: (reason: string) => void;
  enableAnalytics?: boolean;
  analyticsApiUrl?: string;
  enableAnalyticsDebug?: boolean;
}

export interface FormData {
  formId: string;
  values: Record<string, FieldValue>;
  startedAt: string;
  completedAt?: string;
  metadata?: FormMetadata;
}

export type FormDataPartial = Record<string, FieldValue>;
