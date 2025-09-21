import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LongTextBlock } from "../long-text-block";
import { Block } from "@skemya/contracts";

// Mock UI components
jest.mock("@skemya/ui", () => ({
  Label: ({ children, className, onClick, htmlFor }: any) => (
    <label className={className} onClick={onClick} htmlFor={htmlFor}>
      {children}
    </label>
  ),
  Textarea: ({ id, placeholder, disabled, className, rows }: any) => (
    <textarea
      id={id}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      rows={rows}
    />
  ),
}));

describe("LongTextBlock", () => {
  const mockOnUpdate = jest.fn();

  const defaultBlock: Block = {
    id: "test-long-text",
    type: "long_text",
    question: "Please provide detailed feedback",
    description: "We value your opinion",
    helpText: "Be as detailed as possible",
    placeholder: "Your detailed answer here...",
    required: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with question and metadata", () => {
    render(<LongTextBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    expect(screen.getByText("Please provide detailed feedback")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument(); // Required indicator
    expect(screen.getByText("We value your opinion")).toBeInTheDocument();
    expect(screen.getByText("Be as detailed as possible")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your detailed answer here...")).toBeInTheDocument();
  });

  it("renders textarea with correct attributes", () => {
    render(<LongTextBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("id", "test-long-text");
    expect(textarea).toHaveAttribute("rows", "4");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass("w-full min-h-[120px]");
  });

  it("applies selected styling when isSelected is true", () => {
    render(<LongTextBlock block={defaultBlock} isSelected={true} onUpdate={mockOnUpdate} />);

    const container = screen.getByText("Please provide detailed feedback").closest("div")
      ?.parentElement?.parentElement;
    expect(container?.className).toContain("ring-2 ring-primary");
  });

  it("does not apply selected styling when isSelected is false", () => {
    render(<LongTextBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const container = screen.getByText("Please provide detailed feedback").closest("div")
      ?.parentElement?.parentElement;
    expect(container?.className).not.toContain("ring-2 ring-primary");
  });

  it("enters edit mode when clicking on question", async () => {
    const user = userEvent.setup();

    render(<LongTextBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const questionLabel = screen.getByText("Please provide detailed feedback");
    await user.click(questionLabel);

    // Should show input field
    const input = screen.getByDisplayValue("Please provide detailed feedback");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("updates question on blur", async () => {
    const user = userEvent.setup();

    render(<LongTextBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const questionLabel = screen.getByText("Please provide detailed feedback");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Please provide detailed feedback");
    await user.clear(input);
    await user.type(input, "New long text question");
    await user.tab(); // Blur the input

    expect(mockOnUpdate).toHaveBeenCalledWith({ question: "New long text question" });
  });

  it("updates question on Enter key", async () => {
    const user = userEvent.setup();

    render(<LongTextBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const questionLabel = screen.getByText("Please provide detailed feedback");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Please provide detailed feedback");
    await user.clear(input);
    await user.type(input, "New long text question");
    await user.keyboard("{Enter}");

    expect(mockOnUpdate).toHaveBeenCalledWith({ question: "New long text question" });
  });

  it("renders without description when not provided", () => {
    const blockWithoutDescription = {
      ...defaultBlock,
      description: undefined,
    };

    render(
      <LongTextBlock block={blockWithoutDescription} isSelected={false} onUpdate={mockOnUpdate} />
    );

    expect(screen.queryByText("We value your opinion")).not.toBeInTheDocument();
  });

  it("renders without help text when not provided", () => {
    const blockWithoutHelpText = {
      ...defaultBlock,
      helpText: undefined,
    };

    render(
      <LongTextBlock block={blockWithoutHelpText} isSelected={false} onUpdate={mockOnUpdate} />
    );

    expect(screen.queryByText("Be as detailed as possible")).not.toBeInTheDocument();
  });

  it("renders without required indicator when not required", () => {
    const blockNotRequired = {
      ...defaultBlock,
      required: false,
    };

    render(<LongTextBlock block={blockNotRequired} isSelected={false} onUpdate={mockOnUpdate} />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("uses default question when block.question is empty", () => {
    const blockWithoutQuestion = {
      ...defaultBlock,
      question: "",
    };

    render(
      <LongTextBlock block={blockWithoutQuestion} isSelected={false} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByText("Long text question")).toBeInTheDocument();
  });

  it("uses default placeholder when not provided", () => {
    const blockWithoutPlaceholder = {
      ...defaultBlock,
      placeholder: undefined,
    };

    render(
      <LongTextBlock block={blockWithoutPlaceholder} isSelected={false} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByPlaceholderText("Type your answer here...")).toBeInTheDocument();
  });

  it("handles onUpdate not being provided", async () => {
    const user = userEvent.setup();

    render(<LongTextBlock block={defaultBlock} isSelected={false} />);

    const questionLabel = screen.getByText("Please provide detailed feedback");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Please provide detailed feedback");
    await user.clear(input);
    await user.type(input, "New question");
    await user.tab(); // Blur the input

    // Should not throw error
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it("maintains question state during editing", async () => {
    const user = userEvent.setup();

    render(<LongTextBlock block={defaultBlock} isSelected={false} onUpdate={mockOnUpdate} />);

    const questionLabel = screen.getByText("Please provide detailed feedback");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Please provide detailed feedback");
    await user.type(input, " - updated");

    // Should show the updated value while typing
    expect(
      screen.getByDisplayValue("Please provide detailed feedback - updated")
    ).toBeInTheDocument();
  });
});
