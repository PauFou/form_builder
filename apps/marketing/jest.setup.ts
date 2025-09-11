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

// Mock geist fonts globally
jest.mock("geist/font/sans", () => ({
  GeistSans: {
    className: "mocked-geist-sans",
    style: { fontFamily: "mocked-geist-sans" },
    variable: "--font-geist-sans",
  },
}));

jest.mock("geist/font/mono", () => ({
  GeistMono: {
    className: "mocked-geist-mono",
    style: { fontFamily: "mocked-geist-mono" },
    variable: "--font-geist-mono",
  },
}));

// Mock Framer Motion
jest.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(function MotionDiv({ children, ...props }: any, ref: any) {
        return React.createElement("div", { ...props, ref }, children);
      }),
      h1: React.forwardRef(function MotionH1({ children, ...props }: any, ref: any) {
        return React.createElement("h1", { ...props, ref }, children);
      }),
      h2: React.forwardRef(function MotionH2({ children, ...props }: any, ref: any) {
        return React.createElement("h2", { ...props, ref }, children);
      }),
      h3: React.forwardRef(function MotionH3({ children, ...props }: any, ref: any) {
        return React.createElement("h3", { ...props, ref }, children);
      }),
      p: React.forwardRef(function MotionP({ children, ...props }: any, ref: any) {
        return React.createElement("p", { ...props, ref }, children);
      }),
      section: React.forwardRef(function MotionSection({ children, ...props }: any, ref: any) {
        return React.createElement("section", { ...props, ref }, children);
      }),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Environment variables are already set by Jest
