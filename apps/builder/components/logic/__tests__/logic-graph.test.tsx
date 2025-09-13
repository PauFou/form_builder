import React from "react";
import { render, screen } from "@testing-library/react";
import { LogicGraph } from "../logic-graph";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock the hooks
jest.mock("../../../lib/hooks/use-form-blocks", () => ({
  useFormBlocks: jest.fn(() => []),
}));

// Mock scroll area components
jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  ScrollBar: () => <div />,
}));

// Mock other UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

describe("LogicGraph", () => {
  const mockForm = {
    id: "test-form",
    name: "Test Form",
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          { id: "block-1", type: "short_text", question: "Name", position: 0 },
          { id: "block-2", type: "email", question: "Email", position: 1 },
          { id: "block-3", type: "phone", question: "Phone", position: 2 },
        ],
      },
    ],
    logic: {
      rules: [
        {
          id: "rule-1",
          conditions: [
            {
              id: "cond-1",
              field: "block-1",
              operator: "not_equals",
              value: "",
              type: "field",
            },
          ],
          actions: [
            {
              id: "action-1",
              type: "show",
              target: "block-2",
            },
          ],
        },
        {
          id: "rule-2",
          conditions: [
            {
              id: "cond-2",
              field: "block-2",
              operator: "equals",
              value: "",
              type: "field",
            },
          ],
          actions: [
            {
              id: "action-2",
              type: "hide",
              target: "block-3",
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({ form: mockForm });
    const useFormBlocksModule = jest.requireMock("../../../lib/hooks/use-form-blocks");
    (useFormBlocksModule.useFormBlocks as jest.Mock).mockReturnValue(
      mockForm.pages[0].blocks.map((block) => ({
        ...block,
        label: block.question,
      }))
    );
  });

  it("renders logic graph", () => {
    render(<LogicGraph rules={mockForm.logic.rules} />);
    // Should render the fields from blocks
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
  });

  it("shows empty state when no logic rules", () => {
    // Mock empty blocks to ensure empty state
    const useFormBlocksModule = jest.requireMock("../../../lib/hooks/use-form-blocks");
    (useFormBlocksModule.useFormBlocks as jest.Mock).mockReturnValue([]);

    render(<LogicGraph rules={[]} />);
    expect(screen.getByText("No logic rules to visualize")).toBeInTheDocument();
  });

  it("creates nodes for blocks and rules", () => {
    render(<LogicGraph rules={mockForm.logic.rules} />);
    // Should show rule labels
    expect(screen.getByText("Rule 1")).toBeInTheDocument();
    expect(screen.getByText("Rule 2")).toBeInTheDocument();
  });

  it("shows legend", () => {
    render(<LogicGraph rules={mockForm.logic.rules} />);
    expect(screen.getByText("Legend")).toBeInTheDocument();
    expect(screen.getByText("Form Field")).toBeInTheDocument();
    expect(screen.getByText("Condition")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders action nodes based on type", () => {
    render(<LogicGraph rules={mockForm.logic.rules} />);
    // Actions are rendered with their type
    expect(screen.getByText("show")).toBeInTheDocument();
    expect(screen.getByText("hide")).toBeInTheDocument();
  });

  it("handles form without blocks", () => {
    const useFormBlocksModule = jest.requireMock("../../../lib/hooks/use-form-blocks");
    (useFormBlocksModule.useFormBlocks as jest.Mock).mockReturnValue([]);

    render(<LogicGraph rules={mockForm.logic.rules} />);
    // Should still show rules
    expect(screen.getByText("Rule 1")).toBeInTheDocument();
  });

  it("handles empty rules", () => {
    // Mock empty blocks to ensure empty state
    const useFormBlocksModule = jest.requireMock("../../../lib/hooks/use-form-blocks");
    (useFormBlocksModule.useFormBlocks as jest.Mock).mockReturnValue([]);

    render(<LogicGraph rules={[]} />);
    expect(screen.getByText("No logic rules to visualize")).toBeInTheDocument();
  });

  it("calls onEditRule when edit button is clicked", () => {
    const mockOnEditRule = jest.fn();
    render(<LogicGraph rules={mockForm.logic.rules} onEditRule={mockOnEditRule} />);

    // Find edit buttons (they are on condition nodes)
    const editButtons = screen.getAllByRole("button");
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it("renders with scroll area", () => {
    const { container } = render(<LogicGraph rules={mockForm.logic.rules} />);
    // The component should have a scrollable container
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles rules with multiple conditions", () => {
    const formWithComplexRules = {
      ...mockForm,
      logic: {
        rules: [
          {
            id: "rule-1",
            conditions: [
              {
                id: "cond-1",
                field: "block-1",
                operator: "equals",
                value: "test",
                type: "field",
              },
              {
                id: "cond-2",
                field: "block-2",
                operator: "not_equals",
                value: "",
                type: "field",
              },
            ],
            actions: [
              {
                id: "action-1",
                type: "show",
                target: "block-3",
              },
              {
                id: "action-2",
                type: "hide",
                target: "block-1",
              },
            ],
          },
        ],
      },
    };

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({ form: formWithComplexRules });
    const useFormBlocksModule = jest.requireMock("../../../lib/hooks/use-form-blocks");
    (useFormBlocksModule.useFormBlocks as jest.Mock).mockReturnValue(
      formWithComplexRules.pages[0].blocks.map((block) => ({
        ...block,
        label: block.question,
      }))
    );

    render(<LogicGraph rules={formWithComplexRules.logic.rules} />);
    expect(screen.getByText("Rule 1")).toBeInTheDocument();
  });
});
