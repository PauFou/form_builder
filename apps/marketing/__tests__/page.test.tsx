import { render, screen } from "@testing-library/react";
import HomePage from "../app/page";

// Mock Next.js components
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("next/image", () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe("HomePage", () => {
  it("renders homepage content", () => {
    render(<HomePage />);

    // Check if main heading exists
    expect(screen.getByText(/Professional Forms/i)).toBeInTheDocument();
  });

  it("renders pricing section", () => {
    render(<HomePage />);

    // Check if pricing section exists
    expect(screen.getByText(/Choose Your Plan/i)).toBeInTheDocument();
  });

  it("renders features section", () => {
    render(<HomePage />);

    // Check if features section exists
    expect(screen.getByText(/Why Choose Our Platform/i)).toBeInTheDocument();
  });
});
