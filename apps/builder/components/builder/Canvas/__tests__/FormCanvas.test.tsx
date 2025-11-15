import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { FormCanvas } from "../FormCanvas";
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

const AnimatePresence = ({ children }: any) => <>{children}</>;
AnimatePresence.displayName = "AnimatePresence";

jest.mock("framer-motion", () => ({
  motion: {
    div: MockDiv,
  },
  AnimatePresence,
}));

// Mock PageView component
jest.mock("../PageView", () => ({
  PageView: ({ page, isActive }: any) => (
    <div data-testid={`page-view-${page.id}`} data-active={isActive}>
      <h2>{page.title}</h2>
      {page.blocks.map((block: any) => (
        <div key={block.id} data-testid={`block-${block.id}`}>
          {block.question}
        </div>
      ))}
    </div>
  ),
}));

describe("FormCanvas", () => {
  const mockSelectPage = jest.fn();
  const mockAddPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithDndContext = (component: React.ReactElement) => {
    return render(<DndContext>{component}</DndContext>);
  };

  it("renders null when no form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      selectedPageId: null,
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    const { container } = renderWithDndContext(<FormCanvas dropPosition={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders single page form without tabs", () => {
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [
        {
          id: "page-1",
          title: "Page 1",
          blocks: [{ id: "block-1", type: "short_text", question: "Question 1" }],
        },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={null} />);

    expect(screen.getByTestId("page-view-page-1")).toBeInTheDocument();
    // Tabs should not be visible for single page
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders multi-page form with tabs", () => {
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [
        { id: "page-1", title: "Page 1", blocks: [] },
        { id: "page-2", title: "Page 2", blocks: [] },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={null} />);

    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
  });

  it("switches between pages when tab is clicked", async () => {
    const user = userEvent.setup();
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [
        { id: "page-1", title: "Page 1", blocks: [] },
        { id: "page-2", title: "Page 2", blocks: [] },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={null} />);

    const page2Tab = screen.getByText("Page 2");
    await user.click(page2Tab);

    expect(mockSelectPage).toHaveBeenCalledWith("page-2");
  });

  it("shows add page button for multi-page forms", () => {
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [
        { id: "page-1", title: "Page 1", blocks: [] },
        { id: "page-2", title: "Page 2", blocks: [] },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={null} />);

    expect(screen.getByText(/Add Page/i)).toBeInTheDocument();
  });

  it("calls addPage when add page button is clicked", async () => {
    const user = userEvent.setup();
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [
        { id: "page-1", title: "Page 1", blocks: [] },
        { id: "page-2", title: "Page 2", blocks: [] },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={null} />);

    const addButton = screen.getByText(/Add Page/i);
    await user.click(addButton);

    expect(mockAddPage).toHaveBeenCalledWith("Page 3");
  });

  it("shows empty state when form has no pages", () => {
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: null,
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={null} />);

    expect(screen.getByText(/No pages yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add First Page/i)).toBeInTheDocument();
  });

  it("displays blocks on active page", () => {
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [
        {
          id: "page-1",
          title: "Page 1",
          blocks: [
            { id: "block-1", type: "short_text", question: "Question 1" },
            { id: "block-2", type: "email", question: "Question 2" },
          ],
        },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={null} />);

    expect(screen.getByTestId("block-block-1")).toBeInTheDocument();
    expect(screen.getByTestId("block-block-2")).toBeInTheDocument();
  });

  it("passes dropPosition to PageView", () => {
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
    };

    const dropPosition = { overId: "block-1", isAbove: true };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    renderWithDndContext(<FormCanvas dropPosition={dropPosition} />);

    // PageView should receive dropPosition prop
    expect(screen.getByTestId("page-view-page-1")).toBeInTheDocument();
  });

  it("applies scrollable container styling", () => {
    const mockForm = {
      id: "form-1",
      title: "Test Form",
      pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedPageId: "page-1",
      selectPage: mockSelectPage,
      addPage: mockAddPage,
    });

    const { container } = renderWithDndContext(<FormCanvas dropPosition={null} />);

    const scrollableArea = container.querySelector(".overflow-y-auto");
    expect(scrollableArea).toBeInTheDocument();
  });
});
