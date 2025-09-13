import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckboxGroupBlock } from "../checkbox-group-block";
import { Block } from "@forms/contracts";

// Mock UI components
jest.mock("@forms/ui", () => ({
  Label: ({ children, className, onClick }: any) => (
    <label className={className} onClick={onClick}>
      {children}
    </label>
  ),
  Checkbox: ({ id, disabled, defaultChecked }: any) => (
    <input type="checkbox" id={id} disabled={disabled} defaultChecked={defaultChecked} />
  ),
}));

describe("CheckboxGroupBlock", () => {
  const mockOnUpdate = jest.fn();

  const defaultBlock: Block = {
    id: "test-checkbox-group",
    type: "checkbox_group",
    question: "Which options apply?",
    description: "Select all that apply",
    helpText: "You can select multiple options",
    required: true,
    options: [
      { id: "opt1", label: "Option 1", value: "option1" },
      { id: "opt2", label: "Option 2", value: "option2" },
      { id: "opt3", label: "Option 3", value: "option3" },
    ],
    defaultValue: ["option1", "option3"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with question, options, and metadata", () => {
    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    expect(screen.getByText("Which options apply?")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument(); // Required indicator
    expect(screen.getByText("Select all that apply")).toBeInTheDocument();
    expect(screen.getByText("You can select multiple options")).toBeInTheDocument();

    // Check options
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("renders with default options when none provided", () => {
    const blockWithoutOptions = {
      ...defaultBlock,
      options: undefined,
    };

    render(
      <CheckboxGroupBlock block={blockWithoutOptions} isSelected={false} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("applies selected styling when isSelected is true", () => {
    render(<CheckboxGroupBlock block={defaultBlock} isSelected={true} onUpdate={mockOnUpdate} />);

    const container = screen.getByText("Which options apply?").closest("div")
      ?.parentElement?.parentElement;
    expect(container?.className).toContain("ring-2 ring-primary");
  });

  it("does not apply selected styling when isSelected is false", () => {
    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const container = screen.getByText("Which options apply?").closest("div")
      ?.parentElement?.parentElement;
    expect(container?.className).not.toContain("ring-2 ring-primary");
  });

  it("enters edit mode when clicking on question", async () => {
    const user = userEvent.setup();

    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const questionLabel = screen.getByText("Which options apply?");
    await user.click(questionLabel);

    // Should show input field
    const input = screen.getByDisplayValue("Which options apply?");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("updates question on blur", async () => {
    const user = userEvent.setup();

    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const questionLabel = screen.getByText("Which options apply?");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Which options apply?");
    await user.clear(input);
    await user.type(input, "New question");
    await user.tab(); // Blur the input

    expect(mockOnUpdate).toHaveBeenCalledWith({ question: "New question" });
  });

  it("updates question on Enter key", async () => {
    const user = userEvent.setup();

    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const questionLabel = screen.getByText("Which options apply?");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Which options apply?");
    await user.clear(input);
    await user.type(input, "New question");
    await user.keyboard("{Enter}");

    expect(mockOnUpdate).toHaveBeenCalledWith({ question: "New question" });
  });

  it("renders checkboxes with correct default values", () => {
    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);

    // Option 1 and 3 should be checked by default
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("renders all checkboxes as disabled", () => {
    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });
  });

  it("renders without description when not provided", () => {
    const blockWithoutDescription = {
      ...defaultBlock,
      description: undefined,
    };

    render(
      <CheckboxGroupBlock
        block={blockWithoutDescription}
        isSelected={false}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.queryByText("Select all that apply")).not.toBeInTheDocument();
  });

  it("renders without help text when not provided", () => {
    const blockWithoutHelpText = {
      ...defaultBlock,
      helpText: undefined,
    };

    render(
      <CheckboxGroupBlock block={blockWithoutHelpText} isSelected={false} onUpdate={mockOnUpdate} />
    );

    expect(screen.queryByText("You can select multiple options")).not.toBeInTheDocument();
  });

  it("renders without required indicator when not required", () => {
    const blockNotRequired = {
      ...defaultBlock,
      required: false,
    };

    render(
      <CheckboxGroupBlock block={blockNotRequired} isSelected={false} onUpdate={mockOnUpdate} />
    );

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("uses default question when block.question is empty", () => {
    const blockWithoutQuestion = {
      ...defaultBlock,
      question: "",
      description: "Choose multiple", // Change description to avoid duplicate text
    };

    render(
      <CheckboxGroupBlock block={blockWithoutQuestion} isSelected={false} onUpdate={mockOnUpdate} />
    );

    // The default question text should appear
    const questionElements = screen.getAllByText("Select all that apply");
    expect(questionElements.length).toBeGreaterThan(0);
  });

  it("handles onUpdate not being provided", async () => {
    const user = userEvent.setup();

    render(<CheckboxGroupBlock block={defaultBlock} isSelected={false} />);

    const questionLabel = screen.getByText("Which options apply?");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Which options apply?");
    await user.clear(input);
    await user.type(input, "New question");
    await user.tab(); // Blur the input

    // Should not throw error
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});
