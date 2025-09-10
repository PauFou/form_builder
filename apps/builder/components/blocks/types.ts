export interface Block {
  id: string;
  type: string;
  question: string;
  description?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  validation?: Array<{
    type: "required" | "min" | "max" | "pattern" | "custom";
    value?: any;
    message?: string;
  }>;
  options?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  defaultValue?: any;
  min?: number;
  max?: number;
  // Design properties
  width?: "full" | "half" | "third";
  alignment?: "left" | "center" | "right";
  cssClasses?: string;
  // Logic properties
  visibleIf?: {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
    value: any;
  };
  // Data properties
  key?: string;
  isPII?: boolean;
  excludeFromAnalytics?: boolean;
  notes?: string;
}

export interface BlockProps {
  block: Block;
  isSelected?: boolean;
  onUpdate?: (updates: Partial<Block>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}
