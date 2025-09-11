import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BuilderPage from "../app/page";
import { useRouter } from "next/navigation";
import { useFormBuilderStore } from "../lib/stores/form-builder-store";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../lib/stores/form-builder-store", () => ({
  useFormBuilderStore: jest.fn(),
}));

jest.mock("../components/builder/form-canvas", () => ({
  FormCanvas: () => <div data-testid="form-canvas">Form Canvas</div>,
}));

jest.mock("../components/builder/block-library", () => ({
  BlockLibrary: () => <div data-testid="block-library">Block Library</div>,
}));

jest.mock("../components/builder/block-inspector", () => ({
  BlockInspector: () => <div data-testid="block-inspector">Block Inspector</div>,
}));

jest.mock("../components/builder/preview-panel", () => ({
  PreviewPanel: () => <div data-testid="preview-panel">Preview Panel</div>,
}));

jest.mock("../components/shared/navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe("BuilderPage", () => {
  const mockRouter = { push: jest.fn() };
  const mockStore = {
    form: { id: "123", title: "Test Form" },
    isDirty: false,
    selectedBlockId: null,
    updateFormTitle: jest.fn(),
    saveForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useFormBuilderStore as jest.Mock).mockReturnValue(mockStore);
  });

  it("should render all main components", () => {
    render(<BuilderPage />);

    expect(screen.getByTestId("navigation")).toBeInTheDocument();
    expect(screen.getByTestId("form-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("block-library")).toBeInTheDocument();
    expect(screen.getByTestId("block-inspector")).toBeInTheDocument();
  });

  it("should display form title input", () => {
    render(<BuilderPage />);

    const titleInput = screen.getByDisplayValue("Test Form");
    expect(titleInput).toBeInTheDocument();
  });

  it("should update form title on input change", () => {
    render(<BuilderPage />);

    const titleInput = screen.getByDisplayValue("Test Form");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    expect(mockStore.updateFormTitle).toHaveBeenCalledWith("New Title");
  });

  it("should show save button", () => {
    render(<BuilderPage />);

    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeInTheDocument();
  });

  it("should call saveForm when save button clicked", () => {
    render(<BuilderPage />);

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(mockStore.saveForm).toHaveBeenCalled();
  });

  it("should show preview button", () => {
    render(<BuilderPage />);

    const previewButton = screen.getByText("Preview");
    expect(previewButton).toBeInTheDocument();
  });

  it("should toggle preview panel when preview button clicked", () => {
    render(<BuilderPage />);

    // Initially preview panel should not be visible
    expect(screen.queryByTestId("preview-panel")).not.toBeInTheDocument();

    const previewButton = screen.getByText("Preview");
    fireEvent.click(previewButton);

    // After clicking, preview panel should be visible
    expect(screen.getByTestId("preview-panel")).toBeInTheDocument();
  });

  it("should show dirty indicator when form has unsaved changes", () => {
    (useFormBuilderStore as jest.Mock).mockReturnValue({
      ...mockStore,
      isDirty: true,
    });

    render(<BuilderPage />);

    const saveButton = screen.getByText("Save");
    expect(saveButton).toHaveClass("bg-primary"); // Assuming primary color for dirty state
  });

  it("should navigate to forms list when back button clicked", () => {
    render(<BuilderPage />);

    const backButton = screen.getByLabelText("Back to forms");
    fireEvent.click(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/forms");
  });
});
