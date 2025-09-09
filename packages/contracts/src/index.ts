// Re-export all types from form.contract.ts
export * from './form.contract';

// For backward compatibility, also export simplified types
export interface Block {
  id: string;
  type: string;
  question?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: Array<{
    id: string;
    text: string;
  }>;
  [key: string]: any;
}

export interface Page {
  id: string;
  title?: string;
  description?: string;
  blocks: Block[];
}

export interface Theme {
  [key: string]: any;
}

export interface LogicRule {
  id: string;
  conditions: any[];
  actions: any[];
}

export interface Logic {
  rules: LogicRule[];
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  pages: Page[];
  theme?: Theme;
  logic?: Logic;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}