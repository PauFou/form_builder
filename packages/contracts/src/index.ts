// Re-export all types from form.contract.ts
export * from "./form.contract";

// For backward compatibility, also export simplified types
export interface Block {
  id: string;
  type: string;
  question: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: Array<{
    id: string;
    label: string;
    value: string;
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

export interface LogicCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
}

export interface LogicAction {
  id: string;
  type: string;
  target?: string;
  value?: any;
}

export interface LogicRule {
  id: string;
  conditions: LogicCondition[];
  actions: LogicAction[];
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

// Additional types needed by the builder
export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  [key: string]: any;
}

export interface FormVersion {
  id: string;
  version: number;
  schema: any;
  publishedAt?: Date;
  [key: string]: any;
}

export interface CreateFormDto {
  title: string;
  description?: string;
  organizationId?: string;
  [key: string]: any;
}

export interface UpdateFormDto {
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  config?: any;
  [key: string]: any;
}
