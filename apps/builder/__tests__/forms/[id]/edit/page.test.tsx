import React from "react";
import { render, screen } from "../../../../lib/test-utils";
import FormEditPage from "../../../../app/forms/[id]/edit/page";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { formsApi } from "../../../../lib/api/forms";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

// Mock tanstack/react-query hooks
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock dependencies
jest.mock("../../../../lib/stores/form-builder-store", () => ({
  useFormBuilderStore: jest.fn(),
}));

jest.mock("../../../../lib/api/forms", () => ({
  formsApi: {
    get: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
  },
}));

jest.mock("../../../../lib/demo-forms", () => ({
  DEMO_FORMS: {},
}));

jest.mock("../../../../components/builder/form-canvas", () => ({
  FormCanvas: () => <div data-testid="form-canvas">Form Canvas</div>,
}));

jest.mock("../../../../components/builder/block-library", () => ({
  BlockLibrary: () => <div data-testid="block-library">Block Library</div>,
}));

jest.mock("../../../../components/builder/block-inspector", () => ({
  BlockInspector: () => <div data-testid="block-inspector">Block Inspector</div>,
}));

jest.mock("../../../../components/builder/block-settings", () => ({
  BlockSettings: () => <div data-testid="block-settings">Block Settings</div>,
}));

// Import mocked modules
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

describe("FormEditPage", () => {
  const mockStore = {
    form: {
      id: "123",
      title: "Test Form",
      pages: [],
    },
    setForm: jest.fn(),
    isDirty: false,
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: jest.fn(() => false),
    canRedo: jest.fn(() => false),
    history: [],
    historyIndex: 0,
    markClean: jest.fn(),
    selectedBlockId: null,
    selectBlock: jest.fn(),
    duplicateBlock: jest.fn(),
    deleteBlock: jest.fn(),
    addLogicRule: jest.fn(),
    validationErrors: [],
  };

  const mockForm = {
    id: "123",
    title: "Test Form",
    description: "Test Description",
    pages: [],
    logic: [],
    theme: {},
    settings: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue(mockStore);
    (useParams as jest.Mock).mockReturnValue({ id: "123" });
    (useQuery as jest.Mock).mockReturnValue({
      data: mockForm,
      isLoading: false,
      error: null,
    });
    (formsApi.get as jest.Mock).mockResolvedValue(mockForm);
  });

  it("should load form on mount", async () => {
    render(<FormEditPage />);

    await screen.findByTestId("form-canvas");

    expect(mockStore.setForm).toHaveBeenCalledWith(mockForm);
  });

  it("should render form builder components", async () => {
    render(<FormEditPage />);

    await screen.findByTestId("form-canvas");

    expect(screen.getByTestId("form-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("block-library")).toBeInTheDocument();
    expect(screen.getByTestId("block-settings")).toBeInTheDocument();
  });

  it("should display loading state initially", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<FormEditPage />);

    expect(screen.getByText("Loading form...")).toBeInTheDocument();
  });

  it("should handle error when form not found", async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Form not found"),
    });

    render(<FormEditPage />);

    expect(screen.getByText("Failed to load form")).toBeInTheDocument();
  });

  it("should pass correct form ID to API", async () => {
    (useParams as jest.Mock).mockReturnValue({ id: "456" });

    render(<FormEditPage />);

    await screen.findByTestId("form-canvas");

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["form", "456"],
      })
    );
  });
});
