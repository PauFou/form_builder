import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockSettings } from "../block-settings";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock UI components
jest.mock("@forms/ui", () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Card: ({ children }: any) => <div>{children}</div>,
  Input: ({ value, onChange, placeholder, type, id }: any) => (
    <input
      id={id}
      type={type || "text"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
  Tabs: ({ children, defaultValue }: any) => <div data-default-tab={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-tab-content={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-tab={value}>{children}</button>,
  Textarea: ({ value, onChange, id, rows, placeholder }: any) => (
    <textarea id={id} value={value} onChange={onChange} rows={rows} placeholder={placeholder} />
  ),
}));

// Mock icons
jest.mock("lucide-react", () => ({
  X: () => <span>X</span>,
  Plus: () => <span>Plus</span>,
  Trash2: () => <span>Trash2</span>,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("BlockSettings", () => {
  const mockUpdateBlock = jest.fn();
  const mockSelectBlock = jest.fn();

  const mockForm = {
    id: "test-form",
    name: "Test Form",
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          {
            id: "block-1",
            type: "short_text",
            question: "What is your name?",
            description: "Please enter your full name",
            required: true,
            properties: { placeholder: "John Doe" },
          },
          {
            id: "block-2",
            type: "number",
            question: "What is your age?",
            required: false,
            properties: { step: 1 },
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows empty state when no block is selected", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: null,
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    expect(screen.getByText("Select a block to edit its settings")).toBeInTheDocument();
  });

  it("shows empty state when no form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    expect(screen.getByText("Select a block to edit its settings")).toBeInTheDocument();
  });

  it("renders block settings when block is selected", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    expect(screen.getByText("Block Settings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("What is your name?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Please enter your full name")).toBeInTheDocument();
  });

  it("updates question text", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    const questionInput = screen.getByDisplayValue("What is your name?");
    await user.type(questionInput, "!");

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
      question: "What is your name?!",
    });
  });

  it("updates description", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    const descInput = screen.getByDisplayValue("Please enter your full name");
    // Just type without clearing first - the onChange handler is called with the full value
    await user.type(descInput, "!");

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
      description: "Please enter your full name!",
    });
  });

  it("toggles required field", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    const requiredSwitch = screen.getByLabelText("Required");
    await user.click(requiredSwitch);

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", { required: false });
  });

  it("updates placeholder for text input", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    const placeholderInput = screen.getByDisplayValue("John Doe");
    // Simulate changing the value by typing
    await user.type(placeholderInput, "!");

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
      properties: { placeholder: "John Doe!" },
    });
  });

  it("closes settings when close button is clicked", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    const closeButton = screen.getByText("X").closest("button");
    await user.click(closeButton!);

    expect(mockSelectBlock).toHaveBeenCalledWith(null);
  });

  it("shows tabs for general, validation, and logic", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Validation")).toBeInTheDocument();
    expect(screen.getByText("Logic")).toBeInTheDocument();
  });

  it("shows number-specific settings for number block", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-2",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    expect(screen.getByLabelText("Step")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
  });

  it("updates number step", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-2",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    const stepInput = screen.getByLabelText("Step");
    // The onChange event fires on every character, so we'll check the last call
    await user.type(stepInput, "0");

    expect(mockUpdateBlock).toHaveBeenLastCalledWith("block-2", {
      properties: { step: 10 },
    });
  });

  it("shows currency-specific settings", () => {
    const currencyBlock = {
      id: "block-3",
      type: "currency",
      question: "Price",
      properties: { currency: "USD" },
    };

    const formWithCurrency = {
      ...mockForm,
      pages: [{ ...mockForm.pages[0], blocks: [...mockForm.pages[0].blocks, currencyBlock] }],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: formWithCurrency,
      selectedBlockId: "block-3",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    // Currency select has id="currency" not a label
    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByText("USD ($)")).toBeInTheDocument();
  });

  it("handles options for choice blocks", async () => {
    const user = userEvent.setup();
    const choiceBlock = {
      id: "block-4",
      type: "single_select",
      question: "Choose one",
      options: [
        { id: "opt1", label: "Option 1", value: "option_1" },
        { id: "opt2", label: "Option 2", value: "option_2" },
      ],
    };

    const formWithChoice = {
      ...mockForm,
      pages: [{ ...mockForm.pages[0], blocks: [choiceBlock] }],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: formWithChoice,
      selectedBlockId: "block-4",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    render(<BlockSettings />);

    expect(screen.getByDisplayValue("Option 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option 2")).toBeInTheDocument();

    // Add new option
    const addButton = screen.getByText("Add Option");
    await user.click(addButton);

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-4", {
      options: expect.arrayContaining([
        expect.objectContaining({ label: "Option 1" }),
        expect.objectContaining({ label: "Option 2" }),
        expect.objectContaining({ label: "", value: "option_3" }),
      ]),
    });
  });

  it("returns null when selected block not found", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "non-existent",
      selectBlock: mockSelectBlock,
      updateBlock: mockUpdateBlock,
    });

    const { container } = render(<BlockSettings />);
    expect(container.firstChild).toBeNull();
  });
});
