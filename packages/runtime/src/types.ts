export interface Page {
  id: string;
  blocks: Block[];
}

// Type for form field values
export type FieldValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | File
  | null
  | undefined
  | { amount?: number; currency?: string } // For currency block
  | { score?: number; feedback?: string } // For NPS block
  | Record<string, string | string[]> // For matrix block
  | Array<{ date: string; slotId: string; time: string }>; // For scheduler block

// Type for block properties
export type BlockProperties = {
  min?: number;
  max?: number;
  step?: number;
  format?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  rows?: number | Array<{ id: string; label: string }>; // For matrix block
  cols?: number;
  columns?: Array<{ id: string; label: string }>; // For matrix block
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  minDate?: string;
  maxDate?: string;
  defaultValue?: FieldValue;
  // Payment block
  amount?: number;
  stripePublicKey?: string;
  allowCoupons?: boolean;
  // NPS block
  notLikelyLabel?: string;
  extremelyLikelyLabel?: string;
  showLabels?: boolean;
  showFollowUp?: boolean;
  followUpQuestion?: string;
  // Scale block
  minLabel?: string;
  maxLabel?: string;
  showValue?: boolean;
  prefix?: string;
  suffix?: string;
  marks?: Array<{ value: number; label: string }>;
  // Ranking block
  choices?: Array<{ id: string; label: string }>;
  minRankings?: number;
  maxRankings?: number;
  allowPartialRanking?: boolean;
  // Currency block
  defaultCurrency?: string;
  allowCurrencyChange?: boolean;
  currencies?: string[];
  decimalPlaces?: number;
  // Signature block
  backgroundColor?: string;
  penColor?: string;
  width?: number;
  height?: number;
  allowDownload?: boolean;
  // Scheduler block
  availableSlots?: Array<{
    date: string;
    slots: Array<{
      id: string;
      time: string;
      available: boolean;
    }>;
  }>;
  timeSlotDuration?: number;
  timezone?: string;
  allowMultiple?: boolean;
  maxSelections?: number;
  [key: string]: string | number | boolean | FieldValue | undefined | any[];
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
  showNavigationArrows?: boolean;
  enableRefillLink?: boolean;
  enableRecaptcha?: boolean;
  showPoweredBy?: boolean;
  allowSave?: boolean;
  redirectUrl?: string;
  thankYouMessage?: string;
  displayMode?: "one-question" | "grid";
  allowModeSwitch?: boolean;
  emailNotifications?: {
    enabled?: boolean;
    recipients?: string[];
    replyToField?: string; // Block ID of email field
    subject?: string;
    body?: string;
  };
  responderEmail?: {
    enabled?: boolean;
    toField?: string; // Block ID of email field to send to
    fromName?: string;
    fromEmail?: string;
    replyTo?: "owner" | "field" | "custom";
    replyToField?: string; // Block ID if replyTo is "field"
    replyToCustom?: string; // Custom email if replyTo is "custom"
    subject?: string;
    body?: string;
  };
  access?: {
    closeForm?: boolean;
    closeFormByDate?: boolean;
    closeFormDate?: string; // ISO date string
    closeFormBySubmissions?: boolean;
    maxSubmissions?: number;
    autoRefreshOnInactivity?: boolean;
    inactivityTimeout?: number; // in minutes
  };
  linkSettings?: {
    title?: string; // Max 60 characters
    description?: string; // Max 110 characters
    socialPreviewImage?: string; // URL or file path
    favicon?: string; // URL or file path
  };
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
  | "ranking"
  | "matrix"
  | "file_upload"
  | "signature"
  | "payment"
  | "scheduler"
  | "contact_info";

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
