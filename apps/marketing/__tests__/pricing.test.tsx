import { render, screen } from "@testing-library/react";
import PricingPage from "../app/pricing/page";

// Mock Next.js components
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("PricingPage", () => {
  it("renders pricing plans", () => {
    render(<PricingPage />);

    // Check if pricing plans exist - there are multiple "Free" texts, so be more specific
    expect(screen.getByRole("heading", { name: /Free/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Pro/i })).toBeInTheDocument();
  });

  it("displays plan features", () => {
    render(<PricingPage />);

    // Check if plan features are displayed
    expect(screen.getByText(/Unlimited Forms/i)).toBeInTheDocument();
    expect(screen.getByText(/Unlimited Responses/i)).toBeInTheDocument();
    expect(screen.getByText(/Logic builder/i)).toBeInTheDocument();
  });

  it("has call-to-action buttons", () => {
    render(<PricingPage />);

    // Check if CTA buttons exist
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
