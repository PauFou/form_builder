/**
 * Accessibility tests for Card component
 */

import { render } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";
import { runAccessibilityTest, SKEMYA_A11Y_CONFIG } from "../../../utils/accessibility-testing";
import { Button } from "../button";

describe("Card Accessibility", () => {
  it("should have no accessibility violations in default state", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is a card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter>
          <Button>Action</Button>
        </CardFooter>
      </Card>
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
    expect(results.wcagLevel).toBe("AA");
  });

  it("should be accessible when interactive", async () => {
    const { container } = render(
      <Card interactive={true} ariaLabel="Clickable form card" onClick={() => {}}>
        <CardHeader>
          <CardTitle id="form-title">Contact Form</CardTitle>
          <CardDescription>Fill out this form to contact us</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Form fields would go here</p>
        </CardContent>
      </Card>
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should be accessible with aria-labelledby", async () => {
    const { container } = render(
      <Card ariaLabelledBy="card-title">
        <CardHeader>
          <CardTitle id="card-title">Settings Card</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Settings options would be listed here</p>
        </CardContent>
      </Card>
    );

    const results = await runAccessibilityTest(container, SKEMYA_A11Y_CONFIG);
    expect(results.violationCount).toBe(0);
  });

  it("should have proper ARIA attributes when interactive", async () => {
    const { container } = render(
      <Card interactive={true} ariaLabel="Interactive card" onClick={() => {}}>
        <CardContent>Content</CardContent>
      </Card>
    );

    const card = container.querySelector('[role="button"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabIndex", "0");
    expect(card).toHaveAttribute("aria-label", "Interactive card");
  });

  it("should have article role when not interactive", async () => {
    const { container } = render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );

    const card = container.querySelector('[role="article"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("role", "article");
    expect(card).not.toHaveAttribute("tabIndex");
  });

  it("should properly associate title with card using aria-labelledby", async () => {
    const { container } = render(
      <Card ariaLabelledBy="my-title">
        <CardHeader>
          <CardTitle id="my-title">My Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );

    const card = container.querySelector('[role="article"]');
    const title = container.querySelector("#my-title");

    expect(card).toHaveAttribute("aria-labelledby", "my-title");
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("My Title");
  });
});
