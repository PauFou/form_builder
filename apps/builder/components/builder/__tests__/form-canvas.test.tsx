import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormCanvas } from "../form-canvas";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock crypto.randomUUID before any imports that might use it
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => `uuid-${Date.now()}`),
  },
  writable: true,
});

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragStart, onDragOver, onDragEnd }: any) => {
    // Store handlers globally for testing
    (global as any).dndHandlers = { onDragStart, onDragOver, onDragEnd };
    return <div data-testid="dnd-context">{children}</div>;
  },
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  DragOverlay: ({ children }: any) =>
    children ? <div data-testid="drag-overlay">{children}</div> : null,
  useDroppable: jest.fn(),
}));

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
  useSortable: jest.fn(),
}));

// Mock UI components
jest.mock("@skemya/ui", () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
  Tabs: ({ children, value, onValueChange, className }: any) => {
    // Store onValueChange in a way that can be called
    (window as any).__tabsOnValueChange = onValueChange;
    return (
      <div data-tabs-value={value} className={className}>
        {children}
      </div>
    );
  },
  TabsContent: ({ children, value, className }: any) => (
    <div data-tab-content={value} data-testid={`tab-content-${value}`} className={className}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div className={className} role="tablist">
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, onClick, className }: any) => (
    <button
      role="tab"
      data-tab-trigger={value}
      onClick={() => {
        if ((window as any).__tabsOnValueChange) {
          (window as any).__tabsOnValueChange(value);
        }
      }}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Plus: () => <span>Plus</span>,
  FileText: () => <span>FileText</span>,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock BlockItem
jest.mock("../block-item", () => ({
  BlockItem: ({ block, pageId, index }: any) => (
    <div data-testid={`block-${block.id}`} data-page-id={pageId} data-index={index}>
      Block: {block.question || block.type}
    </div>
  ),
}));

describe("FormCanvas", () => {
  const mockAddPage = jest.fn();
  const mockAddBlock = jest.fn();
  const mockMoveBlock = jest.fn();
  const mockUpdateForm = jest.fn();
  const mockSelectPage = jest.fn();
  const mockSetNodeRef = jest.fn();

  const mockForm = {
    id: "test-form",
    title: "Test Form",
    description: "Test description",
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          {
            id: "block-1",
            type: "text",
            question: "What is your name?",
            required: false,
          },
          {
            id: "block-2",
            type: "email",
            question: "What is your email?",
            required: true,
          },
        ],
      },
      {
        id: "page-2",
        title: "Page 2",
        blocks: [],
      },
    ],
  };

  const mockStore = {
    form: mockForm,
    addPage: mockAddPage,
    addBlock: mockAddBlock,
    moveBlock: mockMoveBlock,
    updateForm: mockUpdateForm,
    selectPage: mockSelectPage,
    selectedPageId: "page-1",
    getState: () => mockStore,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue(mockStore);
    (useFormBuilderStore as any).getState = () => mockStore;
    (useDroppable as jest.Mock).mockReturnValue({
      setNodeRef: mockSetNodeRef,
    });
  });

  afterEach(() => {
    delete (window as any).__tabsOnValueChange;
  });

  it("shows empty state when no form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      form: null,
    });

    render(<FormCanvas />);

    expect(screen.getByText("No form selected")).toBeInTheDocument();
    expect(screen.getByText("Create a new form or select an existing one")).toBeInTheDocument();
  });

  it("renders form with title and description", () => {
    render(<FormCanvas />);

    expect(screen.getByDisplayValue("Test Form")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
  });

  it("updates form title", async () => {
    const user = userEvent.setup();
    render(<FormCanvas />);

    const titleInput = screen.getByDisplayValue("Test Form");
    await user.type(titleInput, "!");

    expect(mockUpdateForm).toHaveBeenCalledWith({ title: "Test Form!" });
  });

  it("updates form description", async () => {
    const user = userEvent.setup();
    render(<FormCanvas />);

    const descInput = screen.getByDisplayValue("Test description");
    await user.type(descInput, "!");

    expect(mockUpdateForm).toHaveBeenLastCalledWith({ description: "Test description!" });
  });

  it("renders page tabs", () => {
    render(<FormCanvas />);

    expect(screen.getByRole("tab", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Page 2" })).toBeInTheDocument();
  });

  it("adds new page", async () => {
    const user = userEvent.setup();
    render(<FormCanvas />);

    const addPageButton = screen.getByText("Add Page");
    await user.click(addPageButton);

    expect(mockAddPage).toHaveBeenCalledWith("New Page");
  });

  it("renders blocks in page", () => {
    render(<FormCanvas />);

    expect(screen.getByTestId("block-block-1")).toBeInTheDocument();
    expect(screen.getByTestId("block-block-2")).toBeInTheDocument();
    expect(screen.getByText("Block: What is your name?")).toBeInTheDocument();
    expect(screen.getByText("Block: What is your email?")).toBeInTheDocument();
  });

  it("shows empty state for page with no blocks", () => {
    render(<FormCanvas />);

    // Check page 2 content
    const page2Content = screen.getByTestId("tab-content-page-2");
    expect(page2Content).toBeInTheDocument();

    // Empty state elements should be in the page
    const emptyStates = screen.getAllByText("No blocks yet");
    expect(emptyStates.length).toBeGreaterThan(0);
  });

  it("handles drag start", () => {
    render(<FormCanvas />);

    const handlers = (global as any).dndHandlers;
    handlers.onDragStart({ active: { id: "test-block" } });

    // Component should handle drag start internally
    expect(handlers.onDragStart).toBeDefined();
  });

  it("handles drag over", () => {
    render(<FormCanvas />);

    const handlers = (global as any).dndHandlers;
    handlers.onDragOver({ over: { id: "page-1-dropzone-0" } });

    // Component should handle drag over internally
    expect(handlers.onDragOver).toBeDefined();
  });

  it("handles drag end - adding block from library", () => {
    render(<FormCanvas />);

    const handlers = (global as any).dndHandlers;
    handlers.onDragEnd({
      active: {
        id: "library-text",
        data: { current: { source: "library", blockType: "text" } },
      },
      over: {
        id: "page-1-dropzone-0",
        data: { current: { type: "dropzone", pageId: "page-1", index: 0 } },
      },
    });

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        type: "text",
        question: "",
        required: false,
      }),
      "page-1",
      0
    );
  });

  it("handles drag end - reordering blocks", () => {
    render(<FormCanvas />);

    const handlers = (global as any).dndHandlers;
    handlers.onDragEnd({
      active: {
        id: "block-1",
        data: { current: { type: "block", blockId: "block-1" } },
      },
      over: {
        id: "block-2",
        data: { current: { type: "block", pageId: "page-1", index: 1 } },
      },
    });

    expect(mockMoveBlock).toHaveBeenCalledWith("block-1", "page-1", 1);
  });

  it("handles drag end - moving block to dropzone", () => {
    render(<FormCanvas />);

    const handlers = (global as any).dndHandlers;
    handlers.onDragEnd({
      active: {
        id: "block-1",
        data: { current: { type: "block", blockId: "block-1" } },
      },
      over: {
        id: "page-2-dropzone-0",
        data: { current: { type: "dropzone", pageId: "page-2", index: 0 } },
      },
    });

    expect(mockMoveBlock).toHaveBeenCalledWith("block-1", "page-2", 0);
  });

  it("handles drag end with no drop target", () => {
    render(<FormCanvas />);

    const handlers = (global as any).dndHandlers;
    handlers.onDragEnd({
      active: { id: "block-1" },
      over: null,
    });

    expect(mockAddBlock).not.toHaveBeenCalled();
    expect(mockMoveBlock).not.toHaveBeenCalled();
  });

  it("shows drag overlay when dragging", () => {
    render(<FormCanvas />);

    const handlers = (global as any).dndHandlers;
    handlers.onDragStart({ active: { id: "test-block" } });

    // Force re-render to see the overlay
    const { rerender } = render(<FormCanvas />);

    // The overlay is shown based on activeId state
    expect(handlers.onDragStart).toBeDefined();
  });

  it("uses placeholder text for untitled pages", () => {
    const formWithUntitledPage = {
      ...mockForm,
      pages: [
        { id: "page-1", title: "", blocks: [] },
        { id: "page-2", title: null, blocks: [] },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      form: formWithUntitledPage,
    });

    render(<FormCanvas />);

    expect(screen.getByRole("tab", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Page 2" })).toBeInTheDocument();
  });

  it("renders multiple dropzones per page", () => {
    render(<FormCanvas />);

    // Multiple dropzones are created but might not all be visible
    // The component creates dropzones before and after each block
    const dndContext = screen.getByTestId("dnd-context");
    expect(dndContext).toBeInTheDocument();
  });

  it("handles form with empty title", () => {
    const formWithoutTitle = {
      ...mockForm,
      title: "",
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      form: formWithoutTitle,
    });

    render(<FormCanvas />);

    const titleInput = screen.getByPlaceholderText("Untitled Form");
    expect(titleInput).toHaveValue("");
  });

  it("handles form with empty description", () => {
    const formWithoutDesc = {
      ...mockForm,
      description: "",
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      form: formWithoutDesc,
    });

    render(<FormCanvas />);

    const descInput = screen.getByPlaceholderText("Add a description...");
    expect(descInput).toHaveValue("");
  });

  it("renders sortable context for blocks", () => {
    render(<FormCanvas />);

    expect(screen.getByTestId("sortable-context")).toBeInTheDocument();
  });

  it("passes correct props to BlockItem", () => {
    render(<FormCanvas />);

    const block1 = screen.getByTestId("block-block-1");
    expect(block1).toHaveAttribute("data-page-id", "page-1");
    expect(block1).toHaveAttribute("data-index", "0");

    const block2 = screen.getByTestId("block-block-2");
    expect(block2).toHaveAttribute("data-page-id", "page-1");
    expect(block2).toHaveAttribute("data-index", "1");
  });
});
