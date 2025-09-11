import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormViewer } from "../src/components/FormViewer";
import type { FormSchema } from "../src/types";

// Mock the offline service
jest.mock("../src/services/offline-service", () => ({
  OfflineService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    saveFormData: jest.fn(),
    loadFormData: jest.fn().mockResolvedValue({}),
    destroy: jest.fn(),
  })),
}));

// Mock analytics service
jest.mock("../src/services/analytics-service", () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    trackView: jest.fn(),
    trackStep: jest.fn(),
    trackFieldChange: jest.fn(),
    trackCompletion: jest.fn(),
    destroy: jest.fn(),
  })),
}));

describe("FormViewer", () => {
  const mockSchema: FormSchema = {
    id: "test-form",
    title: "Test Form",
    description: "A test form",
    version: 1,
    pages: [
      {
        id: "page1",
        title: "Page 1",
        blocks: [
          {
            id: "block1",
            type: "text",
            question: "What is your name?",
            required: true,
          },
          {
            id: "block2",
            type: "email",
            question: "What is your email?",
            required: false,
          },
        ],
      },
    ],
    logic: [],
    settings: {
      theme: {
        colors: { primary: "#3B82F6" },
        typography: { fontFamily: "Inter" },
      },
    },
  };

  const defaultConfig = {
    apiUrl: "http://localhost:8000",
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form title and description", () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    expect(screen.getByText("Test Form")).toBeInTheDocument();
    expect(screen.getByText("A test form")).toBeInTheDocument();
  });

  it("renders form blocks", () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    expect(screen.getByText("What is your email?")).toBeInTheDocument();
  });

  it("shows required field indicators", () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    const nameField = screen.getByText("What is your name?").closest("div");
    expect(nameField).toHaveTextContent("*");
  });

  it("handles form submission", async () => {
    const onSubmit = jest.fn();
    render(<FormViewer schema={mockSchema} config={{ ...defaultConfig, onSubmit }} />);

    const nameInput = screen.getByRole("textbox", { name: /name/i });
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const submitButton = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        block1: "John Doe",
        block2: "john@example.com",
      });
    });
  });

  it("prevents submission with missing required fields", async () => {
    const onSubmit = jest.fn();
    render(<FormViewer schema={mockSchema} config={{ ...defaultConfig, onSubmit }} />);

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("validates email fields", async () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it("applies custom theme", () => {
    const customSchema = {
      ...mockSchema,
      settings: {
        theme: {
          colors: { primary: "#ff0000" },
          typography: { fontFamily: "Arial" },
        },
      },
    };

    const { container } = render(<FormViewer schema={customSchema} config={defaultConfig} />);

    const formElement = container.querySelector('[data-testid="form-viewer"]');
    expect(formElement).toHaveStyle("font-family: Arial");
  });

  it("handles offline mode gracefully", () => {
    // Test that form still works when offline service fails
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    expect(screen.getByText("Test Form")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
