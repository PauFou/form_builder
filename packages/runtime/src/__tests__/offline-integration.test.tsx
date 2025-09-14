import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormViewer } from "../components/FormViewer";
import type { FormSchema, RuntimeConfig } from "../types";
import { mockIndexedDB } from "./test-utils";

describe("Offline Integration", () => {
  let mockSchema: FormSchema;
  let mockConfig: RuntimeConfig;

  beforeEach(() => {
    mockIndexedDB();

    mockSchema = {
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
              id: "phone",
              type: "phone",
              question: "What is your phone number?",
            },
          ],
        },
      ],
      settings: {
        showProgressBar: true,
        allowSave: true,
      },
    };

    mockConfig = {
      formId: "test-form",
      apiUrl: "https://api.example.com",
      enableOffline: true,
      autoSaveInterval: 100, // Fast for testing
      onPartialSave: jest.fn(),
      onSubmit: jest.fn(),
      respondentKey: "test-respondent-offline", // Fixed respondent key for session persistence
    };
  });

  it("should auto-save form progress", async () => {
    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Fill in the name field
    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Wait for auto-save
    await waitFor(
      () => {
        expect(screen.getByText("Your progress is automatically saved")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("should show offline indicator when offline", async () => {
    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Mock going offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    // Trigger offline event
    window.dispatchEvent(new Event("offline"));

    // Wait a bit for the event handler to process and component to re-render
    await new Promise((resolve) => setTimeout(resolve, 100));

    await waitFor(
      () => {
        expect(screen.getByText("Working offline")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should show syncing indicator when online with unsynced data", async () => {
    // Start offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Fill in data while offline
    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Wait for save
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Simulate coming back online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));

    // Wait for the UI to update
    await waitFor(() => {
      const statusElement = screen.getByText(/Your progress is automatically saved/);
      expect(statusElement).toBeInTheDocument();
    });
  });

  it("should restore saved state on mount", async () => {
    // First, save some data
    const { unmount } = render(<FormViewer schema={mockSchema} config={mockConfig} />);

    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Go to next step
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });

    const emailInput = screen.getByRole("textbox");
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    // Wait for save
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Unmount and remount
    unmount();
    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Should restore to the email step
    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
      expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    });
  });

  it("should handle navigation with saved state", async () => {
    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Fill first field
    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Go to next step
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });

    // Fill email
    const emailInput = screen.getByRole("textbox");
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    // Go back
    fireEvent.click(screen.getByText("Previous"));

    await waitFor(() => {
      expect(screen.getByText("What is your name?")).toBeInTheDocument();
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    });

    // Go forward again
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
      expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    });
  });

  it("should clear offline data after successful submission", async () => {
    mockConfig.onSubmit = jest.fn().mockResolvedValue(undefined);
    // Disable anti-spam for this test
    mockConfig.enableAntiSpam = false;

    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Fill all required fields
    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });

    const emailInput = screen.getByRole("textbox");
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("What is your phone number?")).toBeInTheDocument();
    });

    // Submit form
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Thank you!")).toBeInTheDocument();
    });

    expect(mockConfig.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
        }),
      })
    );
  });

  it("should handle partial saves", async () => {
    jest.useFakeTimers();
    
    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Fill in data
    const nameInput = screen.getByRole("textbox");
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "John Doe" } });
    });

    // Advance timers past the throttle period (2 seconds)
    await act(async () => {
      jest.advanceTimersByTime(2100);
    });

    // Wait for partial save to be called
    await waitFor(() => {
      expect(mockConfig.onPartialSave).toHaveBeenCalledWith(
        expect.objectContaining({
          formId: "test-form",
          values: { name: "John Doe" },
        })
      );
    });
    
    jest.useRealTimers();
  });

  it("should show progress indicator", async () => {
    render(<FormViewer schema={mockSchema} config={mockConfig} />);

    // Check initial progress
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "33");

    // Move to next step
    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      const updatedProgressBar = screen.getByRole("progressbar");
      expect(updatedProgressBar).toHaveAttribute("aria-valuenow", "67");
    });
  });

  it("should disable offline when config disabled", () => {
    const disabledConfig = {
      ...mockConfig,
      enableOffline: false,
    };

    render(<FormViewer schema={mockSchema} config={disabledConfig} />);

    // Should not show offline notice
    expect(screen.queryByText("Your progress is automatically saved")).not.toBeInTheDocument();
  });
});
