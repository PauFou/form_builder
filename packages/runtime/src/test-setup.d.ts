// Test environment type declarations
/// <reference types="jest" />
/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface Global {
      fetch: jest.Mock;
      indexedDB: IDBFactory;
    }
  }
}

// For TypeScript 5.x compatibility
declare const global: typeof globalThis & {
  fetch: jest.Mock;
  indexedDB: IDBFactory;
};

export {};
