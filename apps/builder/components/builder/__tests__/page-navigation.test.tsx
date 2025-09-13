import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageNavigation } from "../page-navigation";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock UI components
jest.mock("@forms/ui", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock icons
jest.mock("lucide-react", () => ({
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
}));

describe("PageNavigation", () => {
  const mockSelectPage = jest.fn();

  const mockFormWithPages = {
    id: "test-form",
    name: "Test Form",
    pages: [
      { id: "page-1", title: "Introduction", blocks: [] },
      { id: "page-2", title: "Details", blocks: [] },
      { id: "page-3", title: "Conclusion", blocks: [] },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when no form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      selectedPageId: null,
      selectPage: mockSelectPage,
    });

    const { container } = render(<PageNavigation />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when form has only one page", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: { ...mockFormWithPages, pages: [mockFormWithPages.pages[0]] },
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
    });

    const { container } = render(<PageNavigation />);
    expect(container.firstChild).toBeNull();
  });

  it("shows navigation for multi-page form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockFormWithPages,
      selectedPageId: "page-2",
      selectPage: mockSelectPage,
    });

    render(<PageNavigation />);

    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockFormWithPages,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
    });

    render(<PageNavigation />);

    const previousButton = screen.getByText("Previous").closest("button");
    expect(previousButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockFormWithPages,
      selectedPageId: "page-3",
      selectPage: mockSelectPage,
    });

    render(<PageNavigation />);

    const nextButton = screen.getByText("Next").closest("button");
    expect(nextButton).toBeDisabled();
  });

  it("navigates to previous page", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockFormWithPages,
      selectedPageId: "page-2",
      selectPage: mockSelectPage,
    });

    render(<PageNavigation />);

    const previousButton = screen.getByText("Previous");
    await user.click(previousButton);

    expect(mockSelectPage).toHaveBeenCalledWith("page-1");
  });

  it("navigates to next page", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockFormWithPages,
      selectedPageId: "page-2",
      selectPage: mockSelectPage,
    });

    render(<PageNavigation />);

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    expect(mockSelectPage).toHaveBeenCalledWith("page-3");
  });

  it("shows page without title", () => {
    const formWithoutTitles = {
      ...mockFormWithPages,
      pages: mockFormWithPages.pages.map((p) => ({ ...p, title: "" })),
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: formWithoutTitles,
      selectedPageId: "page-2",
      selectPage: mockSelectPage,
    });

    render(<PageNavigation />);

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    // Title separator and title should not be shown
    expect(screen.queryByText("•")).not.toBeInTheDocument();
  });

  it("does not navigate when already at boundaries", async () => {
    const user = userEvent.setup();

    // Test first page
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockFormWithPages,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
    });

    const { rerender } = render(<PageNavigation />);
    const previousButton = screen.getByText("Previous");
    await user.click(previousButton);
    expect(mockSelectPage).not.toHaveBeenCalled();

    // Reset mock
    mockSelectPage.mockClear();

    // Test last page
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockFormWithPages,
      selectedPageId: "page-3",
      selectPage: mockSelectPage,
    });

    rerender(<PageNavigation />);
    const nextButton = screen.getByText("Next");
    await user.click(nextButton);
    expect(mockSelectPage).not.toHaveBeenCalled();
  });
});
