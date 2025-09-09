import {
  IDBFactory,
  IDBKeyRange,
  IDBDatabase,
  IDBTransaction,
  IDBObjectStore,
  IDBIndex,
  IDBCursor,
  IDBRequest,
} from "fake-indexeddb";

export function mockIndexedDB() {
  (globalThis as any).indexedDB = new IDBFactory();
  (globalThis as any).IDBKeyRange = IDBKeyRange;
  (globalThis as any).IDBDatabase = IDBDatabase;
  (globalThis as any).IDBTransaction = IDBTransaction;
  (globalThis as any).IDBObjectStore = IDBObjectStore;
  (globalThis as any).IDBIndex = IDBIndex;
  (globalThis as any).IDBCursor = IDBCursor;
  (globalThis as any).IDBRequest = IDBRequest;
}
