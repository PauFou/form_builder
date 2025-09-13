import { renderHook, act } from "@testing-library/react";
import { useGDPRStore } from "../gdpr-store";

// Mock fetch
global.fetch = jest.fn();

describe("useGDPRStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockClear();

    // Reset store state
    useGDPRStore.setState({
      exportStatus: "idle",
      exportProgress: 0,
      exportError: undefined,
      deletionStatus: "idle",
      deletionError: undefined,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const { result } = renderHook(() => useGDPRStore());

      expect(result.current.exportStatus).toBe("idle");
      expect(result.current.exportProgress).toBe(0);
      expect(result.current.exportError).toBeUndefined();
      expect(result.current.deletionStatus).toBe("idle");
      expect(result.current.deletionError).toBeUndefined();
    });
  });

  describe("exportData", () => {
    it("successfully exports data in JSON format", async () => {
      const mockData = { user: { id: "123", email: "test@example.com" } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGDPRStore());

      let exportResult: any;
      await act(async () => {
        exportResult = await result.current.exportData("123", "json");
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/gdpr/export/123?format=json");
      expect(exportResult).toEqual({ data: mockData, format: "json" });
      expect(result.current.exportStatus).toBe("success");
      expect(result.current.exportProgress).toBe(100);
      expect(result.current.exportError).toBeUndefined();
    });

    it("successfully exports data in CSV format", async () => {
      const mockData = { csv: "id,email\n123,test@example.com" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGDPRStore());

      let exportResult: any;
      await act(async () => {
        exportResult = await result.current.exportData("456", "csv");
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/gdpr/export/456?format=csv");
      expect(exportResult).toEqual({ data: mockData, format: "csv" });
      expect(result.current.exportStatus).toBe("success");
      expect(result.current.exportProgress).toBe(100);
    });

    it("handles export error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useGDPRStore());

      try {
        await act(async () => {
          await result.current.exportData("123", "json");
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.exportStatus).toBe("error");
      expect(result.current.exportError).toBe("Failed to export data");
      expect(result.current.exportProgress).toBe(0);
    });

    it("handles network error during export", async () => {
      const error = new Error("Network error");
      (global.fetch as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useGDPRStore());

      try {
        await act(async () => {
          await result.current.exportData("123", "json");
        });
      } catch (err) {
        // Expected to throw
      }

      expect(result.current.exportStatus).toBe("error");
      expect(result.current.exportError).toBe("Network error");
      expect(result.current.exportProgress).toBe(0);
    });

    it("updates progress during export", async () => {
      let resolveExport: any;
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveExport = resolve;
          })
      );

      const { result } = renderHook(() => useGDPRStore());

      act(() => {
        result.current.exportData("123", "json");
      });

      expect(result.current.exportStatus).toBe("loading");
      expect(result.current.exportProgress).toBe(0);

      // Advance timer to simulate progress updates
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.exportProgress).toBe(10);

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.exportProgress).toBe(20);

      act(() => {
        jest.advanceTimersByTime(700); // Total 900ms
      });
      expect(result.current.exportProgress).toBe(90);

      // Resolve the export
      await act(async () => {
        resolveExport({
          ok: true,
          json: async () => ({ data: "test" }),
        });
      });

      expect(result.current.exportStatus).toBe("success");
      expect(result.current.exportProgress).toBe(100);
    });

    it("clears interval on success", async () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: "test" }),
      });

      const { result } = renderHook(() => useGDPRStore());

      await act(async () => {
        await result.current.exportData("123", "json");
      });

      // The interval should have been cleared
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(result.current.exportStatus).toBe("success");
    });
  });

  describe("deleteData", () => {
    it("successfully deletes user data", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useGDPRStore());

      await act(async () => {
        await result.current.deleteData("123");
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/gdpr/delete/123", {
        method: "DELETE",
      });
      expect(result.current.deletionStatus).toBe("success");
      expect(result.current.deletionError).toBeUndefined();
    });

    it("handles deletion error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useGDPRStore());

      try {
        await act(async () => {
          await result.current.deleteData("123");
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.deletionStatus).toBe("error");
      expect(result.current.deletionError).toBe("Failed to delete data");
    });

    it("handles network error during deletion", async () => {
      const error = new Error("Connection refused");
      (global.fetch as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useGDPRStore());

      try {
        await act(async () => {
          await result.current.deleteData("123");
        });
      } catch (err) {
        // Expected to throw
      }

      expect(result.current.deletionStatus).toBe("error");
      expect(result.current.deletionError).toBe("Connection refused");
    });

    it("sets loading state during deletion", async () => {
      let resolveDeletion: any;
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDeletion = resolve;
          })
      );

      const { result } = renderHook(() => useGDPRStore());

      act(() => {
        result.current.deleteData("123");
      });

      expect(result.current.deletionStatus).toBe("loading");

      await act(async () => {
        resolveDeletion({ ok: true });
      });

      expect(result.current.deletionStatus).toBe("success");
    });
  });

  describe("reset functions", () => {
    it("resets export status", () => {
      const { result } = renderHook(() => useGDPRStore());

      // Set some non-idle state
      act(() => {
        useGDPRStore.setState({
          exportStatus: "error",
          exportProgress: 50,
          exportError: "Some error",
        });
      });

      act(() => {
        result.current.resetExportStatus();
      });

      expect(result.current.exportStatus).toBe("idle");
      expect(result.current.exportProgress).toBe(0);
      expect(result.current.exportError).toBeUndefined();
    });

    it("resets deletion status", () => {
      const { result } = renderHook(() => useGDPRStore());

      // Set some non-idle state
      act(() => {
        useGDPRStore.setState({
          deletionStatus: "error",
          deletionError: "Delete failed",
        });
      });

      act(() => {
        result.current.resetDeletionStatus();
      });

      expect(result.current.deletionStatus).toBe("idle");
      expect(result.current.deletionError).toBeUndefined();
    });
  });

  describe("concurrent operations", () => {
    it("handles concurrent export and deletion", async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("export")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ exported: true }),
          });
        }
        if (url.includes("delete")) {
          return Promise.resolve({ ok: true });
        }
      });

      const { result } = renderHook(() => useGDPRStore());

      await act(async () => {
        // Start both operations concurrently
        const exportPromise = result.current.exportData("123", "json");
        const deletePromise = result.current.deleteData("123");

        await Promise.all([exportPromise, deletePromise]);
      });

      expect(result.current.exportStatus).toBe("success");
      expect(result.current.deletionStatus).toBe("success");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling edge cases", () => {
    it("handles non-Error objects in export catch", async () => {
      (global.fetch as jest.Mock).mockRejectedValue("String error");

      const { result } = renderHook(() => useGDPRStore());

      try {
        await act(async () => {
          await result.current.exportData("123", "json");
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.exportStatus).toBe("error");
      expect(result.current.exportError).toBe("Unknown error");
    });

    it("handles non-Error objects in deletion catch", async () => {
      (global.fetch as jest.Mock).mockRejectedValue({ code: 500 });

      const { result } = renderHook(() => useGDPRStore());

      try {
        await act(async () => {
          await result.current.deleteData("123");
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.deletionStatus).toBe("error");
      expect(result.current.deletionError).toBe("Unknown error");
    });
  });
});
