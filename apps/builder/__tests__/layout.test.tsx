import React from "react";
import { render } from "@testing-library/react";
import RootLayout from "../app/layout";

// Mock the geist font imports
jest.mock("geist/font/sans", () => ({
  GeistSans: {
    className: "geist-sans-mock",
    style: { fontFamily: "mock-font" },
    variable: "geist-sans-var",
  },
}));
jest.mock("geist/font/mono", () => ({
  GeistMono: {
    className: "geist-mono-mock",
    style: { fontFamily: "mock-mono" },
    variable: "geist-mono-var",
  },
}));

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Inter: () => ({
    className: "inter-mock",
    style: { fontFamily: "mock-inter" },
    variable: "--font-inter",
  }),
}));

// Mock dependencies
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: any) => <div>{children}</div>,
}));

describe("RootLayout", () => {
  it("should render children correctly", () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Child Content</div>
      </RootLayout>
    );

    expect(getByText("Test Child Content")).toBeInTheDocument();
  });

  it("should render toaster component", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    expect(getByTestId("toaster")).toBeInTheDocument();
  });

  it("should render with providers", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("should be defined", () => {
    expect(RootLayout).toBeDefined();
  });
});
