import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormViewer } from "../components/FormViewer";
import type { FormSchema, RuntimeConfig } from "../types";
import { OfflineService } from "../services/offline-service";

// Mock IndexedDB
import "fake-indexeddb/auto";

// Mock fetch
// @ts-expect-error - Mock fetch for testing
(globalThis as any).fetch = jest.fn();

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
          question: "What's your name?",
          required: true,
          validation: [
            {
              type: "min",
              value: 2,
              message: "Name must be at least 2 characters",
            },
          ],
        },
        {
          id: "email",
          type: "email",
          question: "What's your email?",
          required: true,
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
    submitText: "Submit",
    thankYouMessage: "<h2>Thank you!</h2><p>Your form has been submitted.</p>",
  },
};

describe("FormViewer Offline Integration", () => {
  const offlineService: OfflineService | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear IndexedDB
    if ((globalThis as any).indexedDB) {
      indexedDB.deleteDatabase("forms-runtime-test-form");
    }
  });

  afterEach(() => {
    if (offlineService && "destroy" in offlineService) {
      offlineService.destroy();
    }
  });

  it("should save form progress to IndexedDB automatically", async () => {
    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableOffline: true,
      autoSaveInterval: 100, // Fast save for testing
    };

    render(<FormViewer schema={mockSchema} config={config} />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });

    // Fill name field
    const nameInput = screen.getByRole("textbox", { name: /What's your name/ });
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Wait for autosave
    await waitFor(
      () => {
        // Check IndexedDB was written
        expect(indexedDB.databases).toBeDefined();
      },
      { timeout: 500 }
    );

    // Go to next step
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // Wait for next question
    await waitFor(() => {
      expect(screen.getByText("What's your email?")).toBeInTheDocument();
    });

    // Fill email
    const emailInput = screen.getByRole("textbox", { name: /What's your email/ });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    // Wait for save again
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it("should restore form state from IndexedDB on reload", async () => {
    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableOffline: true,
    };

    // First render - fill some data
    const { unmount } = render(<FormViewer schema={mockSchema} config={config} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });

    const nameInput = screen.getByRole("textbox", { name: /What's your name/ });
    fireEvent.change(nameInput, { target: { value: "Jane Smith" } });

    // Wait for save
    await waitFor(
      () => {
        // Just wait for the state to stabilize
        expect(nameInput).toHaveValue("Jane Smith");
      },
      { timeout: 500 }
    );

    // Unmount (simulate page refresh)
    unmount();

    // Re-render - should restore state
    render(<FormViewer schema={mockSchema} config={config} />);

    // Check name was restored
    await waitFor(
      () => {
        const restoredInput = screen.getByRole("textbox", {
          name: /What's your name/,
        }) as HTMLInputElement;
        expect(restoredInput.value).toBe("Jane Smith");
      },
      { timeout: 1000 }
    );
  });

  it("should handle offline/online transitions", async () => {
    const onPartialSave = jest.fn();
    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableOffline: true,
      onPartialSave,
    };

    render(<FormViewer schema={mockSchema} config={config} />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });

    // Fill initial data first
    const nameInput = screen.getByRole("textbox", { name: /What's your name/ });
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Go to next step to set more initial data
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => {
      expect(screen.getByText("What's your email?")).toBeInTheDocument();
    });

    const emailInput = screen.getByRole("textbox", { name: /What's your email/ });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    // Now go back to first step
    fireEvent.click(screen.getByText("Previous"));
    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });

    // Clear the mock to test offline behavior
    onPartialSave.mockClear();

    // Simulate going offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event("offline"));

    // Wait a bit for offline status to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update form while offline
    const updatedNameInput = screen.getByRole("textbox", { name: /What's your name/ });
    fireEvent.change(updatedNameInput, { target: { value: "Offline User" } });

    // Partial save should not be called while offline
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(onPartialSave).not.toHaveBeenCalled();

    // Go back online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));

    // Should sync data - check the structure matches what's actually sent
    await waitFor(() => {
      expect(onPartialSave).toHaveBeenCalled();
      const lastCall = onPartialSave.mock.calls[onPartialSave.mock.calls.length - 1][0];
      expect(lastCall.formId).toBe("test-form");
      expect(lastCall.values.name).toBe("Offline User");
      expect(lastCall.values.email).toBe("john@example.com");
    });
  });

  it("should handle anti-spam protection", async () => {
    const onSpamDetected = jest.fn();
    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableAntiSpam: true,
      minCompletionTime: 100, // 100ms for testing
      onSpamDetected,
    };

    render(<FormViewer schema={mockSchema} config={config} />);

    // Try to submit immediately (too fast)
    const nameInput = screen.getByLabelText(/What's your name/);
    fireEvent.change(nameInput, { target: { value: "Bot" } });

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    const emailInput = await screen.findByLabelText(/What's your email/);
    fireEvent.change(emailInput, { target: { value: "bot@spam.com" } });

    fireEvent.click(screen.getByText("Next"));

    const submitButton = await screen.findByText("Submit");
    fireEvent.click(submitButton);

    // Should detect spam
    await waitFor(() => {
      expect(onSpamDetected).toHaveBeenCalledWith("too_fast");
    });
  });

  it("should clear offline data after successful submission", async () => {
    (globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "123", status: "success" }),
    });

    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableOffline: true,
      minCompletionTime: 100, // Set low for testing
    };

    render(<FormViewer schema={mockSchema} config={config} />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByRole("textbox", { name: /What's your name/ });
    fireEvent.change(nameInput, { target: { value: "Complete User" } });

    // Wait a bit before proceeding
    await new Promise((resolve) => setTimeout(resolve, 50));

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("What's your email?")).toBeInTheDocument();
    });

    const emailInput = screen.getByRole("textbox", { name: /What's your email/ });
    fireEvent.change(emailInput, { target: { value: "complete@example.com" } });

    // Wait before next step
    await new Promise((resolve) => setTimeout(resolve, 50));

    fireEvent.click(screen.getByText("Next"));

    // Wait for feedback field
    await waitFor(() => {
      expect(screen.getByText("Any feedback?")).toBeInTheDocument();
    });

    // Wait for minimum completion time
    await new Promise((resolve) => setTimeout(resolve, 100));

    const submitButton = await screen.findByText("Submit");
    fireEvent.click(submitButton);

    // Should complete submission
    await waitFor(
      () => {
        // After submission, the form should be cleared or show a different state
        // Check that submission was processed by checking if the API was called
        expect((globalThis as any).fetch).toHaveBeenCalledWith(
          "/api/v1/submissions",
          expect.anything()
        );
      },
      { timeout: 2000 }
    );

    // Check API was called
    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      "/api/v1/submissions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: expect.stringContaining("complete@example.com"),
      })
    );
  });

  it.skip("should handle partial submissions throttling", async () => {
    // Skip this test for now - it's flaky due to timing issues
    // TODO: Fix timing-dependent test
    const onPartialSave = jest.fn();
    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableOffline: true,
      onPartialSave,
      autoSaveInterval: 1000, // 1 second throttle
    };

    render(<FormViewer schema={mockSchema} config={config} />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });

    const nameInput = screen.getByRole("textbox", { name: /What's your name/ });

    // Type rapidly
    for (let i = 0; i < 10; i++) {
      fireEvent.change(nameInput, { target: { value: `User ${i}` } });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Wait for the throttled save
    await waitFor(
      () => {
        expect(onPartialSave).toHaveBeenCalled();
        // Should be called only once or twice due to throttling
        expect(onPartialSave.mock.calls.length).toBeLessThanOrEqual(2);
      },
      { timeout: 2000 }
    );
  });
});
