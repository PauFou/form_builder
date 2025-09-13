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

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, defaultValue }: any) => <div>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-tab-content={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-tab-trigger={value}>{children}</button>,
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

// Mock useFormBlocks hook
jest.mock("@/lib/hooks/use-form-blocks", () => ({
  useFormBlocks: () => [],
}));

// Mock utils
jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
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

jest.mock("../full-screen-logic-graph", () => ({
  FullScreenLogicGraph: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="full-screen-logic-graph">
        <h3>Full Screen Logic Graph</h3>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
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

    // Find all buttons
    const buttons = screen.getAllByRole("button");

    // The edit button is the first button after "Add Rule" button
    // Filter out the tab triggers and find icon buttons
    const iconButtons = buttons.filter((btn) => !btn.hasAttribute("data-tab-trigger"));

    // Click the edit button for rule-1
    // index 0: "Full-Screen Graph", index 1: "Add Rule", index 2: first edit button
    await user.click(iconButtons[2]);

    // The RuleBuilder component should be shown
    expect(screen.getByText("Save Rule")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("deletes a rule", async () => {
    const user = userEvent.setup();
    render(<LogicEditor />);

    // Find all buttons
    const buttons = screen.getAllByRole("button");

    // Filter out the tab triggers and find icon buttons
    const iconButtons = buttons.filter((btn) => !btn.hasAttribute("data-tab-trigger"));

    // The UI has: Add Rule, Full-Screen Graph buttons, then for each rule: edit, duplicate, delete
    // So for the first rule's delete button, we need to account for:
    // index 0: "Full-Screen Graph", index 1: "Add Rule",
    // index 2: edit for rule-1, index 3: duplicate for rule-1, index 4: delete for rule-1
    await user.click(iconButtons[4]); // index 4 should be delete for rule-1

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

    // Find all buttons and filter out tab triggers
    const buttons = screen.getAllByRole("button");
    const iconButtons = buttons.filter((btn) => !btn.hasAttribute("data-tab-trigger"));

    // Click the edit button for rule-1
    await user.click(iconButtons[2]); // index 2 is edit for rule-1

    // The RuleBuilder should be shown - click Save Rule
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
    // Check that rule conditions and actions are displayed - there should be 2 rules
    const badges = screen.getAllByText(/0 conditions, 0 actions/);
    expect(badges).toHaveLength(2); // One for each rule
  });

  it("displays rule count", () => {
    render(<LogicEditor />);
    // Should show 2 rules in total as Rule #1 and Rule #2
    expect(screen.getByText("Rule #1")).toBeInTheDocument();
    expect(screen.getByText("Rule #2")).toBeInTheDocument();
  });
});
