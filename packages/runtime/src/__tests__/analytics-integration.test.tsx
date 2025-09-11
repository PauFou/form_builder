import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { FormViewer } from "../components/FormViewer";
import type { FormSchema, RuntimeConfig } from "../types";

// Mock fetch
// @ts-expect-error - Mock fetch for testing
(globalThis as any).fetch = jest.fn();

describe("Analytics Integration", () => {
  const mockSchema: FormSchema = {
    id: "test-form",
    version: 1,
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
          {
            id: "rating",
            type: "rating",
            question: "How would you rate our service?",
            properties: {
              max: 5,
            },
          },
        ],
      },
    ],
    settings: {
      showProgressBar: true,
      submitText: "Submit",
    },
  };

  const mockConfig: RuntimeConfig = {
    formId: "test-form",
    apiUrl: "/api",
    enableAnalytics: true,
    analyticsApiUrl: "/api/analytics",
    enableAnalyticsDebug: true,
    enableAntiSpam: false,
  };

  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "submission-123" }),
    });
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    cleanup();
  });

  it("should track form view on mount", async () => {
    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.objectContaining({
          event_type: "form_view",
          form_id: "test-form",
          respondent_id: expect.any(String),
        })
      );
    });
  });

  it("should track form start on first interaction", async () => {
    const { getByLabelText } = render(<FormViewer schema={mockSchema} config={mockConfig} />);

    const nameInput = getByLabelText(/What is your name?/i);
    fireEvent.change(nameInput, { target: { value: "John" } });

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.objectContaining({
          event_type: "form_start",
          form_id: "test-form",
        })
      );
    });
  });

  it("should track field changes", async () => {
    const { getByLabelText } = render(<FormViewer schema={mockSchema} config={mockConfig} />);

    const nameInput = getByLabelText(/What is your name?/i);
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.objectContaining({
          event_type: "field_change",
          form_id: "test-form",
          field_id: "name",
          field_type: "text",
          field_value: "John Doe",
        })
      );
    });
  });

  it("should track step navigation", async () => {
    const { getByLabelText, getByText } = render(
      <FormViewer schema={mockSchema} config={mockConfig} />
    );

    // Fill required field and go to next step
    const nameInput = getByLabelText(/What is your name?/i);
    fireEvent.change(nameInput, { target: { value: "John" } });

    const nextButton = getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      // Should track step completion
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.objectContaining({
          event_type: "step_complete",
          form_id: "test-form",
          step_id: "name",
        })
      );

      // Should track new step view
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.objectContaining({
          event_type: "step_view",
          form_id: "test-form",
          step_id: "email",
        })
      );
    });
  });

  it("should track form submission", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: "submission-123" });
    const config = { ...mockConfig, onSubmit };

    const { getByLabelText, getByText } = render(
      <FormViewer schema={mockSchema} config={config} />
    );

    // Fill all required fields
    const nameInput = getByLabelText(/What is your name?/i);
    fireEvent.change(nameInput, { target: { value: "John" } });
    fireEvent.click(getByText("Next"));

    await waitFor(() => {
      const emailInput = getByLabelText(/What is your email?/i);
      expect(emailInput).toBeInTheDocument();
    });

    const emailInput = getByLabelText(/What is your email?/i);
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.click(getByText("Next"));

    await waitFor(() => {
      // Check we're on the rating page
      expect(getByText(/How would you rate our service?/i)).toBeInTheDocument();
    });

    // Rate the service (optional field)
    const ratingButtons = document.querySelectorAll('[aria-label*="out of"]');
    if (ratingButtons.length > 0) {
      fireEvent.click(ratingButtons[4]); // 5 stars
    }

    // Submit form
    fireEvent.click(getByText("Submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("Analytics event:"),
          expect.objectContaining({
            event_type: "form_submit",
            form_id: "test-form",
            is_partial: false,
          })
        );
      },
      { timeout: 3000 }
    );
  });

  it("should batch analytics events", async () => {
    const { getByLabelText } = render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Make multiple rapid changes
    const nameInput = getByLabelText(/What is your name?/i);
    for (let i = 1; i <= 10; i++) {
      fireEvent.change(nameInput, { target: { value: `Name${i}` } });
    }

    // Wait for batch to be sent
    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/analytics/batch",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: expect.stringContaining('"events"'),
          })
        );
      },
      { timeout: 6000 }
    ); // Allow time for batch interval
  });

  it("should include device info and UTM parameters", async () => {
    // Mock window.location.search
    Object.defineProperty(window, "location", {
      value: {
        search: "?utm_source=newsletter&utm_medium=email&utm_campaign=launch",
      },
      writable: true,
    });

    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.objectContaining({
          device_type: expect.any(String),
          browser: expect.any(String),
          os: expect.any(String),
          utm_source: "newsletter",
          utm_medium: "email",
          utm_campaign: "launch",
        })
      );
    });
  });

  it("should track time on step", async () => {
    const { getByLabelText, getByText } = render(
      <FormViewer schema={mockSchema} config={mockConfig} />
    );

    // Wait a bit on first step
    const nameInput = getByLabelText(/What is your name?/i);
    fireEvent.change(nameInput, { target: { value: "John" } });

    // Wait 100ms before proceeding
    await new Promise((resolve) => setTimeout(resolve, 100));

    fireEvent.click(getByText("Next"));

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.objectContaining({
          event_type: "step_complete",
          form_id: "test-form",
          step_id: "name",
          time_on_step_ms: expect.any(Number),
        })
      );
    });
  });

  it("should not track analytics when disabled", async () => {
    const disabledConfig = { ...mockConfig, enableAnalytics: false };
    render(<FormViewer schema={mockSchema} config={disabledConfig} />);

    await waitFor(() => {
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Analytics event:"),
        expect.anything()
      );
    });
  });

  it("should handle analytics API errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    (globalThis as any).fetch.mockRejectedValueOnce(new Error("Network error"));

    const { getByLabelText } = render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Trigger multiple events to reach batch size
    const nameInput = getByLabelText(/What is your name?/i);
    for (let i = 1; i <= 10; i++) {
      fireEvent.change(nameInput, { target: { value: `Name${i}` } });
    }

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Analytics batch error:", expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});
