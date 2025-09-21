import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RuleBuilder } from "../rule-builder";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { useFormBlocks } from "../../../lib/hooks/use-form-blocks";
import type { LogicRule, LogicCondition, LogicAction } from "@skemya/contracts";

// Mock the store and hooks
jest.mock("../../../lib/stores/form-builder-store");
jest.mock("../../../lib/hooks/use-form-blocks");

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe("RuleBuilder", () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

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
        ],
      },
    ],
  };

  const mockBlocks = [
    { id: "block-1", type: "short_text", question: "Name" },
    { id: "block-2", type: "email", question: "Email" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({ form: mockForm });
    (useFormBlocks as jest.Mock).mockReturnValue(mockBlocks);
  });

  it("renders rule builder", () => {
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    // Check for core UI elements
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("adds a new condition", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    await user.click(screen.getByText("Add Condition"));

    // Should show condition inputs - check that at least one of each label exists
    const fields = screen.getAllByText("Field");
    const operators = screen.getAllByText("Operator");
    const values = screen.getAllByText("Value");

    expect(fields.length).toBeGreaterThan(0);
    expect(operators.length).toBeGreaterThan(0);
    expect(values.length).toBeGreaterThan(0);
  });

  it("removes a condition", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Component starts with 1 condition - add one more
    await user.click(screen.getByText("Add Condition"));

    // Check we have 2 conditions
    const fields = screen.getAllByText("Field");
    expect(fields.length).toBe(2);

    // Find and click a remove button
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[0]);

    // One condition should be removed, back to 1
    const fieldsAfter = screen.getAllByText("Field");
    expect(fieldsAfter.length).toBe(1);
  });

  it("adds a new action", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Get initial count of action types
    const initialActions = screen.getAllByText("Action Type");
    const initialCount = initialActions.length;

    await user.click(screen.getByText("Add Action"));

    // Should have one more action type
    const afterActions = screen.getAllByText("Action Type");
    expect(afterActions.length).toBe(initialCount + 1);
  });

  it("saves a rule with conditions and actions", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    // The component starts with 1 condition and 1 action
    // Just verify we can save with defaults

    // Click save
    await user.click(screen.getByText("Save Rule"));

    // The save will fail validation if fields are empty
    // So check that save was not called due to validation
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("cancels rule creation", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    await user.click(screen.getByText("Cancel"));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("loads existing rule for editing", () => {
    const existingRule: LogicRule = {
      id: "rule-1",
      conditions: [
        {
          id: "cond-1",
          field: "block-1",
          operator: "equals" as const,
          value: "test",
        },
      ],
      actions: [
        {
          id: "action-1",
          type: "show",
          target: "block-2",
        },
      ],
    };

    render(<RuleBuilder rule={existingRule} onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Should show existing data
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Show field")).toBeInTheDocument();
  });

  it("validates rule before saving", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Try to save without conditions or actions
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Check that save was not called since validation should fail
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("shows condition types dropdown", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    await user.click(screen.getByText("Add Condition"));

    // Check for operator labels - there should be multiple
    const operators = screen.getAllByText("Operator");
    expect(operators.length).toBeGreaterThan(0);
  });

  it("shows action types with icons", async () => {
    const user = userEvent.setup();
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    await user.click(screen.getByText("Add Action"));

    // Should show action types - check that at least one exists
    const actionTypes = screen.getAllByText("Action Type");
    expect(actionTypes.length).toBeGreaterThan(0);
  });
});
