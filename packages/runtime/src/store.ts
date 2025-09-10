import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { FormState, FormData } from "./types";

interface FormDB extends DBSchema {
  submissions: {
    key: string;
    value: {
      formId: string;
      respondentKey: string;
      state: FormState;
      data: Partial<FormData>;
      updatedAt: number;
    };
    indexes: {
      respondentKey: string;
      updatedAt: number;
    };
  };
}

const DB_NAME = "forms-runtime";
const DB_VERSION = 1;

export class OfflineStore {
  private db: IDBPDatabase<FormDB> | null = null;
  private initPromise: Promise<IDBPDatabase<FormDB>> | null = null;

  private async initDB(): Promise<IDBPDatabase<FormDB>> {
    if (this.db) return this.db;

    if (this.initPromise) return this.initPromise;

    this.initPromise = openDB<FormDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("submissions")) {
          const store = db.createObjectStore("submissions", { keyPath: "formId" });
          store.createIndex("respondentKey", "respondentKey");
          store.createIndex("updatedAt", "updatedAt");
        }
      },
    });

    this.db = await this.initPromise;
    return this.db;
  }

  async saveState(
    formId: string,
    respondentKey: string,
    state: FormState,
    data: Partial<FormData>
  ): Promise<void> {
    const db = await this.initDB();

    await db.put("submissions", {
      formId,
      respondentKey,
      state,
      data,
      updatedAt: Date.now(),
    });
  }

  async getState(formId: string): Promise<{
    state: FormState;
    data: Partial<FormData>;
  } | null> {
    const db = await this.initDB();
    const record = await db.get("submissions", formId);

    if (!record) return null;

    return {
      state: record.state,
      data: record.data,
    };
  }

  async deleteState(formId: string): Promise<void> {
    const db = await this.initDB();
    await db.delete("submissions", formId);
  }

  async getAllPending(): Promise<
    Array<{
      formId: string;
      data: Partial<FormData>;
    }>
  > {
    const db = await this.initDB();
    const all = await db.getAll("submissions");

    return all
      .filter((record) => !record.data.completedAt)
      .map((record) => ({
        formId: record.formId,
        data: record.data,
      }));
  }

  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const db = await this.initDB();
    const cutoff = Date.now() - maxAge;

    const tx = db.transaction("submissions", "readwrite");
    const index = tx.objectStore("submissions").index("updatedAt");

    for await (const cursor of index.iterate()) {
      if (cursor.value.updatedAt < cutoff) {
        await cursor.delete();
      }
    }
  }
}
