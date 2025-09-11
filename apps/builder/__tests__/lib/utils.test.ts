import { cn, formatDate, formatCurrency, truncate, debounce } from "../../lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("should combine class names", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", false && "conditional", "final")).toBe("base final");
    });

    it("should handle undefined values", () => {
      expect(cn("class1", undefined, "class2")).toBe("class1 class2");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
    });
  });

  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      expect(formatDate(date)).toMatch(/Jan 15, 2024/);
    });

    it("should handle date strings", () => {
      expect(formatDate("2024-01-15")).toMatch(/Jan 15, 2024/);
    });

    it("should return empty string for invalid dates", () => {
      expect(formatDate("invalid")).toBe("");
    });
  });

  describe("formatCurrency", () => {
    it("should format USD currency", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("should format EUR currency", () => {
      expect(formatCurrency(1234.56, "EUR")).toMatch(/€1,234.56/);
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should handle negative values", () => {
      expect(formatCurrency(-100)).toBe("-$100.00");
    });
  });

  describe("truncate", () => {
    it("should not truncate short strings", () => {
      expect(truncate("Short text", 20)).toBe("Short text");
    });

    it("should truncate long strings", () => {
      expect(truncate("This is a very long text that needs truncation", 20)).toBe(
        "This is a very long..."
      );
    });

    it("should handle custom ellipsis", () => {
      expect(truncate("Long text here", 10, "…")).toBe("Long text…");
    });
  });

  describe("debounce", () => {
    jest.useFakeTimers();

    it("should debounce function calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to debounced function", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn("arg1", "arg2");
      jest.runAllTimers();

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });
  });
});
