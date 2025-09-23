/**
 * Jest setup file for UI package
 * Configures testing environment and custom matchers
 */

import "@testing-library/jest-dom";
import { toBeAccessible } from "./src/utils/accessibility-testing";

// Extend Jest matchers with accessibility testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): Promise<R>;
    }
  }
}

// Add custom accessibility matcher
expect.extend({
  toBeAccessible,
});

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia for responsive components
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

// Suppress console warnings in tests (unless testing them specifically)
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  // Allow accessibility warnings through for testing
  if (args[0]?.includes?.("Accessibility") || args[0]?.includes?.("axe")) {
    return originalConsoleWarn(...args);
  }

  // Suppress React 19 warnings that are expected during transition
  const message = args[0];
  if (
    typeof message === "string" &&
    (message.includes("ReactDOM.render") ||
      message.includes("peer dependency") ||
      message.includes("deprecated"))
  ) {
    return;
  }

  return originalConsoleWarn(...args);
};
