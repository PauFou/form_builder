import type { Form, Block, LogicRule, LogicCondition, LogicAction } from "@forms/contracts";

export interface ValidationError {
  type: "duplicate_key" | "logic_cycle" | "referenced_field";
  message: string;
  details?: any;
}

/**
 * Validates that all field keys are unique across the form
 * @param form The form to validate
 * @returns An array of validation errors
 */
export function validateUniqueKeys(form: Form): ValidationError[] {
  const errors: ValidationError[] = [];
  const keyMap = new Map<string, Block[]>();

  // Collect all blocks with their keys
  form.pages.forEach((page) => {
    page.blocks.forEach((block) => {
      const key = block.key || block.id;
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(block);
    });
  });

  // Check for duplicates
  keyMap.forEach((blocks, key) => {
    if (blocks.length > 1) {
      errors.push({
        type: "duplicate_key",
        message: `Duplicate field key "${key}" found in ${blocks.length} fields`,
        details: {
          key,
          blockIds: blocks.map((b) => b.id),
          questions: blocks.map((b) => b.question || b.title),
        },
      });
    }
  });

  return errors;
}

/**
 * Generates a unique key by appending a number suffix
 * @param baseKey The base key to make unique
 * @param existingKeys Set of existing keys
 * @returns A unique key
 */
export function generateUniqueKey(baseKey: string, existingKeys: Set<string>): string {
  if (!existingKeys.has(baseKey)) {
    return baseKey;
  }

  let counter = 2;
  let newKey = `${baseKey}-${counter}`;

  while (existingKeys.has(newKey)) {
    counter++;
    newKey = `${baseKey}-${counter}`;
  }

  return newKey;
}

/**
 * Detects cycles in logic rules using DFS
 * @param form The form to validate
 * @returns An array of validation errors for any cycles found
 */
export function detectLogicCycles(form: Form): ValidationError[] {
  const errors: ValidationError[] = [];

  // Handle both old and new logic format
  const rules = form.logic ? (Array.isArray(form.logic) ? form.logic : form.logic.rules || []) : [];

  if (rules.length === 0) {
    return errors;
  }

  // Build adjacency list for the logic graph
  const graph = new Map<string, Set<string>>();

  rules.forEach((rule: LogicRule) => {
    // For each condition field, add edges to all action targets
    rule.conditions.forEach((condition: LogicCondition) => {
      if (!graph.has(condition.field)) {
        graph.set(condition.field, new Set());
      }

      rule.actions.forEach((action: LogicAction) => {
        if (action.type === "jump" || action.type === "skip") {
          graph.get(condition.field)!.add(action.target!);
        }
      });
    });
  });

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycleNodes: string[] = [];

  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || new Set();

    for (const neighbor of Array.from(neighbors)) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        const cycle = [...path.slice(cycleStart), neighbor];

        errors.push({
          type: "logic_cycle",
          message: `Logic cycle detected: ${cycle.join(" → ")}`,
          details: {
            cycle,
            rules: findRulesInCycle(rules, cycle),
          },
        });

        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // Check each unvisited node
  for (const node of Array.from(graph.keys())) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return errors;
}

/**
 * Finds which rules are involved in a cycle
 */
function findRulesInCycle(rules: LogicRule[], cycle: string[]): LogicRule[] {
  const cycleSet = new Set(cycle);

  return rules.filter((rule) => {
    const hasConditionInCycle = rule.conditions.some((c: LogicCondition) => cycleSet.has(c.field));
    const hasActionInCycle = rule.actions.some(
      (a: LogicAction) =>
        (a.type === "jump" || a.type === "skip") && a.target && cycleSet.has(a.target)
    );

    return hasConditionInCycle && hasActionInCycle;
  });
}

/**
 * Checks if a field is referenced in any logic rules
 * @param fieldId The field ID to check
 * @param form The form containing the logic rules
 * @returns Details about where the field is referenced
 */
export function getFieldReferences(
  fieldId: string,
  form: Form
): {
  isReferenced: boolean;
  rules: LogicRule[];
  referenceTypes: ("condition" | "action")[];
} {
  // Handle both old and new logic format
  const rules = form.logic ? (Array.isArray(form.logic) ? form.logic : form.logic.rules || []) : [];

  if (rules.length === 0) {
    return { isReferenced: false, rules: [], referenceTypes: [] };
  }

  const referencedRules: LogicRule[] = [];
  const referenceTypes = new Set<"condition" | "action">();

  rules.forEach((rule) => {
    let isReferencedInRule = false;

    // Check conditions
    if (rule.conditions.some((c: any) => c.field === fieldId)) {
      isReferencedInRule = true;
      referenceTypes.add("condition");
    }

    // Check actions
    if (rule.actions.some((a: any) => a.target === fieldId)) {
      isReferencedInRule = true;
      referenceTypes.add("action");
    }

    if (isReferencedInRule) {
      referencedRules.push(rule);
    }
  });

  return {
    isReferenced: referencedRules.length > 0,
    rules: referencedRules,
    referenceTypes: Array.from(referenceTypes),
  };
}

/**
 * Validates the entire form for all validation rules
 * @param form The form to validate
 * @returns All validation errors found
 */
export function validateForm(form: Form): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for duplicate keys
  errors.push(...validateUniqueKeys(form));

  // Check for logic cycles
  errors.push(...detectLogicCycles(form));

  return errors;
}

/**
 * Removes references to a field from all logic rules
 * @param fieldId The field ID to remove references for
 * @param form The form to update
 * @returns A new form with references removed
 */
export function removeFieldReferences(fieldId: string, form: Form): Form {
  // Handle both old and new logic format
  const rules = form.logic ? (Array.isArray(form.logic) ? form.logic : form.logic.rules || []) : [];

  if (rules.length === 0) {
    return form;
  }

  const updatedLogic = rules
    .map((rule) => {
      // Filter out conditions that reference the field
      const filteredConditions = rule.conditions.filter((c: LogicCondition) => c.field !== fieldId);

      // Filter out actions that target the field
      const filteredActions = rule.actions.filter((a: LogicAction) => a.target !== fieldId);

      // Only keep the rule if it still has conditions and actions
      if (filteredConditions.length > 0 && filteredActions.length > 0) {
        return {
          ...rule,
          conditions: filteredConditions,
          actions: filteredActions,
        };
      }

      return null;
    })
    .filter((rule): rule is LogicRule => rule !== null);

  // Return in the proper format
  const newLogic = Array.isArray(form.logic)
    ? { rules: updatedLogic }
    : { ...form.logic, rules: updatedLogic };

  return {
    ...form,
    logic: newLogic as any,
  };
}
