import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Canvas } from "../canvas";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}));

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  verticalListSortingStrategy: [],
}));

// Mock UI components
jest.mock("@skemya/ui", () => ({
  ...jest.requireActual("@skemya/ui"),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  Input: (props: any) => <input {...props} />,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components
jest.mock("../block-item", () => ({
  BlockItem: ({ block, pageId }: any) => (
    <div data-testid={`block-${block.id}`} data-page={pageId}>
      {block.question}
    </div>
  ),
}));

jest.mock("../page-navigation", () => ({
  PageNavigation: () => <div data-testid="page-navigation">Page Navigation</div>,
}));

describe("Canvas", () => {
  const mockForm = {
    id: "test-form",
    name: "Test Form",
    description: "Test form description",
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          { id: "block-1", type: "short_text", question: "Name", position: 0 },
          { id: "block-2", type: "email", question: "Email", position: 1 },
        ],
      },
      {
        id: "page-2",
        title: "Page 2",
        blocks: [{ id: "block-3", type: "phone", question: "Phone", position: 0 }],
      },
    ],
  };

  const mockUpdateForm = jest.fn();
  const mockAddBlock = jest.fn();
  const mockAddPage = jest.fn();
  const mockUpdatePage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateForm: mockUpdateForm,
      addBlock: mockAddBlock,
      selectedPageId: "page-1",
      addPage: mockAddPage,
      updatePage: mockUpdatePage,
    });
  });

  it("renders canvas with form content", () => {
    render(<Canvas />);

    expect(screen.getByDisplayValue("Test Form")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add a description for your form...")).toBeInTheDocument();
  });

  it("shows page navigation for multi-page forms", () => {
    render(<Canvas />);

    expect(screen.getByTestId("page-navigation")).toBeInTheDocument();
  });

  it("displays blocks on current page", () => {
    render(<Canvas />);

    expect(screen.getByTestId("block-block-1")).toBeInTheDocument();
    expect(screen.getByTestId("block-block-2")).toBeInTheDocument();
    expect(screen.queryByTestId("block-block-3")).not.toBeInTheDocument();
  });

  it("shows empty state when no blocks", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: {
        ...mockForm,
        pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
      },
      updateForm: mockUpdateForm,
      addBlock: mockAddBlock,
      selectedPageId: "page-1",
      addPage: mockAddPage,
      updatePage: mockUpdatePage,
    });

    render(<Canvas />);

    expect(screen.getByText("Drop blocks here to start building your form")).toBeInTheDocument();
    expect(screen.getByText("Add Block")).toBeInTheDocument();
  });

  it("updates form name", async () => {
    const user = userEvent.setup();
    render(<Canvas />);

    const nameInput = screen.getByDisplayValue("Test Form") as HTMLInputElement;

    // Type a character to trigger onChange
    await user.type(nameInput, "x");

    // Check that updateForm was called
    expect(mockUpdateForm).toHaveBeenCalled();

    // Should be called with the original value plus the new character
    expect(mockUpdateForm).toHaveBeenCalledWith({ name: "Test Formx" });
  });

  it("updates form description", async () => {
    const user = userEvent.setup();
    render(<Canvas />);

    const descInput = screen.getByPlaceholderText(
      "Add a description for your form..."
    ) as HTMLTextAreaElement;

    // Type one character to trigger onChange
    await user.type(descInput, "!");

    // Check that updateForm was called
    expect(mockUpdateForm).toHaveBeenCalled();

    // Should append to existing description
    expect(mockUpdateForm).toHaveBeenCalledWith({ description: "Test form description!" });
  });

  it("adds block from empty state", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: {
        ...mockForm,
        pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
      },
      updateForm: mockUpdateForm,
      addBlock: mockAddBlock,
      selectedPageId: "page-1",
      addPage: mockAddPage,
      updatePage: mockUpdatePage,
    });

    render(<Canvas />);

    const addButton = screen.getByText("Add Block");
    await user.click(addButton);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "short_text",
        question: "",
        required: false,
      }),
      "page-1"
    );
  });

  it("highlights when dragging over", () => {
    // Mock dragging state
    const mockUseDroppable = jest.fn(() => ({
      setNodeRef: jest.fn(),
      isOver: true,
    }));
    jest.mocked(jest.requireMock("@dnd-kit/core")).useDroppable = mockUseDroppable;

    const { container } = render(<Canvas />);

    // Should have highlight styles
    const droppable = container.querySelector(".ring-2.ring-primary");
    expect(droppable).toBeInTheDocument();
  });

  it("renders without form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      updateForm: mockUpdateForm,
      addBlock: mockAddBlock,
      selectedPageId: null,
      addPage: mockAddPage,
      updatePage: mockUpdatePage,
    });

    render(<Canvas />);

    expect(screen.getByText("No form selected")).toBeInTheDocument();
  });

  it("handles single page form without navigation", () => {
    const singlePageForm = {
      ...mockForm,
      pages: [mockForm.pages[0]],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: singlePageForm,
      updateForm: mockUpdateForm,
      addBlock: mockAddBlock,
      selectedPageId: "page-1",
      addPage: mockAddPage,
      updatePage: mockUpdatePage,
    });

    render(<Canvas />);

    expect(screen.queryByTestId("page-navigation")).not.toBeInTheDocument();
  });
});
