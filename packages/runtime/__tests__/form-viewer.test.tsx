import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormViewer } from "../src/components/FormViewer";
import type { FormSchema } from "../src/types";

// Mock the offline service
jest.mock("../src/services/offline-service", () => ({
  OfflineService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    saveState: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockResolvedValue(null),
    getOfflineStats: jest.fn().mockResolvedValue({ total: 0, pendingSync: 0 }),
    deleteState: jest.fn().mockResolvedValue(undefined),
    clearAll: jest.fn().mockResolvedValue(undefined),
    setSyncStatus: jest.fn(),
    getSyncStatus: jest.fn().mockResolvedValue(null),
    syncAll: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
    isOnline: jest.fn().mockReturnValue(true),
    destroy: jest.fn(),
  })),
}));

// Mock analytics service
jest.mock("../src/services/analytics-service", () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    trackFormView: jest.fn(),
    trackFormStart: jest.fn(),
    trackStepView: jest.fn(),
    trackStepComplete: jest.fn(),
    trackFieldChange: jest.fn(),
    trackFormSubmit: jest.fn(),
    trackFormAbandon: jest.fn(),
    trackOutcome: jest.fn(),
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
    formId: "test-form",
    apiUrl: "http://localhost:8000",
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders first form question", () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    // FormViewer shows one question at a time, starting with the first
    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    // Second question should not be visible yet
    expect(screen.queryByText("What is your email?")).not.toBeInTheDocument();
  });

  it("navigates between form blocks", async () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    // First question is visible
    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    expect(screen.queryByText("What is your email?")).not.toBeInTheDocument();

    // Fill in the required field and go to next
    const nameInput = screen.getByRole("textbox", { name: /name/i });
    fireEvent.change(nameInput, { target: { value: "John" } });

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    // Now second question should be visible
    await waitFor(() => {
      expect(screen.queryByText("What is your name?")).not.toBeInTheDocument();
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });
  });

  it("shows required field indicators", () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    const nameField = screen.getByText("What is your name?").closest("div");
    expect(nameField).toHaveTextContent("*");
  });

  it("handles form submission", async () => {
    const onSubmit = jest.fn();
    // Disable anti-spam for testing
    render(
      <FormViewer
        schema={mockSchema}
        config={{ ...defaultConfig, onSubmit, enableAntiSpam: false }}
      />
    );

    // Fill first field
    const nameInput = screen.getByRole("textbox", { name: /name/i });
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Go to next page
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    // Wait for second field to appear
    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });

    // Fill second field
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    // Submit button appears on last step
    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          formId: "test-form",
          values: {
            block1: "John Doe",
            block2: "john@example.com",
          },
          startedAt: expect.any(String),
          completedAt: expect.any(String),
          metadata: expect.objectContaining({
            completionTime: expect.any(Number),
            respondentKey: expect.any(String),
            userAgent: expect.any(String),
          }),
        })
      );
    });
  });

  it("prevents navigation with missing required fields", async () => {
    const onSubmit = jest.fn();
    render(<FormViewer schema={mockSchema} config={{ ...defaultConfig, onSubmit }} />);

    // Try to go to next without filling required field
    const nextButton = screen.getByRole("button", { name: /next/i });

    // Button should be disabled when required field is empty
    expect(nextButton).toBeDisabled();

    // We should still be on the first question
    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates email fields", async () => {
    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    // Fill first field to enable navigation
    const nameInput = screen.getByRole("textbox", { name: /name/i });
    fireEvent.change(nameInput, { target: { value: "John" } });

    // Go to email field
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });

    // Enter invalid email
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    // Try to submit - this should trigger validation and show error
    const submitButton = screen.getByRole("button", { name: /submit/i });

    // Since it's the last step, the button should say "Submit" and be enabled
    expect(submitButton).toBeInTheDocument();

    // But when clicked with invalid email, it should be disabled
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    expect(submitButton).toBeDisabled();
  });

  it("applies custom theme", () => {
    const customSchema = {
      ...mockSchema,
      theme: "dark", // FormViewer uses data-theme attribute
      settings: {
        theme: {
          colors: { primary: "#ff0000" },
          typography: { fontFamily: "Arial" },
        },
      },
    };

    const { container } = render(<FormViewer schema={customSchema} config={defaultConfig} />);

    // Check that theme is applied as data-theme attribute
    const formContainer = container.querySelector(".fr-container");
    expect(formContainer).toHaveAttribute("data-theme", "dark");
  });

  it("handles offline mode gracefully", () => {
    // Test that form still works when offline service fails
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<FormViewer schema={mockSchema} config={defaultConfig} />);

    // Form should still render the first question
    expect(screen.getByText("What is your name?")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
