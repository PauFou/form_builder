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

    // Check if pricing plan cards exist by looking for the plan headings within cards
    const freeHeadings = screen.getAllByText(/Free/i);
    const proHeadings = screen.getAllByText(/Pro/i);

    expect(freeHeadings.length).toBeGreaterThan(0);
    expect(proHeadings.length).toBeGreaterThan(0);
  });

  it("displays plan features", () => {
    render(<PricingPage />);

    // Check if plan features are displayed - use getAllByText since features appear multiple times
    const unlimitedForms = screen.getAllByText(/Unlimited forms/i);
    const unlimitedEverything = screen.getAllByText(/Unlimited everything/i);
    const teamMembers = screen.getAllByText(/Team members/i);

    expect(unlimitedForms.length).toBeGreaterThan(0);
    expect(unlimitedEverything.length).toBeGreaterThan(0);
    expect(teamMembers.length).toBeGreaterThan(0);
  });

  it("has call-to-action buttons", () => {
    render(<PricingPage />);

    // Check if CTA buttons exist
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
