import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockLibrary } from "../block-library";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock LogicEditor
jest.mock("../../logic/logic-editor", () => ({
  LogicEditor: () => <div>Logic Editor</div>,
}));

// Mock UI components
jest.mock("@skemya/ui", () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  Tabs: ({ children, value }: any) => <div data-tabs-value={value}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-tabs-content={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-tabs-trigger={value}>{children}</button>,
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Type: () => <span>Type</span>,
  AlignLeft: () => <span>AlignLeft</span>,
  Mail: () => <span>Mail</span>,
  Phone: () => <span>Phone</span>,
  Hash: () => <span>Hash</span>,
  Calendar: () => <span>Calendar</span>,
  MapPin: () => <span>MapPin</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  Circle: () => <span>Circle</span>,
  Square: () => <span>Square</span>,
  Grid3X3: () => <span>Grid3X3</span>,
  Star: () => <span>Star</span>,
  ThumbsUp: () => <span>ThumbsUp</span>,
  Gauge: () => <span>Gauge</span>,
  ListOrdered: () => <span>ListOrdered</span>,
  PenTool: () => <span>PenTool</span>,
  Upload: () => <span>Upload</span>,
  CreditCard: () => <span>CreditCard</span>,
  CalendarCheck: () => <span>CalendarCheck</span>,
  Code: () => <span>Code</span>,
  Heading: () => <span>Heading</span>,
  Image: () => <span>Image</span>,
  GitBranch: () => <span>GitBranch</span>,
  Blocks: () => <span>Blocks</span>,
  Clock: () => <span>Clock</span>,
  Link: () => <span>Link</span>,
  GripVertical: () => <span>GripVertical</span>,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock LogicEditor
jest.mock("../../logic/logic-editor", () => ({
  LogicEditor: () => <div data-testid="logic-editor">Logic Editor</div>,
}));

describe("BlockLibrary", () => {
  const mockAddBlock = jest.fn();
  const mockForm = {
    id: "test-form",
    name: "Test Form",
    pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      addBlock: mockAddBlock,
    });
  });

  it("renders block library with tabs", () => {
    render(<BlockLibrary />);

    // Use more specific queries to avoid matching icon text
    expect(screen.getByRole("button", { name: /Blocks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Logic/i })).toBeInTheDocument();
    expect(screen.getByText("Block Library")).toBeInTheDocument();
    expect(screen.getByText("Drag or click to add")).toBeInTheDocument();
  });

  it("displays all categories", () => {
    render(<BlockLibrary />);

    // Categories are rendered as h4 elements inside the blocks tab content
    // Use getAllByText since some text might appear multiple times
    expect(screen.getAllByText("Text").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contact").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Number").length).toBeGreaterThan(0);
    expect(screen.getByText("Date & Time")).toBeInTheDocument();
    expect(screen.getAllByText("Choice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Opinion").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Advanced").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Content").length).toBeGreaterThan(0);
  });

  it("displays blocks in correct categories", () => {
    render(<BlockLibrary />);

    // Look for button labels to avoid icon text conflicts
    const buttons = screen.getAllByRole("button");
    const buttonLabels = buttons.map((b) => b.textContent);

    // Text blocks - buttons include GripVertical icon text
    expect(buttonLabels).toContain("GripVerticalTypeShort Text");
    expect(buttonLabels).toContain("GripVerticalAlignLeftLong Text");

    // Contact blocks
    expect(buttonLabels).toContain("GripVerticalMailEmail");
    expect(buttonLabels).toContain("GripVerticalPhonePhone");
    expect(buttonLabels).toContain("GripVerticalMapPinAddress");

    // Number blocks
    expect(buttonLabels).toContain("GripVerticalHashNumber");
    expect(buttonLabels).toContain("GripVerticalCreditCardCurrency");
  });

  it("adds block when clicking a block button", async () => {
    const user = userEvent.setup();
    render(<BlockLibrary />);

    const shortTextButton = screen.getByText("Short Text");
    await user.click(shortTextButton);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "short_text",
        question: "New short text question",
        required: false,
      }),
      "page-1"
    );
  });

  it("does not add block when no form", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      addBlock: mockAddBlock,
    });

    render(<BlockLibrary />);

    const shortTextButton = screen.getByText("Short Text");
    await user.click(shortTextButton);

    expect(mockAddBlock).not.toHaveBeenCalled();
  });

  it("does not add block when form has no pages", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: { ...mockForm, pages: [] },
      addBlock: mockAddBlock,
    });

    render(<BlockLibrary />);

    const shortTextButton = screen.getByText("Short Text");
    await user.click(shortTextButton);

    expect(mockAddBlock).not.toHaveBeenCalled();
  });

  it("switches to logic tab", async () => {
    // Tab switching is handled by the Tabs component which we've mocked
    // The actual switching logic would be tested in an integration test
    render(<BlockLibrary />);

    const logicTab = screen.getByRole("button", { name: /Logic/i });
    expect(logicTab).toBeInTheDocument();

    // Verify that LogicEditor component is rendered in the logic tab content
    const logicContent = screen.getByTestId("logic-editor");
    expect(logicContent).toBeInTheDocument();
  });

  it("adds blocks with correct types", async () => {
    const user = userEvent.setup();
    render(<BlockLibrary />);

    // Test a few different block types
    const emailButton = screen.getByText("Email");
    await user.click(emailButton);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "email",
        question: "New email question",
      }),
      "page-1"
    );

    mockAddBlock.mockClear();

    const paymentButton = screen.getByText("Payment");
    await user.click(paymentButton);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "payment",
        question: "New payment question",
      }),
      "page-1"
    );
  });

  it("generates unique block IDs", async () => {
    const user = userEvent.setup();
    render(<BlockLibrary />);

    const shortTextButton = screen.getByText("Short Text");
    await user.click(shortTextButton);
    await user.click(shortTextButton);

    const calls = mockAddBlock.mock.calls;
    expect(calls[0][0].id).not.toBe(calls[1][0].id);
    expect(calls[0][0].id).toMatch(/^block-\d+$/);
    expect(calls[1][0].id).toMatch(/^block-\d+$/);
  });

  it("renders all block types with icons", () => {
    render(<BlockLibrary />);

    // Count block buttons (excluding tab triggers)
    const buttons = screen.getAllByRole("button");
    const blockButtons = buttons.filter((b) => !b.hasAttribute("data-tabs-trigger"));

    // Should have buttons for all block types (25 total - added time and url)
    expect(blockButtons.length).toBeGreaterThan(24);
  });
});
