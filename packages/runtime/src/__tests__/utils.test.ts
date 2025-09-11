import { validateField, formatValue, shouldShowBlock } from "../utils";
import type { Block } from "../types";

describe("validateField", () => {
  it("should validate required fields", () => {
    const block: Block = {
      id: "name",
      type: "text",
      question: "Name",
      required: true,
    };

    expect(validateField(block, "")).toBe("Name is required");
    expect(validateField(block, null)).toBe("Name is required");
    expect(validateField(block, "John")).toBeNull();
  });

  it("should validate email format", () => {
    const block: Block = {
      id: "email",
      type: "email",
      question: "Email",
    };

    expect(validateField(block, "invalid")).toBe("Please enter a valid email address");
    expect(validateField(block, "test@example.com")).toBeNull();
  });

  it("should validate number fields", () => {
    const block: Block = {
      id: "age",
      type: "number",
      question: "Age",
    };

    expect(validateField(block, "abc")).toBe("Please enter a valid number");
    expect(validateField(block, "25")).toBeNull();
  });

  it("should apply custom validation rules", () => {
    const block: Block = {
      id: "password",
      type: "text",
      question: "Password",
      validation: [
        {
          type: "min",
          value: 8,
          message: "Password must be at least 8 characters",
        },
      ],
    };

    expect(validateField(block, "short")).toBe("Password must be at least 8 characters");
    expect(validateField(block, "longpassword")).toBeNull();
  });
});

describe("shouldShowBlock", () => {
  it("should always return true for blocks", () => {
    const block: Block = {
      id: "test",
      type: "text",
      question: "Test",
    };

    expect(shouldShowBlock(block, {})).toBe(true);
    expect(shouldShowBlock(block, { test: "value" })).toBe(true);
  });
});

describe("formatValue", () => {
  it("should format currency", () => {
    expect(formatValue(1234.56, "currency")).toBe("$1,234.56");
  });

  it("should format date", () => {
    const date = "2024-01-15";
    const formatted = formatValue(date, "date");
    // Date format depends on locale, just check it's a valid date format
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it("should format multi-select values", () => {
    expect(formatValue(["Option 1", "Option 2"], "multi_select")).toBe("Option 1, Option 2");
  });
});
