import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateBlock } from "../date-block";
import type { Block } from "../types";

describe("DateBlock", () => {
  const defaultBlock: Block = {
    id: "test-date-block",
    type: "date",
    question: "Select a date",
    placeholder: "Pick a date",
    required: true,
  };

  it("renders the date block with question", () => {
    render(<DateBlock block={defaultBlock} />);
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });

  it("renders date input with correct type", () => {
    const { container } = render(<DateBlock block={defaultBlock} />);
    const input = container.querySelector('input[type="date"]');
    expect(input).toBeInTheDocument();
  });

  it("shows required indicator", () => {
    render(<DateBlock block={defaultBlock} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    const blockWithDescription = {
      ...defaultBlock,
      description: "Choose your preferred date",
    };
    render(<DateBlock block={blockWithDescription} />);
    expect(screen.getByText("Choose your preferred date")).toBeInTheDocument();
  });

  it("renders help text when provided", () => {
    const blockWithHelp = {
      ...defaultBlock,
      helpText: "Format: MM/DD/YYYY",
    };
    render(<DateBlock block={blockWithHelp} />);
    expect(screen.getByText("Format: MM/DD/YYYY")).toBeInTheDocument();
  });

  it("renders date input without placeholder", () => {
    const blockWithoutPlaceholder = { ...defaultBlock, placeholder: undefined };
    const { container } = render(<DateBlock block={blockWithoutPlaceholder} />);
    const input = container.querySelector('input[type="date"]');
    expect(input).toBeInTheDocument();
  });

  it("updates question when edited", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<DateBlock block={defaultBlock} onUpdate={onUpdate} />);

    const questionLabel = screen.getByText("Select a date");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Select a date");
    await user.clear(input);
    await user.type(input, "Choose birth date");
    await user.keyboard("{Enter}");

    expect(onUpdate).toHaveBeenCalledWith({ question: "Choose birth date" });
  });

  it("applies selected styles when selected", () => {
    const { container } = render(<DateBlock block={defaultBlock} isSelected />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("ring-2", "ring-primary");
  });

  it("renders with default question when none provided", () => {
    const blockWithoutQuestion = { ...defaultBlock, question: "" };
    render(<DateBlock block={blockWithoutQuestion} />);
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });

  it("handles min and max date constraints", () => {
    const blockWithConstraints = {
      ...defaultBlock,
      validation: [
        { type: "min" as const, value: "2024-01-01" },
        { type: "max" as const, value: "2024-12-31" },
      ],
    };
    const { container } = render(<DateBlock block={blockWithConstraints} />);
    const input = container.querySelector('input[type="date"]');
    expect(input).toHaveAttribute("min", "2024-01-01");
    expect(input).toHaveAttribute("max", "2024-12-31");
  });
});
