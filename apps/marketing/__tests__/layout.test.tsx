import { render } from "@testing-library/react";
import RootLayout from "../app/layout";

// Mock Next.js metadata
jest.mock("next/font/google", () => ({
  Inter: () => ({
    className: "mocked-inter-font",
  }),
}));

describe("RootLayout", () => {
  it("renders children correctly", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="test-child">Test content</div>
      </RootLayout>
    );

    expect(container.querySelector('[data-testid="test-child"]')).toBeInTheDocument();
  });

  it("has correct html structure", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const htmlElement = container.querySelector("html");
    expect(htmlElement).toHaveAttribute("lang", "en");
  });
});
