import { renderHook, waitFor } from "@testing-library/react";
import { useResume, createResumeLink } from "../hooks/use-resume";
import { OfflineService } from "../services/offline-service";
import type { RuntimeConfig } from "../types";
import { mockIndexedDB } from "./test-utils";

// Mock the OfflineService
jest.mock("../services/offline-service");

describe("useResume", () => {
  beforeEach(() => {
    mockIndexedDB();
    jest.clearAllMocks();
  });

  it("should return no resumable data when offline is disabled", async () => {
    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "https://api.example.com",
      enableOffline: false,
    };

    const { result } = renderHook(() => useResume(config));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasResumableData).toBe(false);
    expect(result.current.resumeUrl).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
  });

  it("should detect resumable data", async () => {
    const mockGetState = jest.fn().mockResolvedValue({
      state: {
        currentStep: 2,
        values: { name: "John" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      },
      data: {
        formId: "test-form",
        values: { name: "John" },
        startedAt: "2025-01-01T00:00:00Z",
        metadata: {
          lastUpdated: "2025-01-01T01:00:00Z",
        },
      },
      respondentKey: "user-123",
    });

    const mockDestroy = jest.fn();

    (OfflineService as jest.MockedClass<typeof OfflineService>).mockImplementation(
      () =>
        ({
          getState: mockGetState,
          destroy: mockDestroy,
        }) as any
    );

    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "https://api.example.com",
      enableOffline: true,
    };

    const { result } = renderHook(() => useResume(config));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasResumableData).toBe(true);
    expect(result.current.resumeUrl).toContain("resume=user-123");
    expect(result.current.lastUpdated).toEqual(new Date("2025-01-01T01:00:00Z"));
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("should handle completed forms as non-resumable", async () => {
    const mockGetState = jest.fn().mockResolvedValue({
      state: {
        currentStep: 5,
        values: { name: "John" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: true,
      },
      data: {
        formId: "test-form",
        values: { name: "John" },
        startedAt: "2025-01-01T00:00:00Z",
        completedAt: "2025-01-01T02:00:00Z",
      },
      respondentKey: "user-123",
    });

    const mockDestroy = jest.fn();

    (OfflineService as jest.MockedClass<typeof OfflineService>).mockImplementation(
      () =>
        ({
          getState: mockGetState,
          destroy: mockDestroy,
        }) as any
    );

    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "https://api.example.com",
      enableOffline: true,
    };

    const { result } = renderHook(() => useResume(config));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasResumableData).toBe(false);
    expect(result.current.resumeUrl).toBeNull();
  });

  it("should handle errors gracefully", async () => {
    const mockGetState = jest.fn().mockRejectedValue(new Error("IndexedDB error"));
    const mockDestroy = jest.fn();

    (OfflineService as jest.MockedClass<typeof OfflineService>).mockImplementation(
      () =>
        ({
          getState: mockGetState,
          destroy: mockDestroy,
        }) as any
    );

    const config: RuntimeConfig = {
      formId: "test-form",
      apiUrl: "https://api.example.com",
      enableOffline: true,
    };

    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useResume(config));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasResumableData).toBe(false);
    expect(result.current.resumeUrl).toBeNull();
    expect(consoleError).toHaveBeenCalledWith("Failed to check resumable data:", expect.any(Error));

    consoleError.mockRestore();
  });
});

describe("createResumeLink", () => {
  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    (window as any).location = new URL("https://forms.example.com/form");
  });

  it("should create a resume link with form and respondent", () => {
    const link = createResumeLink("form-123", "user-456");

    expect(link).toContain("form=form-123");
    expect(link).toContain("resume=user-456");

    const url = new URL(link);
    expect(url.searchParams.get("form")).toBe("form-123");
    expect(url.searchParams.get("resume")).toBe("user-456");
  });

  it("should preserve existing query parameters", () => {
    (window as any).location = new URL("https://forms.example.com/form?utm_source=email");

    const link = createResumeLink("form-123", "user-456");

    const url = new URL(link);
    expect(url.searchParams.get("utm_source")).toBe("email");
    expect(url.searchParams.get("form")).toBe("form-123");
    expect(url.searchParams.get("resume")).toBe("user-456");
  });
});
