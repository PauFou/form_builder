import { IDBFactory, IDBKeyRange, IDBDatabase, IDBTransaction, IDBObjectStore, IDBIndex, IDBCursor, IDBRequest } from 'fake-indexeddb';

export function mockIndexedDB() {
  global.indexedDB = new IDBFactory();
  global.IDBKeyRange = IDBKeyRange;
  global.IDBDatabase = IDBDatabase;
  global.IDBTransaction = IDBTransaction;
  global.IDBObjectStore = IDBObjectStore;
  global.IDBIndex = IDBIndex;
  global.IDBCursor = IDBCursor;
  global.IDBRequest = IDBRequest;
}