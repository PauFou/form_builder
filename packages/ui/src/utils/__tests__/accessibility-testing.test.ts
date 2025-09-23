/**
 * Tests for accessibility testing utilities
 */

import {
  runAccessibilityTest,
  formatAccessibilityResults,
  calculateAccessibilityCoverage,
  SKEMYA_A11Y_CONFIG,
} from "../accessibility-testing";

// Mock axe-core
const mockRun = jest.fn();
jest.mock("axe-core", () => ({
  run: mockRun,
}));

describe("Accessibility Testing Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("runAccessibilityTest", () => {
    it("should return results with no violations for accessible content", async () => {
      const mockResults = {
        violations: [],
        passes: [
          { id: "label", tags: ["wcag2a"], help: "Form elements have labels" },
          {
            id: "color-contrast",
            tags: ["wcag2aa"],
            help: "Elements have sufficient color contrast",
          },
        ],
        incomplete: [],
        inaccessible: [],
      };

      mockRun.mockResolvedValue(mockResults);

      const element = document.createElement("div");
      const results = await runAccessibilityTest(element);

      expect(results.violationCount).toBe(0);
      expect(results.passCount).toBe(2);
      expect(results.score).toBe(100);
      expect(results.wcagLevel).toBe("AA");
    });

    it("should return results with violations for inaccessible content", async () => {
      const mockResults = {
        violations: [
          {
            id: "label",
            impact: "critical" as const,
            tags: ["wcag2a"],
            help: "Form elements must have labels",
            description: "Form elements must have labels",
            helpUrl: "https://dequeuniversity.com/rules/axe/4.7/label",
            nodes: [
              {
                target: ['input[type="text"]'],
                failureSummary: "This input element does not have a name",
                html: '<input type="text">',
                any: [],
                all: [],
                none: [],
              },
            ],
          },
        ],
        passes: [
          {
            id: "color-contrast",
            tags: ["wcag2aa"],
            help: "Elements have sufficient color contrast",
          },
        ],
        incomplete: [],
        inaccessible: [],
      };

      mockRun.mockResolvedValue(mockResults);

      const element = document.createElement("div");
      const results = await runAccessibilityTest(element);

      expect(results.violationCount).toBe(1);
      expect(results.passCount).toBe(1);
      expect(results.score).toBe(50);
      expect(results.wcagLevel).toBe("A"); // Since only wcag2a violation
    });

    it("should handle axe-core errors gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockRun.mockRejectedValue(new Error("Axe test failed"));

      const element = document.createElement("div");

      await expect(runAccessibilityTest(element)).rejects.toThrow(
        "Accessibility test failed: Error: Axe test failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith("Accessibility test failed:", expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe("formatAccessibilityResults", () => {
    it("should format results with no violations", () => {
      const results = {
        violations: [],
        passes: [],
        incomplete: [],
        inaccessible: [],
        violationCount: 0,
        passCount: 5,
        score: 100,
        wcagLevel: "AA" as const,
      };

      const formatted = formatAccessibilityResults(results);

      expect(formatted).toContain("Score: 100%");
      expect(formatted).toContain("WCAG Level: AA");
      expect(formatted).not.toContain("Violations");
    });

    it("should format results with violations", () => {
      const results = {
        violations: [
          {
            id: "label",
            impact: "critical" as const,
            tags: ["wcag2a"],
            help: "Form elements must have labels",
            description: "Form elements must have labels",
            helpUrl: "https://dequeuniversity.com/rules/axe/4.7/label",
            nodes: [
              {
                target: ['input[type="text"]'],
                failureSummary: "This input element does not have a name",
                html: '<input type="text">',
                any: [],
                all: [],
                none: [],
              },
            ],
          },
        ],
        passes: [],
        incomplete: [],
        inaccessible: [],
        violationCount: 1,
        passCount: 0,
        score: 0,
        wcagLevel: "fail" as const,
      };

      const formatted = formatAccessibilityResults(results);

      expect(formatted).toContain("Score: 0%");
      expect(formatted).toContain("WCAG Level: fail");
      expect(formatted).toContain("❌ Violations (1)");
      expect(formatted).toContain("Form elements must have labels");
      expect(formatted).toContain("Impact: critical");
    });
  });

  describe("calculateAccessibilityCoverage", () => {
    it("should calculate coverage correctly", () => {
      const componentResults = [
        { name: "Button", tested: true },
        { name: "Input", tested: true },
        { name: "Card", tested: false },
        { name: "Badge", tested: true },
        { name: "Select", tested: false },
      ];

      const coverage = calculateAccessibilityCoverage(componentResults);

      expect(coverage.totalComponents).toBe(5);
      expect(coverage.testedComponents).toBe(3);
      expect(coverage.coverage).toBe(60);
      expect(coverage.untested).toEqual(["Card", "Select"]);
    });

    it("should handle empty component list", () => {
      const coverage = calculateAccessibilityCoverage([]);

      expect(coverage.totalComponents).toBe(0);
      expect(coverage.testedComponents).toBe(0);
      expect(coverage.coverage).toBe(0);
      expect(coverage.untested).toEqual([]);
    });
  });

  describe("SKEMYA_A11Y_CONFIG", () => {
    it("should include required WCAG tags", () => {
      expect(SKEMYA_A11Y_CONFIG.tags).toContain("wcag2a");
      expect(SKEMYA_A11Y_CONFIG.tags).toContain("wcag2aa");
      expect(SKEMYA_A11Y_CONFIG.tags).toContain("wcag21aa");
    });

    it("should enable color contrast testing", () => {
      expect(SKEMYA_A11Y_CONFIG.testContrast).toBe(true);
    });

    it("should enable critical accessibility rules", () => {
      const rules = SKEMYA_A11Y_CONFIG.rules;
      expect(rules?.label?.enabled).toBe(true);
      expect(rules?.["button-name"]?.enabled).toBe(true);
      expect(rules?.["color-contrast"]?.enabled).toBe(false); // Disabled for JSDOM
      expect(rules?.["aria-required-attr"]?.enabled).toBe(true);
    });
  });
});
