import React from "react";
import { render, screen } from "@testing-library/react";
import FormEditPage from "../../../../app/forms/[id]/edit/page";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { getForm } from "../../../../lib/api/forms";

// Mock dependencies
jest.mock("../../../../lib/stores/form-builder-store", () => ({
  useFormBuilderStore: jest.fn(),
}));

jest.mock("../../../../lib/api/forms", () => ({
  getForm: jest.fn(),
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

describe("FormEditPage", () => {
  const mockStore = {
    loadForm: jest.fn(),
    form: {
      id: "123",
      title: "Test Form",
      blocks: [],
    },
  };

  const mockForm = {
    id: "123",
    title: "Test Form",
    description: "Test Description",
    blocks: [],
    logic: [],
    theme: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as jest.Mock).mockReturnValue(mockStore);
    (getForm as jest.Mock).mockResolvedValue(mockForm);
  });

  it("should load form on mount", async () => {
    const params = { id: "123" };
    render(<FormEditPage params={params} />);

    await screen.findByTestId("form-canvas");

    expect(getForm).toHaveBeenCalledWith("123");
    expect(mockStore.loadForm).toHaveBeenCalledWith(mockForm);
  });

  it("should render form builder components", async () => {
    const params = { id: "123" };
    render(<FormEditPage params={params} />);

    await screen.findByTestId("form-canvas");

    expect(screen.getByTestId("form-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("block-library")).toBeInTheDocument();
    expect(screen.getByTestId("block-inspector")).toBeInTheDocument();
  });

  it("should display loading state initially", () => {
    const params = { id: "123" };
    render(<FormEditPage params={params} />);

    expect(screen.getByText("Loading form...")).toBeInTheDocument();
  });

  it("should handle error when form not found", async () => {
    (getForm as jest.Mock).mockRejectedValue(new Error("Form not found"));

    const params = { id: "123" };
    render(<FormEditPage params={params} />);

    await screen.findByText("Failed to load form");

    expect(screen.getByText("Failed to load form")).toBeInTheDocument();
  });

  it("should pass correct form ID to API", async () => {
    const params = { id: "456" };
    render(<FormEditPage params={params} />);

    await screen.findByTestId("form-canvas");

    expect(getForm).toHaveBeenCalledWith("456");
  });
});
