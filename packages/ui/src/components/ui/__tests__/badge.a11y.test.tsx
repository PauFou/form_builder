/**
 * Accessibility tests for Badge component
 */

import { render } from "@testing-library/react";
import { Badge } from "../badge";
import { runAccessibilityTest, SKEMYA_A11Y_CONFIG } from "../../../utils/accessibility-testing";

describe("Badge Accessibility", () => {
  it("should have no accessibility violations in default state", async () => {
    const { container } = render(<Badge>Default Badge</Badge>);

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
    expect(results.wcagLevel).toBe("AA");
  });

  it("should be accessible as status badge", async () => {
    const { container } = render(
      <Badge variant="success" isStatus={true} ariaLabel="Form submission successful">
        Success
      </Badge>
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should be accessible with different variants", async () => {
    const variants = [
      "default",
      "secondary",
      "destructive",
      "outline",
      "success",
      "warning",
    ] as const;

    for (const variant of variants) {
      const { container } = render(<Badge variant={variant}>{variant} Badge</Badge>);

      const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
      expect(results.violationCount).toBe(0);
    }
  });

  it("should have proper ARIA attributes when used as status", async () => {
    const { container } = render(
      <Badge isStatus={true} ariaLabel="Current status: processing">
        Processing
      </Badge>
    );

    const badge = container.querySelector('[role="status"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label", "Current status: processing");
  });

  it("should not have status attributes when not a status badge", async () => {
    const { container } = render(<Badge>Regular Badge</Badge>);

    const badge = container.querySelector("div");
    expect(badge).toBeInTheDocument();
    expect(badge).not.toHaveAttribute("role");
    expect(badge).not.toHaveAttribute("aria-live");
  });

  it("should be accessible with custom aria-label", async () => {
    const { container } = render(<Badge ariaLabel="5 unread notifications">5</Badge>);

    const badge = container.querySelector("div");
    expect(badge).toHaveAttribute("aria-label", "5 unread notifications");

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should maintain semantic structure", async () => {
    const { container } = render(
      <div>
        <Badge variant="default">High Contrast</Badge>
        <Badge variant="destructive">Error</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
      </div>
    );

    // Test for basic accessibility violations
    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });
});
