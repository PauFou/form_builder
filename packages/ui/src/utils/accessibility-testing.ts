/**
 * Accessibility testing utilities using axe-core
 * Provides automated a11y testing for components and pages
 */

import type { AxeResults, Result as AxeResult } from "axe-core";

export interface AccessibilityTestOptions {
  /**
   * axe-core rules to include in the test
   */
  rules?: Record<string, { enabled: boolean }>;
  /**
   * Elements to exclude from testing
   */
  exclude?: string[];
  /**
   * Tags to include (wcag2a, wcag2aa, wcag21aa, etc.)
   */
  tags?: string[];
  /**
   * Whether to test color contrast
   */
  testContrast?: boolean;
}

export interface AccessibilityTestResult {
  violations: AxeResult[];
  passes: AxeResult[];
  incomplete: AxeResult[];
  inaccessible: AxeResult[];
  violationCount: number;
  passCount: number;
  score: number; // 0-100, percentage of rules passed
  wcagLevel: "AA" | "A" | "fail";
}

/**
 * Default configuration for SKEMYA compliance testing
 * Focuses on WCAG 2.1 AA compliance
 */
export const SKEMYA_A11Y_CONFIG: AccessibilityTestOptions = {
  tags: ["wcag2a", "wcag2aa", "wcag21aa"],
  testContrast: true,
  rules: {
    // Critical rules for form accessibility
    label: { enabled: true },
    "button-name": { enabled: true },
    "link-name": { enabled: true },
    "form-field-multiple-labels": { enabled: true },
    "aria-required-attr": { enabled: true },
    "aria-valid-attr": { enabled: true },
    "aria-valid-attr-value": { enabled: true },
    "color-contrast": { enabled: false }, // Disable for now due to JSDOM limitations
    "focus-order-semantics": { enabled: true },
    "landmark-one-main": { enabled: false }, // Not applicable to individual components
    "page-has-heading-one": { enabled: false }, // Not applicable to individual components
    region: { enabled: false }, // Not applicable to individual components
    "skip-link": { enabled: false }, // Not applicable to individual components
  },
};

/**
 * Runs accessibility tests on a DOM element or document
 */
export async function runAccessibilityTest(
  element: Element | Document = document,
  options: AccessibilityTestOptions = SKEMYA_A11Y_CONFIG
): Promise<AccessibilityTestResult> {
  // Dynamic import to avoid SSR issues
  const axe = await import("axe-core");

  const config = {
    tags: options.tags || ["wcag2a", "wcag2aa"],
    rules: options.rules || {},
    exclude: options.exclude || [],
  };

  try {
    const results: AxeResults = await axe.run(element, config);

    const violationCount = results.violations.length;
    const passCount = results.passes.length;
    const totalRules = violationCount + passCount;
    const score = totalRules > 0 ? Math.round((passCount / totalRules) * 100) : 0;

    // Determine WCAG compliance level
    let wcagLevel: "AA" | "A" | "fail" = "fail";
    if (violationCount === 0) {
      wcagLevel = "AA"; // No violations = AA compliance
    } else {
      // Check if only A-level violations exist
      const hasAAViolations = results.violations.some(
        (v) => v.tags.includes("wcag2aa") || v.tags.includes("wcag21aa")
      );
      if (!hasAAViolations) {
        wcagLevel = "A";
      }
    }

    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inaccessible: results.incomplete,
      violationCount,
      passCount,
      score,
      wcagLevel,
    };
  } catch (error) {
    console.error("Accessibility test failed:", error);
    throw new Error(`Accessibility test failed: ${error}`);
  }
}

/**
 * Formats accessibility test results for console output
 */
export function formatAccessibilityResults(results: AccessibilityTestResult): string {
  const { violations, score, wcagLevel, violationCount, passCount } = results;

  let output = `\n🔍 Accessibility Test Results\n`;
  output += `Score: ${score}% (${passCount} passed, ${violationCount} failed)\n`;
  output += `WCAG Level: ${wcagLevel}\n\n`;

  if (violations.length > 0) {
    output += `❌ Violations (${violations.length}):\n`;
    violations.forEach((violation, index) => {
      output += `\n${index + 1}. ${violation.help}\n`;
      output += `   Impact: ${violation.impact}\n`;
      output += `   Tags: ${violation.tags.join(", ")}\n`;
      output += `   Elements: ${violation.nodes.length}\n`;

      if (violation.nodes.length > 0) {
        output += `   First element: ${violation.nodes[0].target.join(" ")}\n`;
        if (violation.nodes[0].failureSummary) {
          output += `   Issue: ${violation.nodes[0].failureSummary}\n`;
        }
      }
    });
  }

  return output;
}

/**
 * Creates an accessibility testing utility for React Testing Library
 */
export function createA11yTester(options: AccessibilityTestOptions = SKEMYA_A11Y_CONFIG) {
  return async (container: Element): Promise<AccessibilityTestResult> => {
    const results = await runAccessibilityTest(container, options);

    if (results.violationCount > 0) {
      console.warn(formatAccessibilityResults(results));
    }

    return results;
  };
}

/**
 * Jest matcher for accessibility testing
 */
export function toBeAccessible(
  received: Element,
  options: AccessibilityTestOptions = SKEMYA_A11Y_CONFIG
) {
  return runAccessibilityTest(received, options).then((results) => {
    const pass = results.violationCount === 0;

    if (pass) {
      return {
        message: () => `Expected element to have accessibility violations, but none were found`,
        pass: true,
      };
    } else {
      return {
        message: () => formatAccessibilityResults(results),
        pass: false,
      };
    }
  });
}

/**
 * Accessibility audit for Storybook addon
 */
export async function auditStoryAccessibility(
  storyElement: Element,
  storyName: string
): Promise<{ storyName: string; results: AccessibilityTestResult }> {
  const results = await runAccessibilityTest(storyElement, SKEMYA_A11Y_CONFIG);

  return {
    storyName,
    results,
  };
}

/**
 * Batch accessibility testing for multiple elements
 */
export async function batchAccessibilityTest(
  elements: { name: string; element: Element }[],
  options: AccessibilityTestOptions = SKEMYA_A11Y_CONFIG
): Promise<{ name: string; results: AccessibilityTestResult }[]> {
  const results = await Promise.all(
    elements.map(async ({ name, element }) => ({
      name,
      results: await runAccessibilityTest(element, options),
    }))
  );

  return results;
}

/**
 * Accessibility coverage calculator
 * Measures what percentage of components have a11y testing
 */
export interface AccessibilityCoverage {
  totalComponents: number;
  testedComponents: number;
  coverage: number; // 0-100
  untested: string[];
}

export function calculateAccessibilityCoverage(
  componentResults: { name: string; tested: boolean }[]
): AccessibilityCoverage {
  const totalComponents = componentResults.length;
  const testedComponents = componentResults.filter((c) => c.tested).length;
  const coverage = totalComponents > 0 ? Math.round((testedComponents / totalComponents) * 100) : 0;
  const untested = componentResults.filter((c) => !c.tested).map((c) => c.name);

  return {
    totalComponents,
    testedComponents,
    coverage,
    untested,
  };
}

// Export default test configuration
export { SKEMYA_A11Y_CONFIG as default };
