import React from "react";
import { render, screen } from "@testing-library/react";
import { MultiSelectBlock } from "../multi-select-block";
import { Block } from "@forms/contracts";

describe("MultiSelectBlock", () => {
  const defaultBlock: Block = {
    id: "test-multi-select",
    type: "multi_select",
    question: "Select your skills",
    description: "Choose all that apply",
    required: true,
    properties: {
      options: [
        { id: "1", label: "JavaScript", value: "js" },
        { id: "2", label: "TypeScript", value: "ts" },
        { id: "3", label: "React", value: "react" },
        { id: "4", label: "Node.js", value: "node" },
      ],
      layout: "vertical",
      minSelections: 2,
      maxSelections: 3,
    },
  };

  it("renders with question and required indicator", () => {
    render(<MultiSelectBlock block={defaultBlock} />);

    expect(screen.getByText("Select your skills")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders without required indicator when not required", () => {
    const blockNotRequired = {
      ...defaultBlock,
      required: false,
    };

    render(<MultiSelectBlock block={blockNotRequired} />);

    expect(screen.getByText("Select your skills")).toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<MultiSelectBlock block={defaultBlock} />);

    expect(screen.getByText("Choose all that apply")).toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    const blockWithoutDescription = {
      ...defaultBlock,
      description: undefined,
    };

    render(<MultiSelectBlock block={blockWithoutDescription} />);

    expect(screen.queryByText("Choose all that apply")).not.toBeInTheDocument();
  });

  it("renders selection constraints when both min and max provided", () => {
    render(<MultiSelectBlock block={defaultBlock} />);

    expect(screen.getByText("Select 2 to 3 options")).toBeInTheDocument();
  });

  it("renders minimum selection constraint only", () => {
    const blockMinOnly = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        minSelections: 2,
        maxSelections: undefined,
      },
    };

    render(<MultiSelectBlock block={blockMinOnly} />);

    expect(screen.getByText("Select at least 2 options")).toBeInTheDocument();
  });

  it("renders minimum selection constraint with singular form", () => {
    const blockMinSingular = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        minSelections: 1,
        maxSelections: undefined,
      },
    };

    render(<MultiSelectBlock block={blockMinSingular} />);

    expect(screen.getByText("Select at least 1 option")).toBeInTheDocument();
  });

  it("renders maximum selection constraint only", () => {
    const blockMaxOnly = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        minSelections: undefined,
        maxSelections: 3,
      },
    };

    render(<MultiSelectBlock block={blockMaxOnly} />);

    expect(screen.getByText("Select up to 3 options")).toBeInTheDocument();
  });

  it("renders maximum selection constraint with singular form", () => {
    const blockMaxSingular = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        minSelections: undefined,
        maxSelections: 1,
      },
    };

    render(<MultiSelectBlock block={blockMaxSingular} />);

    expect(screen.getByText("Select up to 1 option")).toBeInTheDocument();
  });

  it("renders without selection constraints when none provided", () => {
    const blockNoConstraints = {
      ...defaultBlock,
      properties: {
        ...defaultBlock.properties,
        minSelections: undefined,
        maxSelections: undefined,
      },
    };

    render(<MultiSelectBlock block={blockNoConstraints} />);

    expect(screen.queryByText(/Select \d+ to \d+ options/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select at least/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select up to/)).not.toBeInTheDocument();
  });

  it("renders all options as checkboxes", () => {
    render(<MultiSelectBlock block={defaultBlock} />);

    expect(screen.getByLabelText("JavaScript")).toBeInTheDocument();
    expect(screen.getByLabelText("TypeScript")).toBeInTheDocument();
    expect(screen.getByLabelText("React")).toBeInTheDocument();
    expect(screen.getByLabelText("Node.js")).toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4);
    expect(checkboxes[0]).toHaveAttribute("value", "js");
    expect(checkboxes[1]).toHaveAttribute("value", "ts");
    expect(checkboxes[2]).toHaveAttribute("value", "react");
    expect(checkboxes[3]).toHaveAttribute("value", "node");
  });

  it("renders with vertical layout by default", () => {
    render(<MultiSelectBlock block={defaultBlock} />);

    const container = screen.getByText("JavaScript").closest("div");
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

    render(<MultiSelectBlock block={blockHorizontal} />);

    const container = screen.getByText("JavaScript").closest("div");
    expect(container).toHaveClass("flex flex-wrap gap-4");
    expect(container).not.toHaveClass("space-y-2");
  });

  it("disables checkboxes in preview mode", () => {
    render(<MultiSelectBlock block={defaultBlock} isPreview={true} />);

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveClass("pointer-events-none");
    });
  });

  it("enables checkboxes when not in preview mode", () => {
    render(<MultiSelectBlock block={defaultBlock} isPreview={false} />);

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeDisabled();
      expect(checkbox).not.toHaveClass("pointer-events-none");
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

    render(<MultiSelectBlock block={blockNoOptions} />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders with default empty array when properties not provided", () => {
    const blockNoProperties = {
      ...defaultBlock,
      properties: undefined,
    };

    render(<MultiSelectBlock block={blockNoProperties} />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
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

    render(<MultiSelectBlock block={blockWithoutIds} />);

    expect(screen.getByLabelText("Option A")).toBeInTheDocument();
    expect(screen.getByLabelText("Option B")).toBeInTheDocument();
  });

  it("uses vertical layout when layout property is not specified", () => {
    const blockNoLayout = {
      ...defaultBlock,
      properties: {
        options: defaultBlock.properties?.options || [],
        // layout not specified
      },
    };

    render(<MultiSelectBlock block={blockNoLayout} />);

    const container = screen.getByText("JavaScript").closest("div");
    expect(container).toHaveClass("space-y-2");
  });
});
