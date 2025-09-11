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
    expect(screen.getByText(/Build forms/i)).toBeInTheDocument();
    expect(screen.getByText(/Ship answers/i)).toBeInTheDocument();
  });

  it("renders USP section", () => {
    render(<HomePage />);

    // Check if USP section exists
    expect(screen.getByText(/Lightning Fast/i)).toBeInTheDocument();
    expect(screen.getByText(/Smart Logic/i)).toBeInTheDocument();
    expect(screen.getByText(/Data First/i)).toBeInTheDocument();
  });

  it("renders features section", () => {
    render(<HomePage />);

    // Check if features section exists
    expect(screen.getByText(/Everything you need to/i)).toBeInTheDocument();
    expect(screen.getByText(/Intuitive Visual Builder/i)).toBeInTheDocument();
  });
});
