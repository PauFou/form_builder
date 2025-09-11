import { render } from "@testing-library/react";
import RootLayout from "../app/layout";

// Mock the geist fonts to avoid import issues
jest.mock("geist", () => ({
  GeistSans: {
    variable: "--font-sans",
    className: "font-sans",
  },
  GeistMono: {
    variable: "--font-mono",
    className: "font-mono",
  },
}));

describe("RootLayout", () => {
  it("renders without errors", () => {
    // RootLayout returns an HTML structure which can't be tested directly
    // We'll just check it doesn't throw
    expect(() => {
      RootLayout({
        children: <div>Test</div>,
      });
    }).not.toThrow();
  });
});
