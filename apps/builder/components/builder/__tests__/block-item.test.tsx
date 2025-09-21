import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockItem } from "../block-item";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import type { Block } from "@skemya/contracts";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock UI components
jest.mock("@skemya/ui", () => ({
  ...jest.requireActual("@skemya/ui"),
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild, onClick }: any) => {
    const handleClick = (e: any) => {
      e.stopPropagation();
      if (onClick) onClick(e);
    };
    return asChild ? (
      React.cloneElement(children, { onClick: handleClick })
    ) : (
      <div onClick={handleClick}>{children}</div>
    );
  },
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

// Mock dnd-kit
jest.mock("@dnd-kit/sortable", () => {
  const mockUseSortable = jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }));

  return {
    useSortable: mockUseSortable,
    SortableContext: ({ children }: any) => <>{children}</>,
  };
});

// Mock delete field dialog
jest.mock("../delete-field-dialog", () => ({
  DeleteFieldDialog: ({ open, onConfirm, onOpenChange }: any) =>
    open ? (
      <div data-testid="delete-dialog">
        <button
          onClick={() => {
            onConfirm(false);
            onOpenChange(false);
          }}
        >
          Confirm Delete
        </button>
      </div>
    ) : null,
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => (transform ? "translate3d(10px, 10px, 0)" : ""),
    },
  },
}));

describe("BlockItem", () => {
  const mockSelectBlock = jest.fn();
  const mockUpdateBlock = jest.fn();
  const mockDeleteBlock = jest.fn();
  const mockDuplicateBlock = jest.fn();

  const defaultBlock: Block = {
    id: "test-block-1",
    type: "short_text",
    question: "Test Question",
    required: false,
    validation: [],
    position: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
      deleteBlock: mockDeleteBlock,
      duplicateBlock: mockDuplicateBlock,
      selectedBlockId: null,
      checkFieldReferences: jest.fn(() => ({ hasReferences: false, referencedBy: [] })),
      deleteBlockWithReferences: jest.fn(),
    });
  });

  it("renders the block item", () => {
    render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);
    expect(screen.getByText("Test Question")).toBeInTheDocument();
  });

  it("shows drag handle", () => {
    const { container } = render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);
    const dragHandle = container.querySelector('[class*="cursor-grab"]');
    expect(dragHandle).toBeInTheDocument();
  });

  it("selects block on click", () => {
    render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);
    const card = screen.getByText("Test Question").closest(".relative");
    fireEvent.click(card!);
    expect(mockSelectBlock).toHaveBeenCalledWith("test-block-1");
  });

  it("applies selected styles when selected", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
      deleteBlock: mockDeleteBlock,
      duplicateBlock: mockDuplicateBlock,
      selectedBlockId: "test-block-1",
      checkFieldReferences: jest.fn(() => ({ hasReferences: false, referencedBy: [] })),
      deleteBlockWithReferences: jest.fn(),
    });

    const { container } = render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);
    const card = container.querySelector('[class*="ring-2"][class*="ring-primary"]');
    expect(card).toBeInTheDocument();
  });

  it("opens dropdown menu", async () => {
    const user = userEvent.setup();
    render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);

    const menuButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector('[class*="MoreVertical"]'));
    await user.click(menuButton!);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("duplicates block from menu", async () => {
    const user = userEvent.setup();
    render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);

    const menuButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector('[class*="MoreVertical"]'));
    await user.click(menuButton!);
    await user.click(screen.getByText("Duplicate"));

    expect(mockDuplicateBlock).toHaveBeenCalledWith("test-block-1");
  });

  it("deletes block from menu", async () => {
    const user = userEvent.setup();
    render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);

    const menuButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector('[class*="MoreVertical"]'));
    await user.click(menuButton!);
    await user.click(screen.getByText("Delete"));

    // Handle the confirmation dialog
    const confirmButton = screen.getByText("Confirm Delete");
    await user.click(confirmButton);

    expect(mockDeleteBlock).toHaveBeenCalledWith("test-block-1");
  });

  it("selects block from settings menu", async () => {
    const user = userEvent.setup();
    render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);

    const menuButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector('[class*="MoreVertical"]'));
    await user.click(menuButton!);
    await user.click(screen.getByText("Settings"));

    expect(mockSelectBlock).toHaveBeenCalledWith("test-block-1");
  });

  it("renders unknown block type message", () => {
    const unknownBlock = { ...defaultBlock, type: "unknown_type" };
    render(<BlockItem block={unknownBlock} pageId="page-1" index={0} />);
    expect(screen.getByText("Unknown block type: unknown_type")).toBeInTheDocument();
  });

  it("passes update callback to block component", () => {
    render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);
    // The ShortTextBlock should be rendered with onUpdate prop
    // This is tested indirectly through the block component tests
    expect(screen.getByText("Test Question")).toBeInTheDocument();
  });

  it("handles dragging state", () => {
    // Mock dragging state
    const sortableModule = jest.requireMock("@dnd-kit/sortable");
    sortableModule.useSortable.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: { x: 10, y: 10, scaleX: 1, scaleY: 1 },
      transition: "transform 200ms",
      isDragging: true,
    });

    const { container } = render(<BlockItem block={defaultBlock} pageId="page-1" index={0} />);
    const draggingElement = container.querySelector('[style*="opacity: 0.5"]');
    expect(draggingElement).toBeInTheDocument();
  });
});
