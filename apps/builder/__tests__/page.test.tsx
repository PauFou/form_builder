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
  BlockInspector: ({ blockId }: { blockId: string }) => (
    <div data-testid="block-inspector">Block Inspector for {blockId}</div>
  ),
}));

jest.mock("../components/builder/preview-panel", () => ({
  PreviewPanel: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="preview-panel">Preview Panel</div> : null,
}));

jest.mock("../components/builder/draggable-block", () => ({
  DraggableBlock: ({ block }: any) => <div data-testid={`block-${block.id}`}>{block.label}</div>,
}));

jest.mock("../lib/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: jest.fn(),
}));

jest.mock("../lib/hooks/use-autosave", () => ({
  useAutosave: jest.fn(),
}));

describe("BuilderPage", () => {
  const mockRouter = { push: jest.fn() };
  const mockStore = {
    form: {
      id: "123",
      title: "Test Form",
      pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isDirty: false,
    selectedBlockId: null,
    initializeForm: jest.fn(),
    updateFormTitle: jest.fn(),
    saveForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("should render all main components", () => {
    render(<BuilderPage />);

    expect(screen.getByTestId("form-canvas")).toBeInTheDocument();
    expect(screen.getByText("Block Library")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search blocks...")).toBeInTheDocument();
    // Block inspector area shows message when no block selected
    expect(screen.getByText("Select a block to configure")).toBeInTheDocument();
  });

  it("should display form title", () => {
    render(<BuilderPage />);

    expect(screen.getByText("Test Form")).toBeInTheDocument();
  });

  it("should show publish button", () => {
    render(<BuilderPage />);

    const publishButton = screen.getByText("Publish");
    expect(publishButton).toBeInTheDocument();
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

  it("should show last saved time", () => {
    render(<BuilderPage />);

    expect(screen.getByText(/Last saved/)).toBeInTheDocument();
  });

  it("should navigate to dashboard when back button clicked", () => {
    render(<BuilderPage />);

    const backButton = screen.getByText("Forms");
    fireEvent.click(backButton);

    // This is a link, not a router push
    expect(backButton.closest("a")).toHaveAttribute("href", "/dashboard");
  });

  it("should show block inspector when a block is selected", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      selectedBlockId: "block-123",
    });

    render(<BuilderPage />);

    expect(screen.getByTestId("block-inspector")).toBeInTheDocument();
    expect(screen.getByText("Block Inspector for block-123")).toBeInTheDocument();
  });
});
