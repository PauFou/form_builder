export interface Page {
  id: string;
  blocks: Block[];
}

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
  | "single_select"
  | "multi_select"
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
  properties?: Record<string, any>;
  validation?: ValidationRule[];
  options?: BlockOption[];
}

export interface ValidationRule {
  type: "min" | "max" | "pattern" | "custom";
  value: any;
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
  value: any;
}

export interface LogicAction {
  id?: string;
  type: "show" | "hide" | "skip" | "jump" | "set_value";
  target: string;
  value?: any;
}

export interface FormState {
  currentStep: number;
  values: Record<string, any>;
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
  values: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export type FormDataPartial = Record<string, any>;
