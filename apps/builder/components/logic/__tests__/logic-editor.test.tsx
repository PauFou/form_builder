import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogicEditor } from "../logic-editor";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock child components
jest.mock("../rule-builder", () => ({
  RuleBuilder: ({ onSave, onCancel }: any) => (
    <div data-testid="rule-builder">
      <button onClick={() => onSave({ id: "new-rule" })}>Save Rule</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../logic-graph", () => ({
  LogicGraph: () => <div data-testid="logic-graph">Logic Graph</div>,
}));

describe("LogicEditor", () => {
  const mockAddLogicRule = jest.fn();
  const mockUpdateLogicRule = jest.fn();
  const mockDeleteLogicRule = jest.fn();

  const mockForm = {
    id: "test-form",
    name: "Test Form",
    logic: {
      rules: [
        {
          id: "rule-1",
          conditions: [],
          actions: [],
        },
        {
          id: "rule-2",
          conditions: [],
          actions: [],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      addLogicRule: mockAddLogicRule,
      updateLogicRule: mockUpdateLogicRule,
      deleteLogicRule: mockDeleteLogicRule,
    });
  });

  it("renders logic editor with tabs", () => {
    render(<LogicEditor />);
    expect(screen.getByText("Form Logic")).toBeInTheDocument();
    // Tabs only show when there are rules
    expect(screen.getByText("List View")).toBeInTheDocument();
    expect(screen.getByText("Graph View")).toBeInTheDocument();
  });

  it("shows existing rules", () => {
    render(<LogicEditor />);
    // Rules are displayed as Rule #1, Rule #2, etc.
    expect(screen.getByText("Rule #1")).toBeInTheDocument();
    expect(screen.getByText("Rule #2")).toBeInTheDocument();
  });

  it("shows empty state when no rules", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: { ...mockForm, logic: { rules: [] } },
      addLogicRule: mockAddLogicRule,
      updateLogicRule: mockUpdateLogicRule,
      deleteLogicRule: mockDeleteLogicRule,
    });

    render(<LogicEditor />);
    expect(screen.getByText(/no logic rules/i)).toBeInTheDocument();
  });

  it("opens rule builder when clicking add rule", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    await user.click(screen.getByText("Add Rule"));

    // The RuleBuilder component should be shown - check for its save/cancel buttons
    expect(screen.getByText("Save Rule")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("opens rule builder when editing existing rule", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    // Click on the rule card first (rules are clickable)
    await user.click(screen.getByText("Rule #1"));

    // Find all icon buttons and click the first one (edit button)
    const iconButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.classList.contains("h-9"));
    await user.click(iconButtons[0]);

    // The RuleBuilder component should be shown
    expect(screen.getByText("Save Rule")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("deletes a rule", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    // Find all icon buttons and click the third one (delete button is after edit and duplicate)
    const iconButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector(".h-4.w-4"));
    // Delete button should be at index 2 (0: edit, 1: duplicate, 2: delete)
    await user.click(iconButtons[2]);

    expect(mockDeleteLogicRule).toHaveBeenCalledWith("rule-1");
  });

  it("saves a new rule", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    await user.click(screen.getByText("Add Rule"));
    await user.click(screen.getByText("Save Rule"));

    expect(mockAddLogicRule).toHaveBeenCalled();
  });

  it("updates an existing rule", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    // Find and click the edit button (first icon button)
    const iconButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector(".h-4.w-4"));
    await user.click(iconButtons[0]);
    await user.click(screen.getByText("Save Rule"));

    expect(mockUpdateLogicRule).toHaveBeenCalled();
  });

  it("cancels rule creation", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    await user.click(screen.getByText("Add Rule"));
    await user.click(screen.getByText("Cancel"));

    expect(screen.queryByTestId("rule-builder")).not.toBeInTheDocument();
  });

  it("switches to flow tab", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    await user.click(screen.getByText("Graph View"));

    expect(screen.getByTestId("logic-graph")).toBeInTheDocument();
  });

  it("shows rule count badge", () => {
    render(<LogicEditor />);
    // Check that rule conditions and actions are displayed
    expect(screen.getByText(/0 conditions, 0 actions/)).toBeInTheDocument();
  });

  it("displays rule count", () => {
    render(<LogicEditor />);
    // Should show 2 rules in total as Rule #1 and Rule #2
    expect(screen.getByText("Rule #1")).toBeInTheDocument();
    expect(screen.getByText("Rule #2")).toBeInTheDocument();
  });
});
