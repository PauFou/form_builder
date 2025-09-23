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
  const globalWithIDB = globalThis as typeof globalThis & {
    indexedDB: IDBFactory;
    IDBKeyRange: typeof IDBKeyRange;
    IDBDatabase: typeof IDBDatabase;
    IDBTransaction: typeof IDBTransaction;
    IDBObjectStore: typeof IDBObjectStore;
    IDBIndex: typeof IDBIndex;
    IDBCursor: typeof IDBCursor;
    IDBRequest: typeof IDBRequest;
  };

  globalWithIDB.indexedDB = new IDBFactory();
  globalWithIDB.IDBKeyRange = IDBKeyRange;
  globalWithIDB.IDBDatabase = IDBDatabase;
  globalWithIDB.IDBTransaction = IDBTransaction;
  globalWithIDB.IDBObjectStore = IDBObjectStore;
  globalWithIDB.IDBIndex = IDBIndex;
  globalWithIDB.IDBCursor = IDBCursor;
  globalWithIDB.IDBRequest = IDBRequest;
}
