import React from "react";
import { render, screen, waitFor, fireEvent } from "../../lib/test-utils";
import Dashboard from "../../app/dashboard/page";
import { listForms } from "../../lib/api/forms";
import { useRouter } from "next/navigation";

// Mock the navigation component
jest.mock("../../components/shared/navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

// Mock the API
jest.mock("../../lib/api/forms", () => ({
  listForms: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Dashboard", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (listForms as jest.Mock).mockResolvedValue({
      forms: [
        {
          id: "1",
          title: "Test Form 1",
          status: "published",
          description: "Test description",
          submissions_count: 10,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Test Form 2",
          status: "draft",
          submissions_count: 5,
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  });

  it("should render the page title", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("My Forms")).toBeInTheDocument();
    });
  });

  it("should render the navigation component", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("navigation")).toBeInTheDocument();
    });
  });

  it("should render create form button", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Create form")).toBeInTheDocument();
    });
  });

  it("should display forms list after loading", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Test Form 1")).toBeInTheDocument();
      expect(screen.getByText("Test Form 2")).toBeInTheDocument();
    });
  });

  it("should show form status", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Published")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });
  });

  it("should navigate when create button clicked", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const createButton = screen.getByText("Create form");
      fireEvent.click(createButton);
    });

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should have search functionality", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search forms...");
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("should have grid/list view toggle", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      // Look for the grid and list buttons
      const buttons = screen.getAllByRole("button");
      const gridButton = buttons.find((btn) => btn.querySelector(".lucide-grid3x3"));
      const listButton = buttons.find((btn) => btn.querySelector(".lucide-list"));
      expect(gridButton).toBeTruthy();
      expect(listButton).toBeTruthy();
    });
  });

  it("should show empty state when no forms", async () => {
    (listForms as jest.Mock).mockResolvedValue({ forms: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("No forms yet")).toBeInTheDocument();
      expect(screen.getByText("Create your first form to get started")).toBeInTheDocument();
    });
  });

  it("should have correct layout structure", async () => {
    const { container } = render(<Dashboard />);

    await waitFor(() => {
      const mainContainer = container.querySelector(".min-h-screen");
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
