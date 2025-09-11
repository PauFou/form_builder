/**
 * Logic Evaluator
 * Evaluates logic rules and conditions in forms
 */

import type { LogicRule, LogicCondition, LogicAction, FormData } from "../types";

export class LogicEvaluator {
  private formData: FormData;
  private hiddenFields: Set<string> = new Set();
  private fieldValues: Map<string, any> = new Map();

  constructor(formData: FormData) {
    this.formData = formData;
  }

  /**
   * Update form data for evaluation
   */
  updateFormData(data: Partial<FormData>) {
    this.formData = { ...this.formData, ...data };
    if (data.values) {
      Object.entries(data.values).forEach(([field, value]) => {
        this.fieldValues.set(field, value);
      });
    }
  }

  /**
   * Evaluate all rules and return actions to apply
   */
  evaluateRules(rules: LogicRule[]): LogicAction[] {
    const actionsToApply: LogicAction[] = [];

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions)) {
        actionsToApply.push(...rule.actions);
      }
    }

    return actionsToApply;
  }

  /**
   * Evaluate if all conditions in a rule are met (AND logic)
   */
  private evaluateConditions(conditions: LogicCondition[]): boolean {
    if (conditions.length === 0) return false;

    return conditions.every((condition) => this.evaluateCondition(condition));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: LogicCondition): boolean {
    const fieldValue = this.getFieldValue(condition.field);
    const compareValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return this.isEqual(fieldValue, compareValue);

      case "not_equals":
        return !this.isEqual(fieldValue, compareValue);

      case "contains":
        return this.contains(fieldValue, compareValue);

      case "not_contains":
        return !this.contains(fieldValue, compareValue);

      case "greater_than":
        return this.isGreaterThan(fieldValue, compareValue);

      case "less_than":
        return this.isLessThan(fieldValue, compareValue);

      default:
        return false;
    }
  }

  /**
   * Get field value from form data
   */
  private getFieldValue(fieldId: string): any {
    return this.fieldValues.get(fieldId) ?? this.formData.values?.[fieldId] ?? "";
  }

  /**
   * Check equality with type coercion
   */
  private isEqual(value1: any, value2: any): boolean {
    // Handle null/undefined
    if (value1 == null && value2 == null) return true;
    if (value1 == null || value2 == null) return false;

    // Convert to strings for comparison if types differ
    if (typeof value1 !== typeof value2) {
      return String(value1) === String(value2);
    }

    // Array comparison
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return value1.length === value2.length && value1.every((v, i) => this.isEqual(v, value2[i]));
    }

    return value1 === value2;
  }

  /**
   * Check if value contains substring/element
   */
  private contains(value: any, search: any): boolean {
    if (typeof value === "string" && typeof search === "string") {
      return value.toLowerCase().includes(search.toLowerCase());
    }

    if (Array.isArray(value)) {
      return value.some((item) => this.isEqual(item, search));
    }

    return false;
  }

  /**
   * Compare numeric values
   */
  private isGreaterThan(value: any, compare: any): boolean {
    const num1 = Number(value);
    const num2 = Number(compare);

    if (isNaN(num1) || isNaN(num2)) return false;
    return num1 > num2;
  }

  /**
   * Compare numeric values
   */
  private isLessThan(value: any, compare: any): boolean {
    const num1 = Number(value);
    const num2 = Number(compare);

    if (isNaN(num1) || isNaN(num2)) return false;
    return num1 < num2;
  }

  /**
   * Apply actions and track state
   */
  applyActions(actions: LogicAction[]): {
    hiddenFields: string[];
    fieldUpdates: Record<string, any>;
    navigation?: { type: "skip" | "jump"; target: string };
  } {
    const result = {
      hiddenFields: [] as string[],
      fieldUpdates: {} as Record<string, any>,
      navigation: undefined as { type: "skip" | "jump"; target: string } | undefined,
    };

    // Reset hidden fields
    this.hiddenFields.clear();

    for (const action of actions) {
      switch (action.type) {
        case "show":
          this.hiddenFields.delete(action.target);
          break;

        case "hide":
          this.hiddenFields.add(action.target);
          break;

        case "set_value":
          if (action.value !== undefined) {
            result.fieldUpdates[action.target] = action.value;
            this.fieldValues.set(action.target, action.value);
          }
          break;

        case "skip":
          if (!result.navigation) {
            result.navigation = { type: "skip", target: action.target };
          }
          break;

        case "jump":
          if (!result.navigation) {
            result.navigation = { type: "jump", target: action.target };
          }
          break;
      }
    }

    result.hiddenFields = Array.from(this.hiddenFields);
    return result;
  }

  /**
   * Check if a field should be visible
   */
  isFieldVisible(fieldId: string): boolean {
    return !this.hiddenFields.has(fieldId);
  }

  /**
   * Get all currently hidden fields
   */
  getHiddenFields(): string[] {
    return Array.from(this.hiddenFields);
  }

  /**
   * Reset evaluator state
   */
  reset() {
    this.hiddenFields.clear();
    this.fieldValues.clear();
  }
}

/**
 * Create a logic evaluator instance
 */
export function createLogicEvaluator(initialData: Partial<FormData> = {}): LogicEvaluator {
  return new LogicEvaluator({
    formId: initialData.formId || "",
    values: initialData.values || {},
    startedAt: initialData.startedAt || new Date().toISOString(),
    ...initialData,
  });
}
