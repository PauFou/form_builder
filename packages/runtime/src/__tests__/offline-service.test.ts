import { OfflineService } from "../services/offline-service";
import type { FormState, FormData, RuntimeConfig } from "../types";
import { mockIndexedDB } from "./test-utils";

describe("OfflineService", () => {
  let service: OfflineService;
  let config: RuntimeConfig;

  beforeEach(() => {
    mockIndexedDB();
    jest.clearAllMocks();

    config = {
      formId: `test-form-${Date.now()}-${Math.random()}`,
      apiUrl: "https://api.example.com",
      enableOffline: true,
      autoSaveInterval: 1000,
      onPartialSave: jest.fn(),
    };
  });

  afterEach(async () => {
    if (service) {
      await service.destroy();
    }
  });

  describe("State Management", () => {
    it("should save and retrieve state", async () => {
      service = new OfflineService(config);

      const state: FormState = {
        currentStep: 2,
        values: { name: "John", email: "john@example.com" },
        errors: {},
        touched: { name: true },
        isSubmitting: false,
        isComplete: false,
      };

      const data: Partial<FormData> = {
        formId: config.formId,
        values: state.values,
        startedAt: new Date().toISOString(),
      };

      await service.saveState("test-user", state, data);

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const retrieved = await service.getState();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.state.currentStep).toBe(2);
      expect(retrieved?.state.values.name).toBe("John");
      expect(retrieved?.respondentKey).toBe("test-user");
    });

    it("should delete state", async () => {
      service = new OfflineService(config);

      const state: FormState = {
        currentStep: 0,
        values: { test: "value" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      await service.saveState("user", state, {} as any);

      // Wait for save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      let retrieved = await service.getState();
      expect(retrieved).not.toBeNull();

      await service.deleteState();

      retrieved = await service.getState();
      expect(retrieved).toBeNull();
    });

    it("should return null when offline disabled", async () => {
      const disabledConfig = {
        ...config,
        formId: `disabled-${Date.now()}`,
        enableOffline: false,
      };
      const disabledService = new OfflineService(disabledConfig);

      const state: FormState = {
        currentStep: 0,
        values: {},
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      await disabledService.saveState("user", state, {} as any);
      const retrieved = await disabledService.getState();
      expect(retrieved).toBeNull();

      await disabledService.destroy();
    });
  });

  describe("Throttling", () => {
    it("should throttle save operations", async () => {
      service = new OfflineService(config);

      const state: FormState = {
        currentStep: 0,
        values: {},
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      // Save multiple times quickly
      for (let i = 0; i < 10; i++) {
        await service.saveState(
          "user",
          {
            ...state,
            values: { count: i },
          },
          {} as any
        );
      }

      // Wait for throttle delay
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const retrieved = await service.getState();
      // Should have the last value due to throttling
      expect(retrieved?.state.values.count).toBe(9);
    });

    it("should throttle sync operations", async () => {
      const mockPartialSave = jest.fn().mockResolvedValue(undefined);
      const syncConfig = {
        ...config,
        formId: `sync-test-${Date.now()}`,
        onPartialSave: mockPartialSave,
      };
      const syncService = new OfflineService(syncConfig);

      const state: FormState = {
        currentStep: 0,
        values: { test: "value" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      // Save multiple times to trigger sync
      for (let i = 0; i < 5; i++) {
        await syncService.saveState("user", state, {} as any);
      }

      // Wait for save throttle + sync throttle
      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Should only sync once due to throttling
      expect(mockPartialSave).toHaveBeenCalledTimes(1);

      await syncService.destroy();
    }, 15000);
  });

  describe("Online/Offline Detection", () => {
    it("should detect online status", () => {
      service = new OfflineService(config);
      expect(service.online).toBe(true);
    });

    it("should emit events on status change", async () => {
      service = new OfflineService(config);

      const onlineHandler = jest.fn();
      const offlineHandler = jest.fn();

      service.on("online", onlineHandler);
      service.on("offline", offlineHandler);

      // Simulate going offline
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(offlineHandler).toHaveBeenCalled();

      // Simulate going online
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(onlineHandler).toHaveBeenCalled();
    });
  });

  describe("Sync Functionality", () => {
    it("should track sync status", async () => {
      service = new OfflineService(config);

      const state: FormState = {
        currentStep: 0,
        values: { test: "value" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      await service.saveState("user", state, {} as any);

      // Wait for save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should have unsynced data
      expect(await service.hasUnsyncedData()).toBe(true);
    });

    it("should sync all pending submissions", async () => {
      const mockPartialSave = jest.fn().mockResolvedValue(undefined);
      const syncConfig = {
        ...config,
        formId: `sync-all-${Date.now()}`,
        onPartialSave: mockPartialSave,
      };
      const syncService = new OfflineService(syncConfig);

      const state: FormState = {
        currentStep: 0,
        values: { test: "value" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      // Save state
      await syncService.saveState("user", state, {
        formId: syncConfig.formId,
        values: state.values,
        startedAt: new Date().toISOString(),
      });

      // Wait for save to complete
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Manually trigger sync
      await syncService.syncAll();

      // Should have synced
      expect(await syncService.hasUnsyncedData()).toBe(false);

      await syncService.destroy();
    });

    it("should handle sync errors", async () => {
      const mockPartialSave = jest.fn().mockRejectedValue(new Error("Network error"));
      const errorHandler = jest.fn();
      const errorConfig = {
        ...config,
        formId: `error-test-${Date.now()}`,
        onPartialSave: mockPartialSave,
      };

      const syncService = new OfflineService(errorConfig);

      syncService.on("sync:error", errorHandler);

      const state: FormState = {
        currentStep: 0,
        values: { test: "value" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      await syncService.saveState("user", state, {} as any);

      // Wait for save + sync attempt
      await new Promise((resolve) => setTimeout(resolve, 12000));

      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler).toHaveBeenCalledWith({
        formId: errorConfig.formId,
        error: expect.any(Error),
      });

      await syncService.destroy();
    }, 15000);
  });

  describe("Cleanup", () => {
    it("should cleanup old completed submissions", async () => {
      service = new OfflineService(config);
      const oldDate = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 days ago

      // First, save a completed submission
      const completedState: FormState = {
        currentStep: 0,
        values: { test: "old" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: true,
      };

      await service.saveState("user", completedState, {
        formId: config.formId,
        values: completedState.values,
        startedAt: new Date(oldDate).toISOString(),
        completedAt: new Date(oldDate).toISOString(),
      });

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Now we need to directly update the updatedAt in the database to simulate an old submission
      const db = await (service as any).initDB();
      const tx = db.transaction("submissions", "readwrite");
      const record = await tx.objectStore("submissions").get(`${config.formId}-user`);
      if (record) {
        record.updatedAt = oldDate;
        await tx.objectStore("submissions").put(record);
      }
      await tx.done;

      // Save a recent incomplete submission
      const incompleteState: FormState = {
        currentStep: 0,
        values: { test: "new" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      await service.saveState("user2", incompleteState, {
        formId: config.formId,
        values: incompleteState.values,
        startedAt: new Date().toISOString(),
      });

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Run cleanup
      await service.cleanup();

      // Old completed should be gone, recent incomplete should remain
      const stats = await service.getOfflineStats();
      expect(stats.total).toBe(1);

      // Verify the remaining submission is the incomplete one
      const remaining = await service.getState();
      expect(remaining?.respondentKey).toBe("user2");
      expect(remaining?.state.values.test).toBe("new");
    });

    it("should not cleanup incomplete submissions", async () => {
      service = new OfflineService(config);
      const oldDate = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 days ago

      const state: FormState = {
        currentStep: 0,
        values: { test: "old-incomplete" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      await service.saveState("user", state, {
        formId: config.formId,
        values: state.values,
        startedAt: new Date(oldDate).toISOString(),
      });

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Run cleanup
      await service.cleanup();

      // Should still exist - getState() gets the most recent submission
      const retrieved = await service.getState();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.state.values.test).toBe("old-incomplete");
    });
  });

  describe("Statistics", () => {
    it("should provide offline statistics", async () => {
      service = new OfflineService(config);
      const state: FormState = {
        currentStep: 0,
        values: {},
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      // Save some submissions
      await service.saveState("user1", state, {
        formId: config.formId,
        values: { name: "User 1" },
        startedAt: new Date().toISOString(),
      });

      // Wait for save to complete
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const stats = await service.getOfflineStats();
      expect(stats.total).toBe(1);
      expect(stats.unsynced).toBe(1);
      expect(stats.oldestUnsynced).toBeInstanceOf(Date);
    });
  });

  describe("Event Emitter", () => {
    it("should emit state saved events", async () => {
      service = new OfflineService(config);
      const handler = jest.fn();
      service.on("state:saved", handler);

      const state: FormState = {
        currentStep: 0,
        values: {},
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      await service.saveState("user", state, {
        formId: config.formId,
        values: state.values,
        startedAt: new Date().toISOString(),
      });

      // Wait for throttled save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(handler).toHaveBeenCalledWith({
        formId: config.formId,
        respondentKey: "user",
      });
    });

    it("should emit state restored events", async () => {
      service = new OfflineService(config);
      const handler = jest.fn();
      service.on("state:restored", handler);

      const state: FormState = {
        currentStep: 0,
        values: { test: "value" },
        errors: {},
        touched: {},
        isSubmitting: false,
        isComplete: false,
      };

      const data: Partial<FormData> = {
        formId: config.formId,
        values: state.values,
        startedAt: new Date().toISOString(),
      };

      await service.saveState("user", state, data);

      // Wait for save
      await new Promise((resolve) => setTimeout(resolve, 1100));

      await service.getState();

      expect(handler).toHaveBeenCalledWith({
        formId: config.formId,
        data: expect.objectContaining({
          formId: config.formId,
        }),
      });
    });

    it("should properly remove event handlers", () => {
      service = new OfflineService(config);
      const handler = jest.fn();

      service.on("online", handler);
      service.off("online", handler);

      window.dispatchEvent(new Event("online"));

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
