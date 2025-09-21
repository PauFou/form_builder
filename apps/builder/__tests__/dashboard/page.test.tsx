import React from "react";
import { render, waitFor } from "../../lib/test-utils";
import DashboardPage from "../../app/dashboard/page";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("DashboardPage", () => {
  const mockReplace = jest.fn();
  const mockRouter = {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("should redirect to forms page", async () => {
    render(<DashboardPage />);

    // Check that it redirects to /forms using replace
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/forms");
    });
  });

  it("should redirect immediately on mount", () => {
    render(<DashboardPage />);

    // The redirect should happen immediately
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/forms");
  });

  it("should render null while redirecting", () => {
    const { container } = render(<DashboardPage />);

    // The component should render nothing (null)
    expect(container.firstChild).toBeNull();
  });
});
