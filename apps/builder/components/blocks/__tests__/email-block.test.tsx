import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailBlock } from "../email-block";
import type { Block } from "../types";

describe("EmailBlock", () => {
  const defaultBlock: Block = {
    id: "test-email-block",
    type: "email",
    question: "What is your email?",
    placeholder: "john@example.com",
    required: true,
  };

  it("renders the email block with question", () => {
    render(<EmailBlock block={defaultBlock} />);
    expect(screen.getByText("What is your email?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("john@example.com")).toBeInTheDocument();
  });

  it("renders email input with correct type", () => {
    render(<EmailBlock block={defaultBlock} />);
    const input = screen.getByPlaceholderText("john@example.com");
    expect(input).toHaveAttribute("type", "email");
  });

  it("shows required indicator", () => {
    render(<EmailBlock block={defaultBlock} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    const blockWithDescription = {
      ...defaultBlock,
      description: "We'll never share your email",
    };
    render(<EmailBlock block={blockWithDescription} />);
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it("renders help text when provided", () => {
    const blockWithHelp = {
      ...defaultBlock,
      helpText: "Enter a valid email address",
    };
    render(<EmailBlock block={blockWithHelp} />);
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
  });

  it("uses default placeholder when not provided", () => {
    const blockWithoutPlaceholder = { ...defaultBlock, placeholder: undefined };
    render(<EmailBlock block={blockWithoutPlaceholder} />);
    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
  });

  it("updates question when edited", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<EmailBlock block={defaultBlock} onUpdate={onUpdate} />);

    const questionLabel = screen.getByText("What is your email?");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("What is your email?");
    await user.clear(input);
    await user.type(input, "Enter your email address");
    await user.keyboard("{Enter}");

    expect(onUpdate).toHaveBeenCalledWith({ question: "Enter your email address" });
  });

  it("applies selected styles when selected", () => {
    const { container } = render(<EmailBlock block={defaultBlock} isSelected />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("ring-2", "ring-primary");
  });
});
