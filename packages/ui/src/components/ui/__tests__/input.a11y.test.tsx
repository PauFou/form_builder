/**
 * Accessibility tests for Input component
 */

import { render } from "@testing-library/react";
import { Input } from "../input";
import { runAccessibilityTest, SKEMYA_A11Y_CONFIG } from "../../../utils/accessibility-testing";

describe("Input Accessibility", () => {
  it("should have no accessibility violations in default state", async () => {
    const { container } = render(<Input label="Username" placeholder="Enter your username" />);

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
    expect(results.wcagLevel).toBe("AA");
  });

  it("should be accessible with error state", async () => {
    const { container } = render(
      <Input
        label="Email"
        error={true}
        errorMessage="Please enter a valid email address"
        placeholder="email@example.com"
      />
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should be accessible with helper text", async () => {
    const { container } = render(
      <Input
        label="Password"
        type="password"
        helperText="Must be at least 8 characters long"
        required
      />
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should be accessible when disabled", async () => {
    const { container } = render(
      <Input label="Disabled Input" disabled value="Cannot edit this" />
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should be accessible with screen reader only label", async () => {
    const { container } = render(
      <Input label="Search" srOnly={true} placeholder="Search forms..." type="search" />
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should have proper ARIA attributes", async () => {
    const { container } = render(
      <Input
        label="Email"
        error={true}
        errorMessage="Invalid email format"
        helperText="We'll never share your email"
        required
      />
    );

    const input = container.querySelector("input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-describedby");

    const ariaDescribedBy = input?.getAttribute("aria-describedby");
    expect(ariaDescribedBy).toBeTruthy();

    // Check that all referenced IDs exist
    const referencedIds = ariaDescribedBy?.split(" ") || [];
    referencedIds.forEach((id) => {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    });
  });
});
