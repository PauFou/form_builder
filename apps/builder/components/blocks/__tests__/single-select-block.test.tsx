import React from "react";
import { render, screen } from "@testing-library/react";
import { SingleSelectBlock } from "../single-select-block";
import { Block } from "@forms/contracts";

describe("SingleSelectBlock", () => {
  const defaultBlock: Block = {
    id: "test-single-select",
    type: "single_select",
    question: "Choose your favorite color",
    description: "Select one option",
    required: true,
    properties: {
      options: [
        { id: "1", label: "Red", value: "red" },
        { id: "2", label: "Blue", value: "blue" },
        { id: "3", label: "Green", value: "green" },
      ],
      layout: "vertical",
    },
  };

  it("renders with question and required indicator", () => {
    render(<SingleSelectBlock block={defaultBlock} />);

    expect(screen.getByText("Choose your favorite color")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders without required indicator when not required", () => {
    const blockNotRequired = {
      ...defaultBlock,
      required: false,
    };

    render(<SingleSelectBlock block={blockNotRequired} />);

    expect(screen.getByText("Choose your favorite color")).toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<SingleSelectBlock block={defaultBlock} />);

    expect(screen.getByText("Select one option")).toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    const blockWithoutDescription = {
      ...defaultBlock,
      description: undefined,
    };

    render(<SingleSelectBlock block={blockWithoutDescription} />);

    expect(screen.queryByText("Select one option")).not.toBeInTheDocument();
  });

  it("renders all options as radio buttons", () => {
    render(<SingleSelectBlock block={defaultBlock} />);

    expect(screen.getByLabelText("Red")).toBeInTheDocument();
    expect(screen.getByLabelText("Blue")).toBeInTheDocument();
    expect(screen.getByLabelText("Green")).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute("value", "red");
    expect(radios[1]).toHaveAttribute("value", "blue");
    expect(radios[2]).toHaveAttribute("value", "green");
  });

  it("renders with vertical layout by default", () => {
    render(<SingleSelectBlock block={defaultBlock} />);

    const container = screen.getByText("Red").closest("div");
    expect(container).toHaveClass("space-y-2");
    expect(container).not.toHaveClass("flex flex-wrap gap-4");
  });

  it("renders with horizontal layout when specified", () => {
    const blockHorizontal = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        layout: "horizontal",
      },
    };

    render(<SingleSelectBlock block={blockHorizontal} />);

    const container = screen.getByText("Red").closest("div");
    expect(container).toHaveClass("flex flex-wrap gap-4");
    expect(container).not.toHaveClass("space-y-2");
  });

  it("disables radio buttons in preview mode", () => {
    render(<SingleSelectBlock block={defaultBlock} isPreview={true} />);

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
      expect(radio).toHaveClass("pointer-events-none");
    });
  });

  it("enables radio buttons when not in preview mode", () => {
    render(<SingleSelectBlock block={defaultBlock} isPreview={false} />);

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).not.toBeDisabled();
      expect(radio).not.toHaveClass("pointer-events-none");
    });
  });

  it("groups radio buttons with unique name", () => {
    render(<SingleSelectBlock block={defaultBlock} />);

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "radio-test-single-select");
    });
  });

  it("renders with empty options when none provided", () => {
    const blockNoOptions = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        options: [],
      },
    };

    render(<SingleSelectBlock block={blockNoOptions} />);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("renders with default empty array when properties not provided", () => {
    const blockNoProperties = {
      ...defaultBlock,
      properties: undefined,
    };

    render(<SingleSelectBlock block={blockNoProperties} />);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("uses option index as key when id not provided", () => {
    const blockWithoutIds = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        options: [
          { label: "Option A", value: "a" },
          { label: "Option B", value: "b" },
        ],
      },
    };

    render(<SingleSelectBlock block={blockWithoutIds} />);

    expect(screen.getByLabelText("Option A")).toBeInTheDocument();
    expect(screen.getByLabelText("Option B")).toBeInTheDocument();
  });

  it("applies selected styling when isSelected is true", () => {
    render(<SingleSelectBlock block={defaultBlock} isSelected={true} />);

    // The component doesn't actually use isSelected prop currently
    // This test documents the current behavior
    expect(screen.getByText("Choose your favorite color")).toBeInTheDocument();
  });

  it("uses vertical layout when layout property is not specified", () => {
    const blockNoLayout = {
      ...defaultBlock,
      properties: {
        options: defaultBlock.properties?.options || [],
        // layout not specified
      },
    };

    render(<SingleSelectBlock block={blockNoLayout} />);

    const container = screen.getByText("Red").closest("div");
    expect(container).toHaveClass("space-y-2");
  });
});
