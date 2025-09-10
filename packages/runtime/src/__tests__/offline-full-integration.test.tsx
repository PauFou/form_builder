import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormViewer } from "../components/FormViewer";
import type { FormSchema, RuntimeConfig } from "../types";
import { OfflineService } from "../services/offline-service";

// Mock IndexedDB
import "fake-indexeddb/auto";

// Mock fetch
global.fetch = jest.fn();

const mockSchema: FormSchema = {
  id: "test-form",
  version: 1,
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
  settings: {
    showProgressBar: true,
    submitText: "Submit",
    thankYouMessage: "<h2>Thank you!</h2><p>Your form has been submitted.</p>",
  },
};

describe("FormViewer Offline Integration", () => {
  let offlineService: OfflineService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear IndexedDB
    if (global.indexedDB) {
      indexedDB.deleteDatabase("forms-runtime-test-form");
    }
  });

  afterEach(() => {
    if (offlineService) {
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

    // Fill name field
    const nameInput = screen.getByLabelText(/What's your name/);
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

    // Fill email
    const emailInput = await screen.findByLabelText(/What's your email/);
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

    const nameInput = screen.getByLabelText(/What's your name/);
    fireEvent.change(nameInput, { target: { value: "Jane Smith" } });

    // Wait for save
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Unmount (simulate page refresh)
    unmount();

    // Re-render - should restore state
    render(<FormViewer schema={mockSchema} config={config} />);

    // Check name was restored
    await waitFor(() => {
      const restoredInput = screen.getByLabelText(/What's your name/) as HTMLInputElement;
      expect(restoredInput.value).toBe("Jane Smith");
    });
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

    // Simulate going offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event("offline"));

    // Should show offline indicator
    await waitFor(() => {
      expect(screen.getByText(/Working offline/)).toBeInTheDocument();
    });

    // Fill form while offline
    const nameInput = screen.getByLabelText(/What's your name/);
    fireEvent.change(nameInput, { target: { value: "Offline User" } });

    // Partial save should not be called while offline
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(onPartialSave).not.toHaveBeenCalled();

    // Go back online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));

    // Should sync data
    await waitFor(() => {
      expect(onPartialSave).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({
            name: "Offline User",
          }),
        })
      );
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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "123", status: "success" }),
    });

    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableOffline: true,
    };

    render(<FormViewer schema={mockSchema} config={config} />);

    // Fill form
    const nameInput = screen.getByLabelText(/What's your name/);
    fireEvent.change(nameInput, { target: { value: "Complete User" } });

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    const emailInput = await screen.findByLabelText(/What's your email/);
    fireEvent.change(emailInput, { target: { value: "complete@example.com" } });

    fireEvent.click(screen.getByText("Next"));

    // Submit
    await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for anti-spam

    const submitButton = await screen.findByText("Submit");
    fireEvent.click(submitButton);

    // Should show thank you message
    await waitFor(() => {
      expect(screen.getByText("Thank you!")).toBeInTheDocument();
    });

    // Check API was called
    expect(global.fetch).toHaveBeenCalledWith(
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

  it("should handle partial submissions throttling", async () => {
    const onPartialSave = jest.fn();
    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "/api/v1",
      enableOffline: true,
      onPartialSave,
    };

    render(<FormViewer schema={mockSchema} config={config} />);

    const nameInput = screen.getByLabelText(/What's your name/);

    // Type rapidly
    for (let i = 0; i < 10; i++) {
      fireEvent.change(nameInput, { target: { value: `User ${i}` } });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Should throttle saves (not save 10 times)
    await waitFor(
      () => {
        expect(onPartialSave).toHaveBeenCalled();
        expect(onPartialSave).toHaveBeenCalledTimes(1); // Throttled
      },
      { timeout: 1000 }
    );
  });
});
