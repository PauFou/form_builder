export interface FormSchema {
  id: string;
  version: number;
  blocks: Block[];
  settings: FormSettings;
  theme?: Theme;
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
  description?: string;
  required?: boolean;
  properties?: Record<string, any>;
  validation?: ValidationRule[];
  logic?: LogicRule[];
}

export interface ValidationRule {
  type: "min" | "max" | "pattern" | "custom";
  value: any;
  message?: string;
}

export interface LogicRule {
  condition: LogicCondition;
  action: LogicAction;
}

export interface LogicCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: any;
}

export interface LogicAction {
  type: "show" | "hide" | "jump_to" | "set_value";
  target?: string;
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
  onPartialSave?: (data: Partial<FormData>) => void;
  onError?: (error: Error) => void;
  enableOffline?: boolean;
  autoSaveInterval?: number;
}

export interface FormData {
  formId: string;
  values: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}
