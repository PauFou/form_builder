import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
}));

// Mock framer-motion to avoid animation issues in tests
import React from "react";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
    button: ({ children, ...props }: any) => React.createElement("button", props, children),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock environment variables
// Use Object.defineProperty to avoid readonly property error
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
  configurable: true,
});
