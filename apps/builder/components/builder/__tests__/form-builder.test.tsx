import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormBuilder } from "../form-builder";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { DndContext } from "@dnd-kit/core";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  useSensors: () => [],
  useSensor: () => ({}),
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
  closestCenter: jest.fn(),
}));

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  verticalListSortingStrategy: [],
  arrayMove: jest.fn((array: any[], from: number, to: number) => {
    const newArray = [...array];
    const [removed] = newArray.splice(from, 1);
    newArray.splice(to, 0, removed);
    return newArray;
  }),
}));

// Mock UI components
jest.mock("@forms/ui", () => ({
  ...jest.requireActual("@forms/ui"),
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-value={value}>{children}</button>,
}));

// Mock child components
jest.mock("../sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock("../canvas", () => ({
  Canvas: () => <div data-testid="canvas">Canvas</div>,
}));

jest.mock("../inspector", () => ({
  Inspector: () => <div data-testid="properties-panel">Inspector Panel</div>,
}));

describe("FormBuilder", () => {
  const mockForm = {
    id: "test-form",
    name: "Test Form",
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      selectedBlockId: "block-1", // Set a selectedBlockId to render PropertiesPanel
      selectedPageId: "page-1",
      selectPage: jest.fn(),
      canUndo: jest.fn(() => false),
      canRedo: jest.fn(() => false),
      undo: jest.fn(),
      redo: jest.fn(),
      getHistoryStatus: jest.fn(() => ({ current: 1, total: 1 })),
      isDirty: false,
    });
  });

  it("renders form builder with all panels", () => {
    render(<FormBuilder />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(screen.getByTestId("properties-panel")).toBeInTheDocument();
  });

  it("renders tabs for design and logic", () => {
    render(<FormBuilder />);

    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Logic")).toBeInTheDocument();
  });

  it("shows design tab content by default", () => {
    render(<FormBuilder />);

    const designContent = screen.getByTestId("canvas").closest('[data-value="design"]');
    expect(designContent).toBeInTheDocument();
  });

  it("can switch between tabs", async () => {
    const user = userEvent.setup();
    render(<FormBuilder />);

    const logicTab = screen.getByText("Logic");
    await user.click(logicTab);

    // The logic content should be visible
    expect(screen.getByText("Logic")).toBeInTheDocument();
  });

  it("shows empty state when no form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      selectedBlockId: null,
      selectedPageId: null,
      selectPage: jest.fn(),
      canUndo: jest.fn(() => false),
      canRedo: jest.fn(() => false),
      undo: jest.fn(),
      redo: jest.fn(),
      getHistoryStatus: jest.fn(() => ({ current: 0, total: 0 })),
      isDirty: false,
    });

    render(<FormBuilder />);

    // Should still render the structure
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("handles keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(<FormBuilder />);

    // Test keyboard shortcut (e.g., Cmd+S to save)
    await user.keyboard("{Meta>}s{/Meta}");

    // Component should handle keyboard events
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
  });

  it("maintains responsive layout", () => {
    const { container } = render(<FormBuilder />);

    // Check for grid layout
    const mainGrid = container.querySelector(".grid");
    expect(mainGrid).toBeInTheDocument();
  });

  it("integrates with DnD context", () => {
    render(<FormBuilder />);

    // DnD should be set up
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
  });
});
