import React from "react";
import { render, screen } from "../../../../lib/test-utils";
import FormEditPage from "../../../../app/forms/[id]/edit/page";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { formsApi } from "../../../../lib/api/forms";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock tanstack/react-query hooks (not used by this component, but may be imported by dependencies)
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

jest.mock("../../../../lib/stores/auth-store", () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: "1", email: "test@example.com" },
    isAuthenticated: true,
  })),
}));

jest.mock("../../../../components/builder/FormBuilder", () => ({
  FormBuilder: ({ formId }: any) => (
    <div data-testid="form-builder">
      <div>Form ID: {formId}</div>
      <div data-testid="form-canvas">Form Canvas</div>
      <div data-testid="block-library">Block Library</div>
      <div data-testid="block-inspector">Block Inspector</div>
    </div>
  ),
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
    // The component uses formsApi.get directly, so mock it to return { data: mockForm }
    (formsApi.get as jest.Mock).mockResolvedValue({ data: mockForm });
  });

  it("should load form on mount", async () => {
    render(<FormEditPage />);

    // Wait for the component to render
    await screen.findByTestId("form-canvas");

    // Give time for useEffect to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockStore.setForm).toHaveBeenCalledWith(mockForm);
  });

  it("should render form builder components", async () => {
    render(<FormEditPage />);

    await screen.findByTestId("form-canvas");

    expect(screen.getByTestId("form-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("block-library")).toBeInTheDocument();
    expect(screen.getByTestId("block-inspector")).toBeInTheDocument();
  });

  it("should render FormBuilder component", () => {
    render(<FormEditPage />);

    // The component always renders FormBuilder immediately, no loading state
    expect(screen.getByTestId("form-builder")).toBeInTheDocument();
    expect(screen.getByText("Form ID: 123")).toBeInTheDocument();
  });

  it("should handle API error gracefully", async () => {
    // Mock API to reject
    (formsApi.get as jest.Mock).mockRejectedValue(new Error("Form not found"));

    render(<FormEditPage />);

    // Component still renders FormBuilder, but API call fails silently
    expect(screen.getByTestId("form-builder")).toBeInTheDocument();

    // Give time for useEffect and error to be logged
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Form should not be set in store when API fails
    expect(mockStore.setForm).not.toHaveBeenCalled();
  });

  it("should pass correct form ID to API", async () => {
    (useParams as jest.Mock).mockReturnValue({ id: "456" });

    render(<FormEditPage />);

    await screen.findByTestId("form-canvas");

    // Give time for useEffect to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check that formsApi.get was called with the correct ID
    expect(formsApi.get).toHaveBeenCalledWith("456");
  });
});
