import { PartialSaveService } from "../services/partial-save-service";
import type { RuntimeConfig } from "../types";

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
});

describe("PartialSaveService", () => {
  let service: PartialSaveService;
  let config: RuntimeConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (fetch as jest.Mock).mockClear();

    config = {
      formId: "test-form",
      apiUrl: "https://api.example.com",
      respondentKey: "test-respondent",
    };

    // Mock Date.now and Math.random for consistent sessionKey generation
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    service = new PartialSaveService(config);
  });

  afterEach(() => {
    service.destroy();
    jest.restoreAllMocks();
  });

  describe("localStorage operations", () => {
    it("should save data to localStorage", async () => {
      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John", email: "john@example.com" },
        currentStep: 2,
        progress: 50,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await service.save(data);

      // Check localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      expect(savedData.values).toEqual(data.values);
      expect(savedData.currentStep).toBe(2);
      expect(savedData.progress).toBe(50);
    });

    it("should load data from localStorage", async () => {
      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John", email: "john@example.com" },
        currentStep: 2,
        progress: 50,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };

      const sessionKey = `form-partial-test-form-test-respondent`;
      localStorageMock.setItem(sessionKey, JSON.stringify(data));

      const loaded = await service.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.values).toEqual(data.values);
      expect(loaded?.currentStep).toBe(2);
    });

    it("should handle corrupted localStorage data", async () => {
      const sessionKey = `form-partial-test-form-test-respondent`;
      localStorageMock.setItem(sessionKey, "invalid json");

      const loaded = await service.load();
      expect(loaded).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(sessionKey);
    });

    it("should remove old data when saving if quota exceeded", async () => {
      const oldKey = "form-partial-old-form-old-respondent";
      const oldData = {
        savedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days old
      };
      
      // Store existing data and override localStorage methods
      let store: Record<string, string> = {
        [oldKey]: JSON.stringify(oldData),
      };
      
      let setItemCallCount = 0;
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        setItemCallCount++;
        if (setItemCallCount === 1) {
          // First call should fail with quota exceeded
          const error = new DOMException("The quota has been exceeded.", "QuotaExceededError");
          throw error;
        }
        // Second call should succeed
        store[key] = value;
      });
      
      localStorageMock.getItem.mockImplementation((key: string) => store[key] || null);
      localStorageMock.removeItem.mockImplementation((key: string) => delete store[key]);
      localStorageMock.key.mockImplementation((index: number) => Object.keys(store)[index] || null);
      Object.defineProperty(localStorageMock, "length", {
        get: () => Object.keys(store).length,
      });

      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John" },
        currentStep: 1,
        progress: 25,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await service.save(data);

      // Should try to save twice (once failed, once after cleanup)
      expect(setItemCallCount).toBe(2);
      // Old data should have been removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(oldKey);
    });
  });

  describe("API operations", () => {
    it("should save to API when apiUrl is provided", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "partial-123",
          resumeToken: "token-123",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John" },
        currentStep: 1,
        progress: 25,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await service.save(data);

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(fetch).toHaveBeenCalledWith(
        "https://api.example.com/partials",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"formId":"test-form"'),
        })
      );
    });

    it("should use custom onPartialSave handler", async () => {
      const onPartialSave = jest.fn().mockResolvedValue(undefined);
      const customConfig = { ...config, onPartialSave };
      const customService = new PartialSaveService(customConfig);

      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John" },
        currentStep: 1,
        progress: 25,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await customService.save(data);

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(onPartialSave).toHaveBeenCalledWith(data);
      expect(fetch).not.toHaveBeenCalled();

      customService.destroy();
    });

    it("should handle API errors gracefully", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const errorHandler = jest.fn();
      service.on("save:error", errorHandler);

      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John" },
        currentStep: 1,
        progress: 25,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await service.save(data);

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.calls[0][0].error.message).toBe("Network error");
    });

    it("should load from API with resume token", async () => {
      // Mock URL params
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        href: "https://example.com?resume=token-123",
        search: "?resume=token-123",
      };

      // Create URLSearchParams mock
      const mockURLSearchParams = {
        get: jest.fn((key: string) => key === "resume" ? "token-123" : null),
      };
      (global as any).URLSearchParams = jest.fn(() => mockURLSearchParams);

      const apiService = new PartialSaveService(config);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          formId: "test-form",
          respondentKey: "test-respondent",
          values: { name: "John", email: "john@example.com" },
          currentStep: 3,
          progress: 75,
          startedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        }),
      });

      const loaded = await apiService.load();

      expect(fetch).toHaveBeenCalledWith(
        "https://api.example.com/partials/token-123"
      );
      expect(loaded?.values).toEqual({ name: "John", email: "john@example.com" });
      expect(loaded?.currentStep).toBe(3);

      apiService.destroy();
      
      // Restore location
      (window as any).location = originalLocation;
    });
  });

  describe("resume URL generation", () => {
    it("should generate resume URL with token", async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        href: "https://example.com/form",
      };
      
      // Mock URL constructor
      const mockURL = {
        searchParams: new Map(),
        toString: () => "https://example.com/form?resume=token-123",
      };
      mockURL.searchParams.set = jest.fn();
      (global as any).URL = jest.fn(() => mockURL);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "partial-123",
          resumeToken: "token-123",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John" },
        currentStep: 1,
        progress: 25,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await service.save(data);

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 2100));

      const resumeUrl = service.getResumeUrl();
      expect(resumeUrl).toBe("https://example.com/form?resume=token-123");
      
      // Restore location
      (window as any).location = originalLocation;
    });

    it("should return null if no resume token", () => {
      // Create a fresh service with no resume token
      const freshService = new PartialSaveService(config);
      const resumeUrl = freshService.getResumeUrl();
      expect(resumeUrl).toBeNull();
      freshService.destroy();
    });
  });

  describe("clear functionality", () => {
    it("should clear localStorage and notify API", async () => {
      // Set up resume token
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        href: "https://example.com?resume=token-123",
        search: "?resume=token-123",
      };
      
      // Create URLSearchParams mock
      const mockURLSearchParams = {
        get: jest.fn((key: string) => key === "resume" ? "token-123" : null),
      };
      (global as any).URLSearchParams = jest.fn(() => mockURLSearchParams);
      
      const clearService = new PartialSaveService(config);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const sessionKey = `form-partial-test-form-test-respondent`;
      localStorageMock.setItem(sessionKey, JSON.stringify({ test: "data" }));

      await clearService.clear();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(sessionKey);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.example.com/partials/token-123",
        { method: "DELETE" }
      );

      clearService.destroy();
      
      // Restore location
      (window as any).location = originalLocation;
    });
  });

  describe("event handling", () => {
    it("should emit save events", async () => {
      const startHandler = jest.fn();
      const successHandler = jest.fn();

      service.on("save:start", startHandler);
      service.on("save:success", successHandler);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "partial-123",
          resumeToken: "token-123",
          expiresAt: new Date().toISOString(),
        }),
      });

      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John" },
        currentStep: 1,
        progress: 25,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      await service.save(data);

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(startHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });

    it("should handle throttled saves", async () => {
      const throttledHandler = jest.fn();
      service.on("save:throttled", throttledHandler);

      const data = {
        formId: "test-form",
        respondentKey: "test-respondent",
        values: { name: "John" },
        currentStep: 1,
        progress: 25,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };

      // Save multiple times quickly
      await service.save(data);
      await service.save(data);
      await service.save(data);

      // Some saves should be throttled
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3); // All saved to localStorage
    });
  });

  describe("utility methods", () => {
    it("should track save status", () => {
      expect(service.isSaving()).toBe(false);
      expect(service.getTimeSinceLastSave()).toBeGreaterThan(0);
    });
  });
});