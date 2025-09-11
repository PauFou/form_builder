import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FormsPage from "../../app/forms/page";
import { useRouter } from "next/navigation";
import { getForms } from "../../lib/api/forms";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../lib/api/forms", () => ({
  getForms: jest.fn(),
  deleteForm: jest.fn(),
}));

jest.mock("../../components/shared/navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe("FormsPage", () => {
  const mockRouter = { push: jest.fn() };
  const mockForms = [
    {
      id: "1",
      title: "Test Form 1",
      status: "published",
      submissions_count: 10,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
    {
      id: "2",
      title: "Test Form 2",
      status: "draft",
      submissions_count: 0,
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-04T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (getForms as jest.Mock).mockResolvedValue(mockForms);
  });

  it("should render the forms page heading", async () => {
    render(<FormsPage />);

    expect(screen.getByText("My Forms")).toBeInTheDocument();
  });

  it("should render create new form button", () => {
    render(<FormsPage />);

    expect(screen.getByText("Create New Form")).toBeInTheDocument();
  });

  it("should navigate to form builder when create button clicked", () => {
    render(<FormsPage />);

    const createButton = screen.getByText("Create New Form");
    fireEvent.click(createButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/forms/new");
  });

  it("should display loading state initially", () => {
    render(<FormsPage />);

    expect(screen.getByText("Loading forms...")).toBeInTheDocument();
  });

  it("should display forms after loading", async () => {
    render(<FormsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Form 1")).toBeInTheDocument();
      expect(screen.getByText("Test Form 2")).toBeInTheDocument();
    });
  });

  it("should display form status badges", async () => {
    render(<FormsPage />);

    await waitFor(() => {
      expect(screen.getByText("published")).toBeInTheDocument();
      expect(screen.getByText("draft")).toBeInTheDocument();
    });
  });

  it("should display submission counts", async () => {
    render(<FormsPage />);

    await waitFor(() => {
      expect(screen.getByText("10 submissions")).toBeInTheDocument();
      expect(screen.getByText("0 submissions")).toBeInTheDocument();
    });
  });

  it("should navigate to form editor when edit button clicked", async () => {
    render(<FormsPage />);

    await waitFor(() => {
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/forms/1/edit");
  });

  it("should navigate to form analytics when view analytics clicked", async () => {
    render(<FormsPage />);

    await waitFor(() => {
      const analyticsButtons = screen.getAllByText("View Analytics");
      fireEvent.click(analyticsButtons[0]);
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/forms/1/analytics");
  });

  it("should show empty state when no forms", async () => {
    (getForms as jest.Mock).mockResolvedValue([]);

    render(<FormsPage />);

    await waitFor(() => {
      expect(screen.getByText("No forms yet")).toBeInTheDocument();
      expect(screen.getByText("Create your first form to get started")).toBeInTheDocument();
    });
  });

  it("should handle error state", async () => {
    (getForms as jest.Mock).mockRejectedValue(new Error("Failed to load forms"));

    render(<FormsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load forms")).toBeInTheDocument();
    });
  });
});
