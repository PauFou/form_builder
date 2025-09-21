import { describe, it, expect } from "@jest/globals";
import type { Form, LogicRule } from "@skemya/contracts";
import {
  validateUniqueKeys,
  generateUniqueKey,
  detectLogicCycles,
  getFieldReferences,
  validateForm,
  removeFieldReferences,
} from "../form-validators";

describe("Form Validators", () => {
  describe("validateUniqueKeys", () => {
    it("should return no errors for unique keys", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [
          {
            id: "page1",
            blocks: [
              { id: "field1", type: "text", title: "Name", question: "Name", key: "name" },
              { id: "field2", type: "email", title: "Email", question: "Email", key: "email" },
            ],
          },
        ],
      };

      const errors = validateUniqueKeys(form as unknown as Form);
      expect(errors).toHaveLength(0);
    });

    it("should detect duplicate keys", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [
          {
            id: "page1",
            blocks: [
              { id: "field1", type: "text", title: "Name", question: "Name", key: "email" },
              { id: "field2", type: "email", title: "Email", question: "Email", key: "email" },
            ],
          },
        ],
      };

      const errors = validateUniqueKeys(form as unknown as Form);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("duplicate_key");
      expect(errors[0].message).toContain("email");
      expect(errors[0].details.blockIds).toEqual(["field1", "field2"]);
    });

    it("should use block ID as key when key is not provided", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [
          {
            id: "page1",
            blocks: [
              { id: "field1", type: "text", title: "Name", question: "Name" },
              { id: "field1", type: "email", title: "Email", question: "Email" }, // Same ID
            ],
          },
        ],
      };

      const errors = validateUniqueKeys(form as unknown as Form);
      expect(errors).toHaveLength(1);
      expect(errors[0].details.key).toBe("field1");
    });
  });

  describe("generateUniqueKey", () => {
    it("should return the base key if it's unique", () => {
      const existingKeys = new Set(["name", "phone"]);
      const result = generateUniqueKey("email", existingKeys);
      expect(result).toBe("email");
    });

    it("should append -2 for the first duplicate", () => {
      const existingKeys = new Set(["email", "name"]);
      const result = generateUniqueKey("email", existingKeys);
      expect(result).toBe("email-2");
    });

    it("should increment the suffix for multiple duplicates", () => {
      const existingKeys = new Set(["email", "email-2", "email-3"]);
      const result = generateUniqueKey("email", existingKeys);
      expect(result).toBe("email-4");
    });
  });

  describe("detectLogicCycles", () => {
    it("should return no errors when there are no cycles", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field2" }],
          },
          {
            id: "rule2",
            conditions: [{ field: "field2", operator: "equals", value: "no" }],
            actions: [{ type: "jump", target: "field3" }],
          },
        ],
      };

      const errors = detectLogicCycles(form as unknown as Form);
      expect(errors).toHaveLength(0);
    });

    it("should detect a simple cycle", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field2" }],
          },
          {
            id: "rule2",
            conditions: [{ field: "field2", operator: "equals", value: "no" }],
            actions: [{ type: "jump", target: "field1" }],
          },
        ],
      };

      const errors = detectLogicCycles(form as unknown as Form);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("logic_cycle");
      expect(errors[0].message).toContain("field1 → field2 → field1");
    });

    it("should detect a complex cycle", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "A", operator: "equals", value: "1" }],
            actions: [{ type: "jump", target: "B" }],
          },
          {
            id: "rule2",
            conditions: [{ field: "B", operator: "equals", value: "2" }],
            actions: [{ type: "jump", target: "C" }],
          },
          {
            id: "rule3",
            conditions: [{ field: "C", operator: "equals", value: "3" }],
            actions: [{ type: "jump", target: "D" }],
          },
          {
            id: "rule4",
            conditions: [{ field: "D", operator: "equals", value: "4" }],
            actions: [{ type: "jump", target: "B" }],
          },
        ],
      };

      const errors = detectLogicCycles(form as unknown as Form);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("B → C → D → B");
    });

    it("should handle forms with no logic", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
      };

      const errors = detectLogicCycles(form as unknown as Form);
      expect(errors).toHaveLength(0);
    });
  });

  describe("getFieldReferences", () => {
    it("should find references in conditions", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field2" }],
          },
        ],
      };

      const result = getFieldReferences("field1", form as unknown as Form);
      expect(result.isReferenced).toBe(true);
      expect(result.rules).toHaveLength(1);
      expect(result.referenceTypes).toContain("condition");
    });

    it("should find references in actions", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field2" }],
          },
        ],
      };

      const result = getFieldReferences("field2", form as unknown as Form);
      expect(result.isReferenced).toBe(true);
      expect(result.rules).toHaveLength(1);
      expect(result.referenceTypes).toContain("action");
    });

    it("should find multiple references", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field1" }],
          },
          {
            id: "rule2",
            conditions: [{ field: "field2", operator: "equals", value: "no" }],
            actions: [{ type: "jump", target: "field1" }],
          },
        ],
      };

      const result = getFieldReferences("field1", form as unknown as Form);
      expect(result.isReferenced).toBe(true);
      expect(result.rules).toHaveLength(2);
      expect(result.referenceTypes).toContain("condition");
      expect(result.referenceTypes).toContain("action");
    });

    it("should return false for unreferenced fields", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field2" }],
          },
        ],
      };

      const result = getFieldReferences("field3", form as unknown as Form);
      expect(result.isReferenced).toBe(false);
      expect(result.rules).toHaveLength(0);
    });
  });

  describe("removeFieldReferences", () => {
    it("should remove field from conditions", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [
              { field: "field1", operator: "equals", value: "yes" },
              { field: "field2", operator: "equals", value: "no" },
            ],
            actions: [{ type: "jump", target: "field3" }],
          },
        ],
      };

      const updated = removeFieldReferences("field1", form as unknown as Form);
      expect(updated.logic?.rules).toHaveLength(1);
      expect(updated.logic?.rules[0].conditions).toHaveLength(1);
      expect(updated.logic?.rules[0].conditions[0].field).toBe("field2");
    });

    it("should remove field from actions", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [
              { type: "jump", target: "field2" },
              { type: "jump", target: "field3" },
            ],
          },
        ],
      };

      const updated = removeFieldReferences("field2", form as unknown as Form);
      expect(updated.logic?.rules).toHaveLength(1);
      expect(updated.logic?.rules[0].actions).toHaveLength(1);
      expect(updated.logic?.rules[0].actions[0].target).toBe("field3");
    });

    it("should remove entire rule if no conditions or actions remain", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field2" }],
          },
          {
            id: "rule2",
            conditions: [{ field: "field2", operator: "equals", value: "no" }],
            actions: [{ type: "jump", target: "field3" }],
          },
        ],
      };

      const updated = removeFieldReferences("field1", form as unknown as Form);
      expect(updated.logic?.rules).toHaveLength(1);
      expect(updated.logic?.rules[0].id).toBe("rule2");
    });
  });

  describe("validateForm", () => {
    it("should combine all validation errors", () => {
      const form = {
        id: "form1",
        version: 1,
        title: "Test Form",
        pages: [
          {
            id: "page1",
            blocks: [
              { id: "field1", type: "text", title: "Name", question: "Name", key: "email" },
              { id: "field2", type: "email", title: "Email", question: "Email", key: "email" },
            ],
          },
        ],
        logic: [
          {
            id: "rule1",
            conditions: [{ field: "field1", operator: "equals", value: "yes" }],
            actions: [{ type: "jump", target: "field2" }],
          },
          {
            id: "rule2",
            conditions: [{ field: "field2", operator: "equals", value: "no" }],
            actions: [{ type: "jump", target: "field1" }],
          },
        ],
      };

      const errors = validateForm(form as unknown as Form);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === "duplicate_key")).toBe(true);
      expect(errors.some((e) => e.type === "logic_cycle")).toBe(true);
    });
  });
});
