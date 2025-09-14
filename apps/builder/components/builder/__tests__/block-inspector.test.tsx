import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockInspector } from "../block-inspector";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock crypto.randomUUID
Object.defineProperty(global.crypto, "randomUUID", {
  value: jest.fn(() => `uuid-${Date.now()}`),
  writable: true,
});

// Mock UI components
jest.mock("@forms/ui", () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Input: ({ value, onChange, placeholder, id }: any) => (
    <input id={id} value={value} onChange={onChange} placeholder={placeholder} />
  ),
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
  Select: ({ children, defaultValue, onValueChange }: any) => (
    <select defaultValue={defaultValue} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, id }: any) => <>{children}</>,
  SelectValue: () => null,
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div data-tab-content={value} data-testid={`tab-content-${value}`} className={className}>
      {children}
    </div>
  ),
  Textarea: ({ value, onChange, placeholder, id, rows }: any) => (
    <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
  ),
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Plus: () => <span>Plus</span>,
}));

describe("BlockInspector", () => {
  const mockUpdateBlock = jest.fn();

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
            type: "text",
            question: "What is your name?",
            description: "Please enter your full name",
            required: true,
            helpText: "First and last name",
            placeholder: "John Doe",
            key: "name_field",
            defaultValue: "",
          },
          {
            id: "block-2",
            type: "select",
            question: "Choose an option",
            options: [
              { id: "opt1", label: "Option 1", value: "option_1" },
              { id: "opt2", label: "Option 2", value: "option_2" },
            ],
          },
          {
            id: "block-3",
            type: "checkbox_group",
            question: "Select multiple",
            options: [
              { id: "cb1", label: "Choice 1", value: "choice_1" },
              { id: "cb2", label: "Choice 2", value: "choice_2" },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows not found message when block doesn't exist", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="non-existent" />);

    expect(screen.getByText("Block not found")).toBeInTheDocument();
  });

  it("renders field tab content", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    // Field tab content should be visible
    const fieldTab = screen.getByTestId("tab-content-field");
    expect(fieldTab).toBeInTheDocument();

    expect(screen.getByLabelText("Question")).toBeInTheDocument();
    expect(screen.getByDisplayValue("What is your name?")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Please enter your full name")).toBeInTheDocument();
    expect(screen.getByText("Required field")).toBeInTheDocument();
    expect(screen.getByLabelText("Help text")).toBeInTheDocument();
    expect(screen.getByDisplayValue("First and last name")).toBeInTheDocument();
  });

  it("updates question text", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

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
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const descInput = screen.getByDisplayValue("Please enter your full name");
    await user.type(descInput, "!");

    expect(mockUpdateBlock).toHaveBeenLastCalledWith("block-1", {
      description: "Please enter your full name!",
    });
  });

  it("toggles required field", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    // Find checkbox by its label
    const requiredLabel = screen.getByText("Required field");
    const requiredSwitch = requiredLabel.parentElement?.querySelector('input[type="checkbox"]');
    await user.click(requiredSwitch!);

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", { required: false });
  });

  it("updates help text", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const helpTextInput = screen.getByDisplayValue("First and last name");
    await user.type(helpTextInput, "!");

    expect(mockUpdateBlock).toHaveBeenLastCalledWith("block-1", {
      helpText: "First and last name!",
    });
  });

  it("shows options for select blocks", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-2" />);

    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Add option")).toBeInTheDocument();
  });

  it("updates option label", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-2" />);

    const option1Input = screen.getByDisplayValue("Option 1");
    await user.type(option1Input, "!");

    expect(mockUpdateBlock).toHaveBeenLastCalledWith("block-2", {
      options: [
        { id: "opt1", label: "Option 1!", value: "option_1" },
        { id: "opt2", label: "Option 2", value: "option_2" },
      ],
    });
  });

  it("adds new option", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-2" />);

    const addButton = screen.getByText("Add option");
    await user.click(addButton);

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-2", {
      options: [
        { id: "opt1", label: "Option 1", value: "option_1" },
        { id: "opt2", label: "Option 2", value: "option_2" },
        expect.objectContaining({
          id: expect.any(String),
          label: "Option 3",
          value: "option_3",
        }),
      ],
    });
  });

  it("shows options for checkbox_group blocks", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-3" />);

    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Choice 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Choice 2")).toBeInTheDocument();
  });

  it("renders logic tab content", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const logicTab = screen.getByTestId("tab-content-logic");
    expect(logicTab).toBeInTheDocument();

    expect(screen.getByText("Visibility Conditions")).toBeInTheDocument();
    expect(
      screen.getByText("Show or hide this field based on previous answers")
    ).toBeInTheDocument();
    expect(screen.getByText("Skip Logic")).toBeInTheDocument();
    expect(screen.getByText("Jump to a different page based on the answer")).toBeInTheDocument();
  });

  it("renders design tab content", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const designTab = screen.getByTestId("tab-content-design");
    expect(designTab).toBeInTheDocument();

    expect(screen.getByText("Field width")).toBeInTheDocument();
    expect(screen.getByLabelText("Placeholder text")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Custom CSS classes")).toBeInTheDocument();
  });

  it("updates placeholder text", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const placeholderInput = screen.getByDisplayValue("John Doe");
    await user.type(placeholderInput, "!");

    expect(mockUpdateBlock).toHaveBeenLastCalledWith("block-1", {
      placeholder: "John Doe!",
    });
  });

  it("renders data tab content", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const dataTab = screen.getByTestId("tab-content-data");
    expect(dataTab).toBeInTheDocument();

    expect(screen.getByLabelText("Field key")).toBeInTheDocument();
    expect(screen.getByDisplayValue("name_field")).toBeInTheDocument();
    expect(screen.getByLabelText("Default value")).toBeInTheDocument();
    expect(screen.getByText("Contains PII")).toBeInTheDocument();
    expect(screen.getByText("Exclude from analytics")).toBeInTheDocument();
    expect(screen.getByLabelText("Internal notes")).toBeInTheDocument();
  });

  it("updates field key", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const fieldKeyInput = screen.getByDisplayValue("name_field");
    await user.type(fieldKeyInput, "!");

    expect(mockUpdateBlock).toHaveBeenLastCalledWith("block-1", {
      key: "name_field!",
    });
  });

  it("updates default value", async () => {
    const user = userEvent.setup();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    const defaultValueInput = screen.getByLabelText("Default value");
    // Since the initial value is empty, just type a simple string
    await user.type(defaultValueInput, "Test");

    // Since userEvent.type triggers onChange for each character
    // We expect at least one call
    expect(mockUpdateBlock).toHaveBeenCalled();

    // We should have been called with block-1 and some defaultValue
    const defaultValueCalls = mockUpdateBlock.mock.calls.filter(
      (call) => call[0] === "block-1" && call[1]?.defaultValue !== undefined
    );

    expect(defaultValueCalls.length).toBeGreaterThan(0);

    // At least one call should have some part of our test string
    const hasValidCall = defaultValueCalls.some((call) =>
      ["T", "e", "s", "t", "Te", "Tes", "Test"].includes(call[1].defaultValue)
    );
    expect(hasValidCall).toBe(true);
  });

  it("handles blocks without options", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    // Options section should not be visible for non-select blocks
    expect(screen.queryByText("Options")).not.toBeInTheDocument();
  });

  it("shows field key as block id when key is not set", () => {
    const blockWithoutKey = {
      id: "block-no-key",
      type: "text",
      question: "Test question",
    };

    const formWithBlock = {
      ...mockForm,
      pages: [{ ...mockForm.pages[0], blocks: [blockWithoutKey] }],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: formWithBlock,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-no-key" />);

    const fieldKeyInput = screen.getByLabelText("Field key");
    expect(fieldKeyInput).toHaveValue("block-no-key");
  });

  it("handles blocks across multiple pages", () => {
    const multiPageForm = {
      ...mockForm,
      pages: [
        {
          id: "page-1",
          title: "Page 1",
          blocks: [{ id: "block-1", type: "text", question: "Q1" }],
        },
        {
          id: "page-2",
          title: "Page 2",
          blocks: [{ id: "block-2", type: "text", question: "Q2" }],
        },
      ],
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: multiPageForm,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    // Should find block on page 2
    render(<BlockInspector blockId="block-2" />);

    expect(screen.getByDisplayValue("Q2")).toBeInTheDocument();
  });

  it("shows not found when form is null", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      updateBlock: mockUpdateBlock,
      validationErrors: [],
      getExistingKeys: jest.fn(() => new Set(["existing_key"])),
    });

    render(<BlockInspector blockId="block-1" />);

    expect(screen.getByText("Block not found")).toBeInTheDocument();
  });
});
