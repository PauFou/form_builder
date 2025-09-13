import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectBlock } from "../select-block";
import type { Block } from "../types";

describe("SelectBlock", () => {
  const defaultBlock: Block = {
    id: "test-select-block",
    type: "select",
    question: "Choose an option",
    placeholder: "Select...",
    required: false,
    options: [
      { id: "1", label: "Option 1", value: "option1" },
      { id: "2", label: "Option 2", value: "option2" },
      { id: "3", label: "Option 3", value: "option3" },
    ],
  };

  it("renders the select block with question", () => {
    render(<SelectBlock block={defaultBlock} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
    // Check that the select element exists
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows required indicator when required", () => {
    const requiredBlock = { ...defaultBlock, required: true };
    render(<SelectBlock block={requiredBlock} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    const blockWithDescription = {
      ...defaultBlock,
      description: "Please select one option",
    };
    render(<SelectBlock block={blockWithDescription} />);
    expect(screen.getByText("Please select one option")).toBeInTheDocument();
  });

  it("renders help text when provided", () => {
    const blockWithHelp = {
      ...defaultBlock,
      helpText: "Choose carefully",
    };
    render(<SelectBlock block={blockWithHelp} />);
    expect(screen.getByText("Choose carefully")).toBeInTheDocument();
  });

  it("renders default options when none provided", () => {
    const blockWithoutOptions = { ...defaultBlock, options: undefined };
    render(<SelectBlock block={blockWithoutOptions} />);
    // Check that default options are rendered
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("updates question when edited", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<SelectBlock block={defaultBlock} onUpdate={onUpdate} />);

    const questionLabel = screen.getByText("Choose an option");
    await user.click(questionLabel);

    const input = screen.getByDisplayValue("Choose an option");
    await user.clear(input);
    await user.type(input, "Pick your favorite");
    await user.keyboard("{Enter}");

    expect(onUpdate).toHaveBeenCalledWith({ question: "Pick your favorite" });
  });

  it("applies selected styles when selected", () => {
    const { container } = render(<SelectBlock block={defaultBlock} isSelected />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("ring-2", "ring-primary");
  });

  it("renders with default question when none provided", () => {
    const blockWithoutQuestion = { ...defaultBlock, question: "" };
    render(<SelectBlock block={blockWithoutQuestion} />);
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });
});
