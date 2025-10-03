import "@testing-library/jest-dom";
import React from "react";

// Mock Next.js router (Pages router)
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
}));

// Mock Next.js navigation (App Router)
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockRefresh = jest.fn();
const mockPrefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get(target, prop) {
        return React.forwardRef(({ children, ...props }: any, ref: any) => {
          // Filter out framer-motion specific props
          const {
            animate,
            initial,
            exit,
            whileHover,
            whileTap,
            whileFocus,
            whileInView,
            whileDrag,
            drag,
            dragConstraints,
            dragElastic,
            dragMomentum,
            layout,
            layoutId,
            transition,
            variants,
            style,
            ...domProps
          } = props;

          return React.createElement(prop as string, { ...domProps, ref }, children);
        });
      },
    }
  ),
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial: any) => ({ get: () => initial, set: jest.fn() }),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => {
  const React = require("react");
  return new Proxy({} as any, {
    get: (target: any, prop: string | symbol) => {
      if (typeof prop === "string") {
        return React.forwardRef(({ children, ...props }: any, ref: any) =>
          React.createElement("svg", { ...props, ref, "data-testid": prop }, children)
        );
      }
      return target[prop as any];
    },
  });
});

// Mock react-hotkeys-hook
jest.mock("react-hotkeys-hook", () => ({
  useHotkeys: jest.fn(),
}));

// Mock @skemya/ui components - comprehensive approach
jest.mock("@skemya/ui", () => {
  const React = require("react");
  const originalModule = jest.requireActual("@skemya/ui");

  return {
    ...originalModule,
    // Dialog components
    Dialog: ({ children, open }: any) =>
      open ? React.createElement("div", { "data-testid": "dialog" }, children) : null,
    DialogContent: ({ children }: any) =>
      React.createElement("div", { "data-testid": "dialog-content" }, children),
    DialogHeader: ({ children }: any) =>
      React.createElement("div", { "data-testid": "dialog-header" }, children),
    DialogTitle: ({ children }: any) =>
      React.createElement("h2", { "data-testid": "dialog-title" }, children),
    DialogDescription: ({ children }: any) =>
      React.createElement("p", { "data-testid": "dialog-description" }, children),
    DialogFooter: ({ children }: any) =>
      React.createElement("div", { "data-testid": "dialog-footer" }, children),

    // Form components
    Button: React.forwardRef(({ children, onClick, disabled, variant, ...props }: any, ref: any) =>
      React.createElement(
        "button",
        { ref, onClick, disabled, className: variant, ...props },
        children
      )
    ),
    Label: ({ children, htmlFor, ...props }: any) =>
      React.createElement("label", { htmlFor, ...props }, children),
    Switch: ({ checked, onCheckedChange, ...props }: any) =>
      React.createElement("input", {
        type: "checkbox",
        checked,
        onChange: (e: any) => onCheckedChange?.(e.target.checked),
        role: "switch",
        ...props,
      }),
    Checkbox: ({ checked, onCheckedChange, ...props }: any) =>
      React.createElement("input", {
        type: "checkbox",
        checked,
        onChange: (e: any) => onCheckedChange?.(e.target.checked),
        ...props,
      }),

    // Select components
    Select: ({ children, value, onValueChange, disabled }: any) =>
      React.createElement(
        "div",
        { "data-value": value, onClick: () => onValueChange?.("test") },
        children
      ),
    SelectContent: ({ children }: any) =>
      React.createElement("div", { "data-testid": "select-content" }, children),
    SelectItem: ({ children, value }: any) =>
      React.createElement("div", { role: "option", "data-value": value }, children),
    SelectTrigger: ({ children, id }: any) =>
      React.createElement(
        "div",
        {
          "data-testid": "select-trigger",
          role: "combobox",
          id,
          "aria-expanded": "false",
          "aria-haspopup": "listbox",
        },
        children
      ),
    SelectValue: ({ placeholder }: any) =>
      React.createElement("span", {}, placeholder || "All Time"),

    // Tabs components
    Tabs: ({ children, defaultValue }: any) =>
      React.createElement("div", { "data-default-value": defaultValue }, children),
    TabsList: ({ children }: any) => React.createElement("div", { role: "tablist" }, children),
    TabsTrigger: ({ children, value }: any) =>
      React.createElement("button", { role: "tab", "data-value": value }, children),
    TabsContent: ({ children, value }: any) =>
      React.createElement("div", { role: "tabpanel", "data-value": value }, children),

    // RadioGroup components
    RadioGroup: ({ children, value, onValueChange }: any) =>
      React.createElement(
        "div",
        {
          role: "radiogroup",
          "data-value": value,
          onClick: () => onValueChange?.("csv"),
        },
        children
      ),
    RadioGroupItem: ({ value, id }: any) =>
      React.createElement("input", { type: "radio", value, id }),

    // Progress component
    Progress: ({ value }: any) =>
      React.createElement("div", { role: "progressbar", "aria-valuenow": value }),

    // Badge component
    Badge: ({ children, className, ...props }: any) =>
      React.createElement(
        "span",
        { className: `badge ${className || ""}`.trim(), ...props },
        children
      ),
  };
});

// Mock @dnd-kit/core
jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => children,
  DragOverlay: ({ children }: any) => children,
  useDndMonitor: () => {},
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
  pointerWithin: jest.fn(),
  rectIntersection: jest.fn(),
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

// Mock @dnd-kit/sortable
jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => children,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: "vertical-list",
  sortableKeyboardCoordinates: jest.fn(),
}));

// Mock environment variables
// Use Object.defineProperty to avoid readonly property error
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
  configurable: true,
});

// Mock crypto.randomUUID for Node < 19
if (!global.crypto) {
  global.crypto = {} as any;
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = (() => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }) as any;
}

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({}),
    text: async () => "",
    status: 200,
    statusText: "OK",
    headers: new Headers(),
  })
) as jest.Mock;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
