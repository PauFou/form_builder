import "@testing-library/jest-dom";

// Polyfill for structuredClone (Node < 17)
// @ts-expect-error - Polyfill for Node < 17
global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
// @ts-expect-error - Mock for testing
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
// @ts-expect-error - Mock for testing
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "https://example.com",
    search: "",
    toString: () => "https://example.com",
  },
  writable: true,
});

// Mock URL constructor
(global as any).URL = jest.fn().mockImplementation((href) => ({
  searchParams: new Map(),
  toString: () => href,
}));

// Mock URLSearchParams
(global as any).URLSearchParams = jest.fn().mockImplementation((search) => ({
  get: jest.fn((key) => null),
  set: jest.fn(),
}));

// Mock fetch globally
(global as any).fetch = jest.fn();

// Mock indexedDB
import "fake-indexeddb/auto";
