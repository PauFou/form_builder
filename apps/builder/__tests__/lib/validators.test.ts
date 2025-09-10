import { describe, it, expect } from "@jest/globals";
import { validateEmail, validateRequired, validateBlockData } from "../../lib/validators";

describe("validators", () => {
  describe("validateEmail", () => {
    it("should validate correct email formats", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("test.user+tag@domain.co.uk")).toBe(true);
      expect(validateEmail("123@456.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user@.com")).toBe(false);
      expect(validateEmail("user space@example.com")).toBe(false);
    });

    it("should handle empty values", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });
  });

  describe("validateRequired", () => {
    it("should validate non-empty values", () => {
      expect(validateRequired("text")).toBe(true);
      expect(validateRequired("0")).toBe(true);
      expect(validateRequired(["option1"])).toBe(true);
      expect(validateRequired({ value: "data" })).toBe(true);
    });

    it("should reject empty values", () => {
      expect(validateRequired("")).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired([])).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(validateRequired("   ")).toBe(false);
      expect(validateRequired("\t\n")).toBe(false);
      expect(validateRequired(" text ")).toBe(true);
    });
  });

  describe("validateBlockData", () => {
    it("should validate short_text block", () => {
      const block = {
        id: "1",
        type: "short_text" as const,
        question: "Name?",
        required: true,
      };

      expect(validateBlockData(block, "John")).toEqual({ valid: true });
      expect(validateBlockData(block, "")).toEqual({
        valid: false,
        error: "This field is required",
      });
      expect(validateBlockData(block, "   ")).toEqual({
        valid: false,
        error: "This field is required",
      });
    });

    it("should validate email block", () => {
      const block = {
        id: "1",
        type: "email" as const,
        question: "Email?",
        required: true,
      };

      expect(validateBlockData(block, "user@example.com")).toEqual({ valid: true });
      expect(validateBlockData(block, "invalid-email")).toEqual({
        valid: false,
        error: "Please enter a valid email address",
      });
    });

    it("should validate date block", () => {
      const block = {
        id: "1",
        type: "date" as const,
        question: "Date?",
        validation: {
          min: "2024-01-01",
          max: "2024-12-31",
        },
      };

      expect(validateBlockData(block, "2024-06-15")).toEqual({ valid: true });
      expect(validateBlockData(block, "2023-12-31")).toEqual({
        valid: false,
        error: "Date must be after 2024-01-01",
      });
      expect(validateBlockData(block, "2025-01-01")).toEqual({
        valid: false,
        error: "Date must be before 2024-12-31",
      });
    });

    it("should validate select block", () => {
      const block = {
        id: "1",
        type: "select" as const,
        question: "Choose one",
        required: true,
        options: [
          { id: "1", label: "Option 1", value: "opt1" },
          { id: "2", label: "Option 2", value: "opt2" },
        ],
      };

      expect(validateBlockData(block, "opt1")).toEqual({ valid: true });
      expect(validateBlockData(block, "")).toEqual({
        valid: false,
        error: "Please select an option",
      });
      expect(validateBlockData(block, "invalid")).toEqual({
        valid: false,
        error: "Invalid selection",
      });
    });

    it("should validate checkbox_group block", () => {
      const block = {
        id: "1",
        type: "checkbox_group" as const,
        question: "Choose multiple",
        required: true,
        options: [
          { id: "1", label: "Option 1", value: "opt1" },
          { id: "2", label: "Option 2", value: "opt2" },
        ],
        validation: {
          min: 1,
          max: 2,
        },
      };

      expect(validateBlockData(block, ["opt1"])).toEqual({ valid: true });
      expect(validateBlockData(block, ["opt1", "opt2"])).toEqual({ valid: true });
      expect(validateBlockData(block, [])).toEqual({
        valid: false,
        error: "Please select at least one option",
      });
      expect(validateBlockData(block, ["opt1", "opt2", "opt3"])).toEqual({
        valid: false,
        error: "Please select at most 2 options",
      });
    });
  });
});
