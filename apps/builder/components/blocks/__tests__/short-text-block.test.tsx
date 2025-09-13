import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortTextBlock } from "../short-text-block";
import type { Block } from "../types";

describe("ShortTextBlock", () => {
  const defaultBlock: Block = {
    id: "test-block",
    type: "short_text",
    question: "What is your name?",
    placeholder: "Enter your name",
    required: false,
  };

  it("renders the block with question", () => {
    render(<ShortTextBlock block={defaultBlock} />);
    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
  });

  it("shows required indicator when required", () => {
    const requiredBlock = { ...defaultBlock, required: true };
    render(<ShortTextBlock block={requiredBlock} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    const blockWithDescription = {
      ...defaultBlock,
      description: "Please enter your full name",
    };
    render(<ShortTextBlock block={blockWithDescription} />);
    expect(screen.getByText("Please enter your full name")).toBeInTheDocument();
  });

  it("renders help text when provided", () => {
    const blockWithHelp = {
      ...defaultBlock,
      helpText: "First and last name",
    };
    render(<ShortTextBlock block={blockWithHelp} />);
    expect(screen.getByText("First and last name")).toBeInTheDocument();
  });

  it("uses default placeholder when not provided", () => {
    const blockWithoutPlaceholder = { ...defaultBlock, placeholder: undefined };
    render(<ShortTextBlock block={blockWithoutPlaceholder} />);
    expect(screen.getByPlaceholderText("Type your answer here...")).toBeInTheDocument();
  });

  it("enters edit mode when clicking on question", async () => {
    const user = userEvent.setup();
    render(<ShortTextBlock block={defaultBlock} />);

    const questionLabel = screen.getByText("What is your name?");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("What is your name?");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("updates question on blur", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ShortTextBlock block={defaultBlock} onUpdate={onUpdate} />);

    const questionLabel = screen.getByText("What is your name?");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("What is your name?");
    await user.clear(input);
    await user.type(input, "What is your email?");

    fireEvent.blur(input);

    expect(onUpdate).toHaveBeenCalledWith({ question: "What is your email?" });
  });

  it("updates question on Enter key", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ShortTextBlock block={defaultBlock} onUpdate={onUpdate} />);

    const questionLabel = screen.getByText("What is your name?");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("What is your name?");
    await user.clear(input);
    await user.type(input, "New question");
    await user.keyboard("{Enter}");

    expect(onUpdate).toHaveBeenCalledWith({ question: "New question" });
  });

  it("applies selected styles when selected", () => {
    const { container } = render(<ShortTextBlock block={defaultBlock} isSelected />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("ring-2", "ring-primary");
  });

  it("renders default question when none provided", () => {
    const blockWithoutQuestion = { ...defaultBlock, question: "" };
    render(<ShortTextBlock block={blockWithoutQuestion} />);
    expect(screen.getByText("Short text question")).toBeInTheDocument();
  });
});
