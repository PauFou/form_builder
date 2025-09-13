import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertiesPanel } from "../properties-panel";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock UI components
jest.mock("@forms/ui", () => ({
  ...jest.requireActual("@forms/ui"),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Input: (props: any) => <input {...props} />,
  Textarea: (props: any) => <textarea {...props} />,
  Label: ({ children }: any) => <label>{children}</label>,
  Switch: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
  ),
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Separator: () => <hr />,
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  Tabs: ({ children, defaultValue }: any) => <div data-default={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-tab={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-tab-trigger={value}>{children}</button>,
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Settings: () => <span>Settings</span>,
  Palette: () => <span>Palette</span>,
  Shield: () => <span>Shield</span>,
  Plus: () => <span>Plus</span>,
  Trash2: () => <span>Trash2</span>,
}));

describe("PropertiesPanel", () => {
  const mockBlock = {
    id: "block-1",
    type: "short_text",
    question: "What is your name?",
    description: "Please enter your full name",
    required: true,
    placeholder: "John Doe",
    validation: [
      {
        type: "min_length",
        value: 2,
        message: "Name must be at least 2 characters",
      },
    ],
  };

  const mockUpdateBlock = jest.fn();
  const mockDeleteBlock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with selected block", () => {
    beforeEach(() => {
      (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
        selectedBlockId: "block-1",
        form: {
          pages: [
            {
              id: "page-1",
              blocks: [mockBlock],
            },
          ],
        },
        updateBlock: mockUpdateBlock,
        deleteBlock: mockDeleteBlock,
      });
    });

    it("renders properties panel with tabs", () => {
      render(<PropertiesPanel />);

      expect(screen.getByText("Block Properties")).toBeInTheDocument();
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Validation")).toBeInTheDocument();
      expect(screen.getByText("Logic")).toBeInTheDocument();
    });

    it("displays block general properties", () => {
      render(<PropertiesPanel />);

      expect(screen.getByDisplayValue("What is your name?")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Please enter your full name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    });

    it("shows required toggle", () => {
      render(<PropertiesPanel />);

      const requiredCheckbox = screen.getByRole("checkbox");
      expect(requiredCheckbox).toBeChecked();
    });

    it("updates question text", async () => {
      const user = userEvent.setup();
      render(<PropertiesPanel />);

      const questionInput = screen.getByDisplayValue("What is your name?");
      await user.clear(questionInput);
      await user.type(questionInput, "What is your email?");

      // Check that updateBlock was called
      expect(mockUpdateBlock).toHaveBeenCalled();
      // Check that at least one call has the correct value
      const calls = mockUpdateBlock.mock.calls;
      const hasCorrectCall = calls.some(
        (call) => call[0] === "block-1" && call[1]?.question === "What is your email?"
      );
      expect(hasCorrectCall).toBe(true);
    });

    it("updates description", async () => {
      const user = userEvent.setup();
      render(<PropertiesPanel />);

      const descInput = screen.getByDisplayValue("Please enter your full name");
      await user.clear(descInput);
      await user.type(descInput, "Enter your email address");

      expect(mockUpdateBlock).toHaveBeenCalled();
      const calls = mockUpdateBlock.mock.calls;
      const hasCorrectCall = calls.some(
        (call) => call[0] === "block-1" && call[1]?.description === "Enter your email address"
      );
      expect(hasCorrectCall).toBe(true);
    });

    it("toggles required field", async () => {
      const user = userEvent.setup();
      render(<PropertiesPanel />);

      const requiredCheckbox = screen.getByRole("checkbox");
      await user.click(requiredCheckbox);

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        required: false,
      });
    });

    it("deletes block", async () => {
      const user = userEvent.setup();
      render(<PropertiesPanel />);

      const deleteButton = screen.getByText("Delete Block");
      await user.click(deleteButton);

      expect(mockDeleteBlock).toHaveBeenCalledWith("block-1");
    });

    it("shows validation rules", () => {
      render(<PropertiesPanel />);

      const validationTab = screen.getByText("Validation");
      expect(validationTab).toBeInTheDocument();

      // Validation content is in a tab
      expect(screen.getByText("Add Validation Rule")).toBeInTheDocument();
    });
  });

  describe("without selected block", () => {
    beforeEach(() => {
      (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
        selectedBlockId: null,
        form: {
          pages: [],
        },
        updateBlock: mockUpdateBlock,
        deleteBlock: mockDeleteBlock,
      });
    });

    it("shows empty state", () => {
      render(<PropertiesPanel />);

      expect(screen.getByText("Select a block to edit its properties")).toBeInTheDocument();
    });
  });

  describe("with different block types", () => {
    it("shows email-specific properties", () => {
      const emailBlock = {
        ...mockBlock,
        type: "email",
      };

      (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
        selectedBlockId: "block-1",
        form: {
          pages: [
            {
              id: "page-1",
              blocks: [emailBlock],
            },
          ],
        },
        updateBlock: mockUpdateBlock,
        deleteBlock: mockDeleteBlock,
      });

      render(<PropertiesPanel />);

      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("shows number-specific properties", () => {
      const numberBlock = {
        ...mockBlock,
        type: "number",
        min: 0,
        max: 100,
      };

      (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
        selectedBlockId: "block-1",
        form: {
          pages: [
            {
              id: "page-1",
              blocks: [numberBlock],
            },
          ],
        },
        updateBlock: mockUpdateBlock,
        deleteBlock: mockDeleteBlock,
      });

      render(<PropertiesPanel />);

      expect(screen.getByText("Number")).toBeInTheDocument();
    });
  });
});
