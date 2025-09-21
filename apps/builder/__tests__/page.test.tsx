import React from "react";
import { render, screen, waitFor } from "../lib/test-utils";
import HomePage from "../app/page";
import { useRouter } from "next/navigation";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("HomePage", () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("should redirect to forms page", async () => {
    render(<HomePage />);

    // Check that it redirects to /forms
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/forms");
    });
  });

  it("should show loading spinner while redirecting", () => {
    render(<HomePage />);

    // Check for loading spinner by class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("rounded-full");
    expect(spinner).toHaveClass("border-b-2");
    expect(spinner).toHaveClass("border-primary");
  });

  it("should redirect immediately on mount", () => {
    render(<HomePage />);

    // The redirect should happen immediately
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/forms");
  });
});
