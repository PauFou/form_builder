import React from "react";
import { render, screen } from "@testing-library/react";
import { NumberBlock } from "../number-block";
import type { Block } from "../types";

describe("NumberBlock", () => {
  const defaultBlock: Block = {
    id: "test-number-block",
    type: "number",
    question: "Enter a number",
    required: false,
    properties: {
      placeholder: "0",
      min: 0,
      max: 100,
      step: 1,
    },
  };

  it("renders the number block with question", () => {
    render(<NumberBlock block={defaultBlock} />);
    expect(screen.getByText("Enter a number")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0")).toBeInTheDocument();
  });

  it("renders number input with correct type", () => {
    render(<NumberBlock block={defaultBlock} />);
    const input = screen.getByPlaceholderText("0");
    expect(input).toHaveAttribute("type", "number");
  });

  it("shows required indicator when required", () => {
    const requiredBlock = { ...defaultBlock, required: true };
    render(<NumberBlock block={requiredBlock} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    const blockWithDescription = {
      ...defaultBlock,
      description: "Enter a value between 0 and 100",
    };
    render(<NumberBlock block={blockWithDescription} />);
    expect(screen.getByText("Enter a value between 0 and 100")).toBeInTheDocument();
  });

  it("uses default placeholder when not provided", () => {
    const blockWithoutPlaceholder = {
      ...defaultBlock,
      properties: {},
    };
    render(<NumberBlock block={blockWithoutPlaceholder} />);
    expect(screen.getByPlaceholderText("Enter a number")).toBeInTheDocument();
  });

  it("applies min and max constraints", () => {
    render(<NumberBlock block={defaultBlock} />);
    const input = screen.getByPlaceholderText("0");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
  });

  it("applies step attribute", () => {
    const blockWithStep = {
      ...defaultBlock,
      properties: {
        placeholder: "0",
        step: 0.5,
      },
    };
    render(<NumberBlock block={blockWithStep} />);
    const input = screen.getByPlaceholderText("0");
    expect(input).toHaveAttribute("step", "0.5");
  });

  it("renders with isSelected prop", () => {
    render(<NumberBlock block={defaultBlock} isSelected />);
    const input = screen.getByPlaceholderText("0");
    expect(input).toHaveClass("border-blue-500");
  });

  it("renders with isPreview prop", () => {
    render(<NumberBlock block={defaultBlock} isPreview />);
    const input = screen.getByPlaceholderText("0");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("pointer-events-none");
  });

  it("renders without question", () => {
    const blockWithoutQuestion = { ...defaultBlock, question: "" };
    const { container } = render(<NumberBlock block={blockWithoutQuestion} />);
    const questionSpan = container.querySelector(".text-sm.font-medium");
    expect(questionSpan).toHaveTextContent("");
  });

  it("renders without constraints when not provided", () => {
    const blockWithoutConstraints = {
      ...defaultBlock,
      properties: { placeholder: "0" },
    };
    render(<NumberBlock block={blockWithoutConstraints} />);
    const input = screen.getByPlaceholderText("0");
    expect(input).not.toHaveAttribute("min");
    expect(input).not.toHaveAttribute("max");
  });

  it("uses default step when not provided", () => {
    const blockWithoutStep = {
      ...defaultBlock,
      properties: { placeholder: "0" },
    };
    render(<NumberBlock block={blockWithoutStep} />);
    const input = screen.getByPlaceholderText("0");
    expect(input).toHaveAttribute("step", "1");
  });
});
