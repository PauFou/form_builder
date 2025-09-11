import { render, screen } from "@testing-library/react";
import { Navigation } from "../components/shared/navigation";

// Mock Next.js components
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("Navigation", () => {
  it("renders navigation menu", () => {
    render(<Navigation />);

    // Check if navigation items exist
    const navElement = screen.getByRole("navigation");
    expect(navElement).toBeInTheDocument();
  });

  it("contains expected navigation links", () => {
    render(<Navigation />);

    // Look for common navigation elements
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });
});
