import { validateEmail, validateRequired, validateBlockData } from "../validators";

describe("validators", () => {
  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("test+tag@example.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("@domain.com")).toBe(false);
      expect(validateEmail("test.domain.com")).toBe(false);
    });

    it("should handle non-string values", () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail(123 as any)).toBe(false);
    });
  });

  describe("validateRequired", () => {
    it("should validate required values", () => {
      expect(validateRequired("test")).toBe(true);
      expect(validateRequired(["item"])).toBe(true);
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(false)).toBe(true);
    });

    it("should reject empty values", () => {
      expect(validateRequired("")).toBe(false);
      expect(validateRequired("   ")).toBe(false);
      expect(validateRequired([])).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe("validateBlockData", () => {
    it("should validate required fields", () => {
      const block = {
        id: "1",
        type: "short_text" as const,
        question: "Test",
        required: true,
      };

      expect(validateBlockData(block, "valid value")).toEqual({ valid: true });
      expect(validateBlockData(block, "")).toEqual({
        valid: false,
        error: "This field is required",
      });
    });

    it("should validate email fields", () => {
      const block = {
        id: "1",
        type: "email" as const,
        question: "Email",
        required: true,
      };

      expect(validateBlockData(block, "test@example.com")).toEqual({ valid: true });
      expect(validateBlockData(block, "invalid-email")).toEqual({
        valid: false,
        error: "Please enter a valid email address",
      });
    });

    it("should validate select fields", () => {
      const block = {
        id: "1",
        type: "select" as const,
        question: "Select",
        required: true,
        options: [
          { id: "opt1", value: "option1", label: "Option 1" },
          { id: "opt2", value: "option2", label: "Option 2" },
        ],
      };

      expect(validateBlockData(block, "option1")).toEqual({ valid: true });
      expect(validateBlockData(block, "invalid-option")).toEqual({
        valid: false,
        error: "Invalid selection",
      });
    });

    it("should validate text length", () => {
      const block = {
        id: "1",
        type: "short_text" as const,
        question: "Text",
        validation: {
          minLength: 5,
          maxLength: 10,
        },
      };

      expect(validateBlockData(block, "hello")).toEqual({ valid: true });
      expect(validateBlockData(block, "hi")).toEqual({
        valid: false,
        error: "Minimum 5 characters required",
      });
      expect(validateBlockData(block, "this is too long")).toEqual({
        valid: false,
        error: "Maximum 10 characters allowed",
      });
    });

    it("should skip validation for optional empty fields", () => {
      const block = {
        id: "1",
        type: "email" as const,
        question: "Email",
        required: false,
      };

      expect(validateBlockData(block, "")).toEqual({ valid: true });
    });
  });
});
