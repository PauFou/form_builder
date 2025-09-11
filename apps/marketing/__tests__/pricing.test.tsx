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

    // Check if pricing plans exist
    expect(screen.getByText(/Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Scale/i)).toBeInTheDocument();
  });

  it("displays plan features", () => {
    render(<PricingPage />);

    // Check if plan features are displayed
    expect(screen.getByText(/forms actifs/i)).toBeInTheDocument();
    expect(screen.getByText(/réponses\/mois/i)).toBeInTheDocument();
  });

  it("has call-to-action buttons", () => {
    render(<PricingPage />);

    // Check if CTA buttons exist
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
