import mitt, { Emitter } from "mitt";
import type { RuntimeConfig } from "../types";
import { debounce } from "../utils";

interface PartialSaveData {
  formId: string;
  respondentKey: string;
  values: Record<string, any>;
  currentStep: number;
  progress: number;
  startedAt: string;
  lastUpdatedAt: string;
  metadata?: Record<string, any>;
}

interface PartialSaveResponse {
  id: string;
  resumeToken: string;
  expiresAt: string;
}

type PartialSaveEvents = {
  "save:start": { data: PartialSaveData };
  "save:success": { data: PartialSaveData; response: PartialSaveResponse };
  "save:error": { data: PartialSaveData; error: Error };
  "save:throttled": { data: PartialSaveData };
};

export class PartialSaveService {
  private readonly emitter: Emitter<PartialSaveEvents>;
  private readonly config: RuntimeConfig;
  private readonly throttledSave: ReturnType<typeof debounce>;
  private lastSaveTime: number = 0;
  private saveInProgress: boolean = false;
  private readonly sessionKey: string;
  private resumeToken: string | null = null;
  private latestData: PartialSaveData | null = null;

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.emitter = mitt<PartialSaveEvents>();
    this.sessionKey = this.generateSessionKey();

    // Create throttled save function (2s minimum between API calls)
    // Use a wrapper to always get the latest data
    this.throttledSave = debounce(() => {
      if (this.latestData) {
        this._saveToApi(this.latestData);
      }
    }, 2000);

    // Check for resume token in URL on initialization
    this.checkForResumeToken();
  }

  /**
   * Generate a unique session key for localStorage
   */
  private generateSessionKey(): string {
    const formId = this.config.formId;
    const respondentKey = this.config.respondentKey || `anon-${Date.now()}-${Math.random()}`;
    return `form-partial-${formId}-${respondentKey}`;
  }

  /**
   * Check URL for resume token
   */
  private checkForResumeToken(): void {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("resume");
    if (token) {
      this.resumeToken = token;
    }
  }

  /**
   * Save partial form data to localStorage and optionally to API
   */
  async save(data: PartialSaveData): Promise<void> {
    // Always save to localStorage immediately
    this.saveToLocalStorage(data);

    // Store the latest data for the throttled save
    this.latestData = data;

    // Only save to API if partial saves are enabled
    if (this.config.onPartialSave || this.config.apiUrl) {
      this.throttledSave();
    }
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage(data: PartialSaveData): void {
    if (typeof window === "undefined") return;

    try {
      const storageData = {
        ...data,
        sessionKey: this.sessionKey,
        resumeToken: this.resumeToken,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(this.sessionKey, JSON.stringify(storageData));
    } catch (error) {
      // Handle storage quota errors
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.warn("LocalStorage quota exceeded, clearing old data");
        this.clearOldLocalStorageData();
        // Try again
        try {
          localStorage.setItem(this.sessionKey, JSON.stringify(data));
        } catch {
          console.error("Failed to save to localStorage after clearing old data");
        }
      }
    }
  }

  /**
   * Clear old partial save data from localStorage
   */
  private clearOldLocalStorageData(): void {
    if (typeof window === "undefined") return;

    const keysToRemove: string[] = [];
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("form-partial-")) continue;

      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        const savedAt = new Date(data.savedAt || 0).getTime();

        if (now - savedAt > maxAge) {
          keysToRemove.push(key);
        }
      } catch {
        // If we can't parse it, it's probably corrupted, remove it
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Save to API (throttled)
   */
  private async _saveToApi(data: PartialSaveData): Promise<void> {
    if (this.saveInProgress) {
      this.emitter.emit("save:throttled", { data });
      return;
    }

    this.saveInProgress = true;
    this.emitter.emit("save:start", { data });

    try {
      // Use custom partial save handler if provided
      if (this.config.onPartialSave) {
        await this.config.onPartialSave(data);

        // Create a mock response for consistency
        const response: PartialSaveResponse = {
          id: `partial-${Date.now()}`,
          resumeToken: this.resumeToken || `token-${Date.now()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        this.resumeToken = response.resumeToken;
        this.lastSaveTime = Date.now();

        this.emitter.emit("save:success", { data, response });
      } else if (this.config.apiUrl) {
        // Default API endpoint
        const response = await fetch(`${this.config.apiUrl}/partials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            resumeToken: this.resumeToken,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const responseData: PartialSaveResponse = await response.json();
        this.resumeToken = responseData.resumeToken;
        this.lastSaveTime = Date.now();

        this.emitter.emit("save:success", { data, response: responseData });
      }
    } catch (error) {
      console.error("Failed to save partial data to API:", error);
      this.emitter.emit("save:error", { data, error: error as Error });
    } finally {
      this.saveInProgress = false;
    }
  }

  /**
   * Load saved data from localStorage or API
   */
  async load(): Promise<PartialSaveData | null> {
    // First try to load from localStorage
    const localData = this.loadFromLocalStorage();
    if (localData) {
      return localData;
    }

    // If we have a resume token, try to load from API
    if (this.resumeToken && this.config.apiUrl) {
      try {
        const response = await fetch(`${this.config.apiUrl}/partials/${this.resumeToken}`);

        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error("Failed to load partial data from API:", error);
      }
    }

    return null;
  }

  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(): PartialSaveData | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Validate the data structure
      if (!data.formId || !data.values || !data.respondentKey) {
        console.warn("Invalid partial save data in localStorage");
        return null;
      }

      // Check if data is too old (7 days)
      const savedAt = new Date(data.savedAt || 0).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000;

      if (Date.now() - savedAt > maxAge) {
        console.info("Partial save data is too old, removing");
        localStorage.removeItem(this.sessionKey);
        return null;
      }

      // Update resume token if present
      if (data.resumeToken) {
        this.resumeToken = data.resumeToken;
      }

      return data;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      // If data is corrupted, remove it
      try {
        localStorage.removeItem(this.sessionKey);
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  }

  /**
   * Clear saved data
   */
  async clear(): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(this.sessionKey);
      } catch {
        // Ignore errors
      }
    }

    // Optionally notify the API if we have a token
    if (this.resumeToken && this.config.apiUrl) {
      try {
        await fetch(`${this.config.apiUrl}/partials/${this.resumeToken}`, {
          method: "DELETE",
        });
      } catch {
        // Ignore API errors on clear
      }
    }

    this.resumeToken = null;
  }

  /**
   * Get the resume URL with token
   */
  getResumeUrl(): string | null {
    if (!this.resumeToken) return null;

    const url = new URL(window.location.href);
    url.searchParams.set("resume", this.resumeToken);
    return url.toString();
  }

  /**
   * Get time since last save
   */
  getTimeSinceLastSave(): number {
    return Date.now() - this.lastSaveTime;
  }

  /**
   * Check if there's a save in progress
   */
  isSaving(): boolean {
    return this.saveInProgress;
  }

  /**
   * Event handling
   */
  on<K extends keyof PartialSaveEvents>(
    event: K,
    handler: (payload: PartialSaveEvents[K]) => void
  ) {
    this.emitter.on(event, handler as any);
  }

  off<K extends keyof PartialSaveEvents>(
    event: K,
    handler: (payload: PartialSaveEvents[K]) => void
  ) {
    this.emitter.off(event, handler as any);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.emitter.all.clear();
  }
}
