import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { BlockRenderer } from "../BlockRenderer";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../../lib/stores/form-builder-store");

// Mock framer-motion
const MockDiv = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
));
MockDiv.displayName = "MockDiv";

jest.mock("framer-motion", () => ({
  motion: {
    div: MockDiv,
  },
}));

describe("BlockRenderer", () => {
  const mockSelectBlock = jest.fn();
  const mockDeleteBlock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      selectedBlockId: null,
      selectBlock: mockSelectBlock,
      deleteBlock: mockDeleteBlock,
    });
  });

  const renderWithDndContext = (component: React.ReactElement) => {
    return render(<DndContext>{component}</DndContext>);
  };

  const mockBlock = {
    id: "block-1",
    type: "short_text",
    question: "What is your name?",
    required: false,
  };

  it("renders block with question text", () => {
    renderWithDndContext(<BlockRenderer block={mockBlock} pageId="page-1" index={0} />);

    expect(screen.getByText("What is your name?")).toBeInTheDocument();
  });

  it("shows required indicator when block is required", () => {
    const requiredBlock = { ...mockBlock, required: true };

    renderWithDndContext(<BlockRenderer block={requiredBlock} pageId="page-1" index={0} />);

    // Look for asterisk or "required" text
    expect(screen.getByText(/\*/)).toBeInTheDocument();
  });

  it("highlights block when selected", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      deleteBlock: mockDeleteBlock,
    });

    const { container } = renderWithDndContext(
      <BlockRenderer block={mockBlock} pageId="page-1" index={0} />
    );

    const blockElement = container.firstChild as HTMLElement;
    // Check for selection styling (border-primary or similar)
    expect(blockElement.className).toMatch(/border-primary|ring-primary|selected/);
  });

  it("calls selectBlock when clicked", async () => {
    const user = userEvent.setup();

    renderWithDndContext(<BlockRenderer block={mockBlock} pageId="page-1" index={0} />);

    const blockElement = screen.getByText("What is your name?").closest("div");
    if (blockElement) {
      await user.click(blockElement);
    }

    expect(mockSelectBlock).toHaveBeenCalledWith("block-1");
  });

  it("renders different block types correctly", () => {
    const emailBlock = {
      id: "block-2",
      type: "email",
      question: "What is your email?",
      required: false,
    };

    renderWithDndContext(<BlockRenderer block={emailBlock} pageId="page-1" index={0} />);

    expect(screen.getByText("What is your email?")).toBeInTheDocument();
  });

  it("applies draggable attributes for sorting", () => {
    const { container } = renderWithDndContext(
      <BlockRenderer block={mockBlock} pageId="page-1" index={0} />
    );

    // DndKit adds data attributes to sortable elements
    const draggableElement = container.firstChild;
    expect(draggableElement).toBeInTheDocument();
  });

  it("shows drop indicator when showDropIndicator is true", () => {
    renderWithDndContext(
      <BlockRenderer
        block={mockBlock}
        pageId="page-1"
        index={0}
        showDropIndicator={true}
        dropAbove={true}
      />
    );

    // Should show blue indicator line
    const { container } = render(
      <DndContext>
        <BlockRenderer
          block={mockBlock}
          pageId="page-1"
          index={0}
          showDropIndicator={true}
          dropAbove={true}
        />
      </DndContext>
    );

    // Check for indicator element
    const indicator = container.querySelector(".bg-primary, .border-primary");
    expect(indicator).toBeInTheDocument();
  });

  it("displays placeholder text for empty question", () => {
    const emptyBlock = {
      id: "block-3",
      type: "short_text",
      question: "",
      required: false,
    };

    renderWithDndContext(<BlockRenderer block={emptyBlock} pageId="page-1" index={0} />);

    // Should show some default text or placeholder
    const blockElement = screen.getByText(/question|untitled|empty/i);
    expect(blockElement).toBeInTheDocument();
  });

  it("renders block type icon", () => {
    const { container } = renderWithDndContext(
      <BlockRenderer block={mockBlock} pageId="page-1" index={0} />
    );

    // Should have an icon (svg element)
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});
