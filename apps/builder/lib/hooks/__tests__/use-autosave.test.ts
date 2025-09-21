import { renderHook, act } from "@testing-library/react";
import { toast } from "react-hot-toast";
import { useAutosave } from "../use-autosave";
import { useFormBuilderStore } from "../../stores/form-builder-store";
import { formsApi } from "../../api/forms";

// Mock dependencies
jest.mock("react-hot-toast");
jest.mock("../../stores/form-builder-store");
jest.mock("../../api/forms");

// Mock timers
jest.useFakeTimers();

describe("useAutosave", () => {
  const mockMarkClean = jest.fn();
  const mockForm = { id: "test-form", title: "Test Form", pages: [] };
  const mockConsoleError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    console.log = jest.fn();
    console.error = mockConsoleError;

    // Mock formsApi.update to resolve by default
    (formsApi.update as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not autosave when formId is null", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      isDirty: true,
      markClean: mockMarkClean,
    });

    renderHook(() => useAutosave(null));

    jest.advanceTimersByTime(2000);

    expect(mockMarkClean).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it("does not autosave when form is null", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: null,
      isDirty: true,
      markClean: mockMarkClean,
    });

    renderHook(() => useAutosave("test-id"));

    jest.advanceTimersByTime(2000);

    expect(mockMarkClean).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it("does not autosave when form is not dirty", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      isDirty: false,
      markClean: mockMarkClean,
    });

    renderHook(() => useAutosave("test-id"));

    jest.advanceTimersByTime(2000);

    expect(mockMarkClean).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it("autosaves after default delay when form is dirty", async () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      isDirty: true,
      markClean: mockMarkClean,
    });

    renderHook(() => useAutosave("test-id"));

    // Should not save immediately
    expect(mockMarkClean).not.toHaveBeenCalled();

    // Advance timer to trigger autosave
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Run the inner setTimeout
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    expect(mockMarkClean).toHaveBeenCalled();
    expect(formsApi.update).toHaveBeenCalledWith("test-id", expect.any(Object));
  });

  it("autosaves with custom delay", async () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      isDirty: true,
      markClean: mockMarkClean,
    });

    renderHook(() => useAutosave("test-id", 500));

    // Should not save before delay
    jest.advanceTimersByTime(400);
    expect(mockMarkClean).not.toHaveBeenCalled();

    // Should save after delay
    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    // Run the inner setTimeout
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    expect(mockMarkClean).toHaveBeenCalled();
  });

  it("debounces autosave on rapid changes", async () => {
    const { rerender } = renderHook(({ form }) => useAutosave("test-id"), {
      initialProps: {
        form: { ...mockForm, title: "Initial" },
      },
    });

    // Update store mock for each change
    (useFormBuilderStore as unknown as jest.Mock)
      .mockReturnValueOnce({
        form: { ...mockForm, title: "Initial" },
        isDirty: true,
        markClean: mockMarkClean,
      })
      .mockReturnValueOnce({
        form: { ...mockForm, title: "Change 1" },
        isDirty: true,
        markClean: mockMarkClean,
      })
      .mockReturnValueOnce({
        form: { ...mockForm, title: "Change 2" },
        isDirty: true,
        markClean: mockMarkClean,
      })
      .mockReturnValue({
        form: { ...mockForm, title: "Final" },
        isDirty: true,
        markClean: mockMarkClean,
      });

    // Simulate rapid changes
    jest.advanceTimersByTime(500);
    rerender({ form: { ...mockForm, title: "Change 1" } });

    jest.advanceTimersByTime(500);
    rerender({ form: { ...mockForm, title: "Change 2" } });

    jest.advanceTimersByTime(500);
    rerender({ form: { ...mockForm, title: "Final" } });

    // Should not have saved yet
    expect(mockMarkClean).not.toHaveBeenCalled();

    // Complete the final timeout
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Run the inner setTimeout
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    // Should save only once
    expect(mockMarkClean).toHaveBeenCalledTimes(1);
  });

  it("handles save errors", async () => {
    // Mock the save operation to fail
    const mockError = new Error("Save failed");

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      isDirty: true,
      markClean: mockMarkClean,
    });

    // Mock formsApi.update to reject
    (formsApi.update as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAutosave("form-1", 100));

    // Manually trigger save to test error handling
    await act(async () => {
      await result.current.saveNow();
    });

    // Check that error state is set
    expect(result.current.error).toBe("Save failed");
    expect(result.current.isSaving).toBe(false);

    // Check that error was logged and toast shown
    expect(mockConsoleError).toHaveBeenCalledWith("Autosave failed:", mockError);
    expect(toast.error).toHaveBeenCalledWith("Failed to save changes", expect.any(Object));
  });

  it("cleans up timeout on unmount", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      isDirty: true,
      markClean: mockMarkClean,
    });

    const { unmount } = renderHook(() => useAutosave("test-id"));

    // Advance timer partially
    jest.advanceTimersByTime(500);

    // Unmount before save completes
    unmount();

    // Complete the timer
    jest.advanceTimersByTime(500);

    // Should not save after unmount
    expect(mockMarkClean).not.toHaveBeenCalled();
  });

  it("handles dependency changes", async () => {
    const { rerender } = renderHook(({ formId, delay }) => useAutosave(formId, delay), {
      initialProps: { formId: "form-1", delay: 1000 },
    });

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      form: mockForm,
      isDirty: true,
      markClean: mockMarkClean,
    });

    // Change formId
    rerender({ formId: "form-2", delay: 1000 });

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Run the inner setTimeout
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    expect(mockMarkClean).toHaveBeenCalled();
  });
});
