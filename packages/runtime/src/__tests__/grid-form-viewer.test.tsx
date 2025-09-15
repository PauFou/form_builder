import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GridFormViewer } from "../components/GridFormViewer";
import { FormViewerWrapper } from "../components/FormViewerWrapper";
import type { FormSchema, RuntimeConfig } from "../types";

describe("GridFormViewer", () => {
  const mockSchema: FormSchema = {
    id: "test-form",
    title: "Test Form",
    pages: [
      {
        id: "page1",
        blocks: [
          {
            id: "name",
            type: "text",
            question: "What is your name?",
            required: true,
          },
          {
            id: "email",
            type: "email",
            question: "What is your email?",
            required: true,
          },
        ],
      },
      {
        id: "page2",
        blocks: [
          {
            id: "age",
            type: "number",
            question: "What is your age?",
            required: false,
          },
          {
            id: "feedback",
            type: "long_text",
            question: "Any feedback?",
            required: false,
          },
        ],
      },
    ],
    settings: {
      showProgressBar: true,
      submitText: "Submit Form",
    },
  };

  const mockConfig: RuntimeConfig = {
    formId: "test-form",
    apiUrl: "https://api.example.com",
    onSubmit: jest.fn(),
    enableAntiSpam: false, // Disable for testing
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all fields on the current page", () => {
    render(<GridFormViewer schema={mockSchema} config={mockConfig} />);

    expect(screen.getByLabelText(/what is your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/what is your email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/what is your age/i)).not.toBeInTheDocument();
  });

  it("shows page indicator and progress bar", () => {
    render(<GridFormViewer schema={mockSchema} config={mockConfig} />);

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("validates required fields before navigation", async () => {
    render(<GridFormViewer schema={mockSchema} config={mockConfig} />);

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getAllByText(/what is your name.*is required/i)).toHaveLength(2); // Error message appears twice (field + summary)
      expect(screen.getAllByText(/what is your email.*is required/i)).toHaveLength(2);
    });
  });

  it("navigates to next page when fields are valid", async () => {
    const user = userEvent.setup();
    render(<GridFormViewer schema={mockSchema} config={mockConfig} />);

    await user.type(screen.getByLabelText(/what is your name/i), "John Doe");
    await user.type(screen.getByLabelText(/what is your email/i), "john@example.com");

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText(/what is your age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/any feedback/i)).toBeInTheDocument();
  });

  it("allows navigation back to previous page", async () => {
    const user = userEvent.setup();
    render(<GridFormViewer schema={mockSchema} config={mockConfig} />);

    // Go to page 2
    await user.type(screen.getByLabelText(/what is your name/i), "John Doe");
    await user.type(screen.getByLabelText(/what is your email/i), "john@example.com");
    await user.click(screen.getByText("Next"));

    // Go back to page 1
    const prevButton = screen.getByText("Previous");
    await user.click(prevButton);

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    // After navigating back, the values should be preserved
    const nameInput = screen.getByLabelText(/what is your name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it("submits form when all fields are valid", async () => {
    const user = userEvent.setup();

    // Mock onSubmit handler
    const onSubmitSpy = jest.fn(() => Promise.resolve());
    const testConfig = { ...mockConfig, onSubmit: onSubmitSpy };

    render(<GridFormViewer schema={mockSchema} config={testConfig} />);

    // Fill page 1
    await user.type(screen.getByLabelText(/what is your name/i), "John Doe");
    await user.type(screen.getByLabelText(/what is your email/i), "john@example.com");
    await user.click(screen.getByText("Next"));

    // Wait for page 2 to be fully loaded and ensure the field is ready
    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
      expect(screen.getByLabelText(/what is your age/i)).toBeInTheDocument();
    });

    // Fill page 2 - use clear() first to ensure field is ready
    const ageField = screen.getByLabelText(/what is your age/i) as HTMLInputElement;
    const feedbackField = screen.getByLabelText(/any feedback/i) as HTMLTextAreaElement;

    await user.clear(ageField);
    await user.type(ageField, "30");

    await user.clear(feedbackField);
    await user.type(feedbackField, "Great form!");

    // Verify values were entered
    await waitFor(() => {
      expect(ageField.value).toBe("30");
      expect(feedbackField.value).toBe("Great form!");
    });

    // Submit
    const submitButton = screen.getByText("Submit Form");
    await user.click(submitButton);

    // Wait for completion message to appear
    await waitFor(
      () => {
        expect(screen.getByText(/thank you/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Also verify onSubmit was called with correct data
    expect(onSubmitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        formId: "test-form",
        values: {
          name: "John Doe",
          email: "john@example.com",
          age: "30",
          feedback: "Great form!",
        },
      })
    );
  });

  it("shows error summary when validation fails", async () => {
    render(<GridFormViewer schema={mockSchema} config={mockConfig} />);

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getAllByRole("alert")).toHaveLength(3); // 2 field alerts + 1 summary alert
      expect(screen.getByText(/please fix the following errors/i)).toBeInTheDocument();
    });
  });
});

describe("FormViewerWrapper", () => {
  const mockSchema: FormSchema = {
    id: "test-form",
    title: "Test Form",
    blocks: [
      {
        id: "name",
        type: "text",
        question: "What is your name?",
        required: true,
      },
    ],
    settings: {
      displayMode: "grid",
      allowModeSwitch: true,
    },
  };

  const mockConfig: RuntimeConfig = {
    formId: "test-form",
    apiUrl: "https://api.example.com",
    enableAntiSpam: false, // Disable for testing
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("renders mode switcher when allowModeSwitch is true", () => {
    render(<FormViewerWrapper schema={mockSchema} config={mockConfig} />);

    expect(screen.getByLabelText("Display mode")).toBeInTheDocument();
    expect(screen.getByLabelText("One question at a time mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Grid mode - show all questions")).toBeInTheDocument();
  });

  it("does not render mode switcher when allowModeSwitch is false", () => {
    const schema = { ...mockSchema, settings: { ...mockSchema.settings, allowModeSwitch: false } };
    render(<FormViewerWrapper schema={schema} config={mockConfig} />);

    expect(screen.queryByLabelText("Display mode")).not.toBeInTheDocument();
  });

  it("switches between modes when clicking buttons", async () => {
    const user = userEvent.setup();
    render(<FormViewerWrapper schema={mockSchema} config={mockConfig} />);

    // Should start in grid mode based on schema
    expect(screen.getByLabelText("Grid mode - show all questions")).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    // Switch to one-question mode
    await user.click(screen.getByLabelText("One question at a time mode"));

    expect(screen.getByLabelText("One question at a time mode")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByLabelText("Grid mode - show all questions")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("persists mode selection in localStorage", async () => {
    const user = userEvent.setup();
    render(<FormViewerWrapper schema={mockSchema} config={mockConfig} />);

    await user.click(screen.getByLabelText("One question at a time mode"));

    expect(localStorage.getItem("form-test-form-mode")).toBe("one-question");
  });

  it("loads mode from localStorage on mount", () => {
    localStorage.setItem("form-test-form-mode", "one-question");

    render(<FormViewerWrapper schema={mockSchema} config={mockConfig} />);

    expect(screen.getByLabelText("One question at a time mode")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
