import { LogicEvaluator } from "../logic/evaluator";
import type { LogicRule, LogicAction, FormData } from "../types";

describe("LogicEvaluator", () => {
  let evaluator: LogicEvaluator;
  const initialData: FormData = {
    formId: "test-form",
    values: {
      country: "US",
      age: 25,
      email: "test@example.com",
      message: "I need help with my order",
    },
    startedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    evaluator = new LogicEvaluator(initialData);
  });

  describe("Condition Evaluation", () => {
    it("should evaluate equals condition correctly", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "country",
              operator: "equals",
              value: "US",
            },
          ],
          actions: [
            {
              type: "show",
              target: "state",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("show");
      expect(actions[0].target).toBe("state");
    });

    it("should evaluate not_equals condition correctly", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "country",
              operator: "not_equals",
              value: "CA",
            },
          ],
          actions: [
            {
              type: "hide",
              target: "province",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("hide");
    });

    it("should evaluate contains condition correctly", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "message",
              operator: "contains",
              value: "help",
            },
          ],
          actions: [
            {
              type: "jump",
              target: "support-section",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("jump");
    });

    it("should evaluate not_contains condition correctly", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "email",
              operator: "not_contains",
              value: "@company.com",
            },
          ],
          actions: [
            {
              type: "show",
              target: "personal-questions",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("show");
    });

    it("should evaluate greater_than condition correctly", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "age",
              operator: "greater_than",
              value: 18,
            },
          ],
          actions: [
            {
              type: "show",
              target: "adult-content",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("show");
    });

    it("should evaluate less_than condition correctly", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "age",
              operator: "less_than",
              value: 65,
            },
          ],
          actions: [
            {
              type: "hide",
              target: "senior-discount",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe("hide");
    });

    it("should handle multiple conditions with AND logic", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "country",
              operator: "equals",
              value: "US",
            },
            {
              field: "age",
              operator: "greater_than",
              value: 21,
            },
          ],
          actions: [
            {
              type: "show",
              target: "alcohol-questions",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].target).toBe("alcohol-questions");

      // Test with one condition failing
      evaluator.updateFormData({ values: { ...initialData.values, age: 20 } });
      const noActions = evaluator.evaluateRules(rules);
      expect(noActions).toHaveLength(0);
    });
  });

  describe("Action Application", () => {
    it("should apply show/hide actions correctly", () => {
      const actions: LogicAction[] = [
        {
          type: "show",
          target: "field1",
        },
        {
          type: "hide",
          target: "field2",
        },
      ];

      const result = evaluator.applyActions(actions);
      expect(result.hiddenFields).toContain("field2");
      expect(result.hiddenFields).not.toContain("field1");
      expect(evaluator.isFieldVisible("field1")).toBe(true);
      expect(evaluator.isFieldVisible("field2")).toBe(false);
    });

    it("should apply set_value actions correctly", () => {
      const actions: LogicAction[] = [
        {
          type: "set_value",
          target: "discount",
          value: "10%",
        },
      ];

      const result = evaluator.applyActions(actions);
      expect(result.fieldUpdates.discount).toBe("10%");
    });

    it("should apply navigation actions correctly", () => {
      const skipAction: LogicAction[] = [
        {
          type: "skip",
          target: "optional-section",
        },
      ];

      const skipResult = evaluator.applyActions(skipAction);
      expect(skipResult.navigation).toEqual({
        type: "skip",
        target: "optional-section",
      });

      const jumpAction: LogicAction[] = [
        {
          type: "jump",
          target: "end-section",
        },
      ];

      const jumpResult = evaluator.applyActions(jumpAction);
      expect(jumpResult.navigation).toEqual({
        type: "jump",
        target: "end-section",
      });
    });

    it("should handle multiple actions of same type", () => {
      const actions: LogicAction[] = [
        {
          type: "hide",
          target: "field1",
        },
        {
          type: "hide",
          target: "field2",
        },
        {
          type: "show",
          target: "field3",
        },
        {
          type: "hide",
          target: "field3", // This should override the show
        },
      ];

      const result = evaluator.applyActions(actions);
      expect(result.hiddenFields).toContain("field1");
      expect(result.hiddenFields).toContain("field2");
      expect(result.hiddenFields).toContain("field3");
    });
  });

  describe("Field Value Updates", () => {
    it("should update form data correctly", () => {
      evaluator.updateFormData({
        values: {
          ...initialData.values,
          country: "CA",
          newField: "newValue",
        },
      });

      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "country",
              operator: "equals",
              value: "CA",
            },
          ],
          actions: [
            {
              type: "show",
              target: "province",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].target).toBe("province");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty rules array", () => {
      const actions = evaluator.evaluateRules([]);
      expect(actions).toHaveLength(0);
    });

    it("should handle rules with empty conditions", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [],
          actions: [
            {
              type: "show",
              target: "field",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(0); // No conditions means rule doesn't apply
    });

    it("should handle missing field values", () => {
      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "nonexistent",
              operator: "equals",
              value: "test",
            },
          ],
          actions: [
            {
              type: "show",
              target: "field",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(0);
    });

    it("should handle null and undefined values correctly", () => {
      evaluator.updateFormData({
        values: {
          nullField: null,
          undefinedField: undefined,
          emptyField: "",
        },
      });

      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "emptyField",
              operator: "equals",
              value: "",
            },
          ],
          actions: [
            {
              type: "show",
              target: "empty-handler",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
    });

    it("should handle array values in multi-select fields", () => {
      evaluator.updateFormData({
        values: {
          interests: ["coding", "design", "music"],
        },
      });

      const rules: LogicRule[] = [
        {
          id: "rule-1",
          conditions: [
            {
              field: "interests",
              operator: "contains",
              value: "coding",
            },
          ],
          actions: [
            {
              type: "show",
              target: "coding-questions",
            },
          ],
        },
      ];

      const actions = evaluator.evaluateRules(rules);
      expect(actions).toHaveLength(1);
      expect(actions[0].target).toBe("coding-questions");
    });
  });

  describe("Reset Functionality", () => {
    it("should reset evaluator state", () => {
      const actions: LogicAction[] = [
        {
          type: "hide",
          target: "field1",
        },
        {
          type: "set_value",
          target: "field2",
          value: "test",
        },
      ];

      evaluator.applyActions(actions);
      expect(evaluator.getHiddenFields()).toHaveLength(1);

      evaluator.reset();
      expect(evaluator.getHiddenFields()).toHaveLength(0);
    });
  });
});
