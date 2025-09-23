import { openDB, DBSchema, IDBPDatabase } from "idb";
import mitt, { Emitter } from "mitt";
import type { FormState, FormData, RuntimeConfig } from "../types";

// Custom debounce function for this service
function debounceService<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  } as (...args: Parameters<T>) => void;
}

interface FormDB extends DBSchema {
  submissions: {
    key: string;
    value: {
      id: string;
      formId: string;
      respondentKey: string;
      state: FormState;
      data: Partial<FormData>;
      updatedAt: number;
      syncedAt?: number;
      attempts: number;
    };
    indexes: {
      "by-form": string;
      "by-respondent": string;
      "by-updated": number;
      "by-synced": number;
    };
  };
  metadata: {
    key: string;
    value: {
      formId: string;
      lastSync: number;
      version: number;
    };
  };
}

type OfflineEvents = {
  "state:saved": { formId: string; respondentKey: string };
  "state:restored": { formId: string; data: Partial<FormData> };
  "sync:start": { formId: string };
  "sync:success": { formId: string };
  "sync:error": { formId: string; error: Error };
  online: undefined;
  offline: undefined;
};

export class OfflineService {
  private db: IDBPDatabase<FormDB> | null = null;
  private initPromise: Promise<IDBPDatabase<FormDB>> | null = null;
  private readonly emitter: Emitter<OfflineEvents>;
  private readonly config: RuntimeConfig;
  private syncTimer: number | null = null;
  private isOnline: boolean = true;
  private readonly dbName: string;
  private readonly dbVersion = 1;

  // Throttled functions
  private readonly throttledSave: (
    respondentKey: string,
    state: FormState,
    data: Partial<FormData>
  ) => void;
  private readonly throttledSync: () => void;

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.emitter = mitt<OfflineEvents>();
    this.dbName = `forms-runtime-${config.formId}`;

    // Create throttled functions
    this.throttledSave = debounceService(
      (respondentKey: string, state: FormState, data: Partial<FormData>) => {
        this._saveState(respondentKey, state, data);
      },
      config.autoSaveInterval || 5000
    ) as (respondentKey: string, state: FormState, data: Partial<FormData>) => void;

    this.throttledSync = debounceService(
      () => {
        this._syncPartial();
      },
      10000 // Sync every 10s max
    ) as () => void;

    // Initialize online/offline detection
    this.isOnline = navigator.onLine;
    this.setupOnlineDetection();

    // Start periodic sync if online
    if (this.isOnline && config.enableOffline) {
      this.startPeriodicSync();
    }
  }

  private setupOnlineDetection() {
    const updateOnlineStatus = () => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;

      if (!wasOnline && this.isOnline) {
        this.emitter.emit("online", undefined);
        this.startPeriodicSync();
        // Immediately try to sync when coming online
        this.syncAll();
      } else if (wasOnline && !this.isOnline) {
        this.emitter.emit("offline", undefined);
        this.stopPeriodicSync();
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Also check periodically in case events don't fire
    setInterval(updateOnlineStatus, 30000);
  }

  private startPeriodicSync() {
    if (this.syncTimer) return;

    this.syncTimer = window.setInterval(() => {
      if (this.isOnline) {
        this.syncAll();
      }
    }, 60000); // Sync every minute
  }

  private stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async initDB(): Promise<IDBPDatabase<FormDB>> {
    if (this.db && !this.db.objectStoreNames.contains) {
      // Check if db is still valid
      try {
        // Test the connection
        await this.db.transaction("submissions", "readonly").objectStore("submissions").count();
        return this.db;
      } catch {
        // Database is closed or invalid, reinitialize
        this.db = null;
        this.initPromise = null;
      }
    }

    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = openDB<FormDB>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Create submissions store
        if (!db.objectStoreNames.contains("submissions")) {
          const store = db.createObjectStore("submissions", { keyPath: "id" });
          store.createIndex("by-form", "formId");
          store.createIndex("by-respondent", "respondentKey");
          store.createIndex("by-updated", "updatedAt");
          store.createIndex("by-synced", "syncedAt");
        }

        // Create metadata store
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "formId" });
        }
      },
      blocked() {
        console.warn("Database upgrade blocked by other tabs");
      },
      blocking() {
        console.warn("Database blocking other tabs");
      },
    });

    try {
      this.db = await this.initPromise;
      return this.db;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  async saveState(respondentKey: string, state: FormState, data: Partial<FormData>): Promise<void> {
    if (!this.config.enableOffline) return;

    // Use throttled save to avoid too many writes
    this.throttledSave(respondentKey, state, data);
  }

  private async _saveState(
    respondentKey: string,
    state: FormState,
    data: Partial<FormData>
  ): Promise<void> {
    try {
      const db = await this.initDB();
      const id = `${this.config.formId}-${respondentKey}`;

      // Get existing record to preserve sync status
      const existing = await db.get("submissions", id);

      await db.put("submissions", {
        id,
        formId: this.config.formId,
        respondentKey,
        state,
        data,
        updatedAt: Date.now(),
        syncedAt: existing?.syncedAt,
        attempts: existing?.attempts || 0,
      });

      this.emitter.emit("state:saved", {
        formId: this.config.formId,
        respondentKey,
      });

      // Trigger throttled sync if online
      if (this.isOnline && this.config.onPartialSave) {
        this.throttledSync();
      }
    } catch (error) {
      console.error("Failed to save offline state:", error);
    }
  }

  async getState(): Promise<{
    state: FormState;
    data: Partial<FormData>;
    respondentKey: string;
  } | null> {
    if (!this.config.enableOffline) return null;

    try {
      const db = await this.initDB();
      // Get the most recent submission for this form
      const tx = db.transaction("submissions", "readonly");
      const index = tx.objectStore("submissions").index("by-form");
      const submissions = await index.getAll(this.config.formId);

      if (!submissions.length) return null;

      // Get the most recent one
      const record = submissions.reduce((latest, current) =>
        current.updatedAt > latest.updatedAt ? current : latest
      );

      this.emitter.emit("state:restored", {
        formId: this.config.formId,
        data: record.data,
      });

      return {
        state: record.state,
        data: record.data,
        respondentKey: record.respondentKey,
      };
    } catch (error) {
      console.error("Failed to get offline state:", error);
      return null;
    }
  }

  async deleteState(): Promise<void> {
    if (!this.config.enableOffline) return;

    try {
      const db = await this.initDB();
      // Delete all submissions for this form
      const tx = db.transaction("submissions", "readwrite");
      const index = tx.objectStore("submissions").index("by-form");

      for await (const cursor of index.iterate(this.config.formId)) {
        await cursor.delete();
      }
    } catch (error) {
      console.error("Failed to delete offline state:", error);
    }
  }

  async hasUnsyncedData(): Promise<boolean> {
    if (!this.config.enableOffline) return false;

    try {
      const db = await this.initDB();
      const tx = db.transaction("submissions", "readonly");
      const index = tx.objectStore("submissions").index("by-form");
      const submissions = await index.getAll(this.config.formId);

      if (!submissions.length) return false;

      // Check if any submission has unsynced data
      return submissions.some((record) => !record.syncedAt || record.updatedAt > record.syncedAt);
    } catch (error) {
      console.error("Failed to check unsynced data:", error);
      return false;
    }
  }

  private async _syncPartial(): Promise<void> {
    if (!this.isOnline || !this.config.onPartialSave) return;

    try {
      const db = await this.initDB();
      const tx = db.transaction("submissions", "readonly");
      const index = tx.objectStore("submissions").index("by-form");
      const submissions = await index.getAll(this.config.formId);

      if (!submissions.length) return;

      // Get the most recent unsynced submission
      const record = submissions
        .filter((s) => !s.syncedAt || s.updatedAt > s.syncedAt)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];

      if (!record) return;

      // Skip if already synced
      if (record.syncedAt && record.updatedAt <= record.syncedAt) return;

      this.emitter.emit("sync:start", { formId: this.config.formId });

      await this.config.onPartialSave(record.data);

      // Update sync timestamp
      await db.put("submissions", {
        ...record,
        syncedAt: Date.now(),
        attempts: 0,
      });

      this.emitter.emit("sync:success", { formId: this.config.formId });
    } catch (error) {
      console.error("Failed to sync partial submission:", error);

      // Record ID is not available here since we're in catch block
      // We'll handle retry tracking differently

      this.emitter.emit("sync:error", {
        formId: this.config.formId,
        error: error as Error,
      });
    }
  }

  async syncAll(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const db = await this.initDB();
      const tx = db.transaction("submissions", "readonly");
      const index = tx.objectStore("submissions").index("by-updated");

      // Get all unsynced submissions
      const unsynced: Array<{
        formId: string;
        data: Partial<FormData>;
      }> = [];

      for await (const cursor of index.iterate()) {
        if (!cursor.value.syncedAt || cursor.value.updatedAt > cursor.value.syncedAt) {
          unsynced.push({
            formId: cursor.value.formId,
            data: cursor.value.data,
          });
        }
      }

      // Sync each unsynced submission
      for (let i = 0; i < unsynced.length; i++) {
        await this._syncPartial();
      }
    } catch (error) {
      console.error("Failed to sync all submissions:", error);
    }
  }

  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const db = await this.initDB();
      const cutoff = Date.now() - maxAge;

      const tx = db.transaction("submissions", "readwrite");
      const index = tx.objectStore("submissions").index("by-updated");

      for await (const cursor of index.iterate()) {
        if (cursor.value.updatedAt < cutoff && cursor.value.data.completedAt) {
          // Only delete completed submissions older than maxAge
          await cursor.delete();
        }
      }
    } catch (error) {
      console.error("Failed to cleanup old submissions:", error);
    }
  }

  async getOfflineStats(): Promise<{
    total: number;
    unsynced: number;
    oldestUnsynced?: Date;
  }> {
    try {
      const db = await this.initDB();
      const all = await db.getAll("submissions");

      const unsynced = all.filter((r) => !r.syncedAt || r.updatedAt > r.syncedAt);

      let oldestUnsynced: Date | undefined;
      if (unsynced.length > 0) {
        const oldest = unsynced.reduce((min, r) => (r.updatedAt < min.updatedAt ? r : min));
        oldestUnsynced = new Date(oldest.updatedAt);
      }

      return {
        total: all.length,
        unsynced: unsynced.length,
        oldestUnsynced,
      };
    } catch (error) {
      console.error("Failed to get offline stats:", error);
      return { total: 0, unsynced: 0 };
    }
  }

  // Event handling
  on<K extends keyof OfflineEvents>(event: K, handler: (payload: OfflineEvents[K]) => void) {
    this.emitter.on(event, handler as any);
  }

  off<K extends keyof OfflineEvents>(event: K, handler: (payload: OfflineEvents[K]) => void) {
    this.emitter.off(event, handler as any);
  }

  // Cleanup
  async destroy() {
    this.stopPeriodicSync();

    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
    } catch (error) {
      // Ignore errors when closing
    }

    this.initPromise = null;
    this.emitter.all.clear();
  }

  // Getters
  get online(): boolean {
    return this.isOnline;
  }
}
