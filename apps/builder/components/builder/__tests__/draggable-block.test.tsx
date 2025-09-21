import React from "react";
import { render, screen } from "@testing-library/react";
import { DraggableBlock } from "../draggable-block";
import { useDraggable } from "@dnd-kit/core";
import { Mail } from "lucide-react";

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  useDraggable: jest.fn(),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Translate: {
      toString: (transform: any) =>
        transform ? `translate(${transform.x}px, ${transform.y}px)` : "",
    },
  },
}));

// Mock UI utilities
jest.mock("@skemya/ui", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Mock icon
jest.mock("lucide-react", () => ({
  Mail: () => <span data-testid="icon">Mail Icon</span>,
}));

describe("DraggableBlock", () => {
  const mockBlock = {
    id: "email-block",
    type: "email",
    icon: Mail,
    label: "Email",
    category: "Contact",
  };

  const defaultDraggableReturn = {
    attributes: {
      role: "button",
      tabIndex: 0,
      "aria-roledescription": "sortable",
    },
    listeners: {
      onPointerDown: jest.fn(),
      onKeyDown: jest.fn(),
    },
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDraggable as jest.Mock).mockReturnValue(defaultDraggableReturn);
  });

  it("renders block with label and icon", () => {
    render(<DraggableBlock block={mockBlock} />);

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("applies draggable attributes and listeners", () => {
    render(<DraggableBlock block={mockBlock} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-roledescription", "sortable");
    expect(button).toHaveAttribute("tabIndex", "0");
  });

  it("calls setNodeRef with the button element", () => {
    const mockSetNodeRef = jest.fn();
    (useDraggable as jest.Mock).mockReturnValue({
      ...defaultDraggableReturn,
      setNodeRef: mockSetNodeRef,
    });

    render(<DraggableBlock block={mockBlock} />);

    expect(mockSetNodeRef).toHaveBeenCalled();
  });

  it("applies transform style when dragging", () => {
    (useDraggable as jest.Mock).mockReturnValue({
      ...defaultDraggableReturn,
      transform: { x: 10, y: 20 },
      isDragging: true,
    });

    render(<DraggableBlock block={mockBlock} />);

    const button = screen.getByRole("button");
    expect(button).toHaveStyle({
      transform: "translate(10px, 20px)",
      opacity: "0.5",
    });
  });

  it("applies dragging styles when isDragging is true", () => {
    (useDraggable as jest.Mock).mockReturnValue({
      ...defaultDraggableReturn,
      isDragging: true,
    });

    render(<DraggableBlock block={mockBlock} />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("ring-2 ring-primary");
  });

  it("has normal opacity when not dragging", () => {
    render(<DraggableBlock block={mockBlock} />);

    const button = screen.getByRole("button");
    expect(button).toHaveStyle({ opacity: "1" });
  });

  it("passes correct data to useDraggable", () => {
    render(<DraggableBlock block={mockBlock} />);

    expect(useDraggable).toHaveBeenCalledWith({
      id: "library-email-block",
      data: {
        source: "library",
        blockType: "email",
      },
    });
  });

  it("applies hover and focus styles", () => {
    render(<DraggableBlock block={mockBlock} />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("hover:border-primary/50");
    expect(button.className).toContain("hover:bg-accent/50");
    expect(button.className).toContain("focus:outline-none");
    expect(button.className).toContain("focus:ring-2");
  });

  it("has cursor-move class", () => {
    render(<DraggableBlock block={mockBlock} />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("cursor-move");
  });

  it("renders with different block types", () => {
    const textBlock = {
      id: "text-block",
      type: "text",
      icon: Mail, // Using same icon for simplicity
      label: "Short Text",
      category: "Text",
    };

    const { rerender } = render(<DraggableBlock block={textBlock} />);

    expect(screen.getByText("Short Text")).toBeInTheDocument();
    expect(useDraggable).toHaveBeenCalledWith({
      id: "library-text-block",
      data: {
        source: "library",
        blockType: "text",
      },
    });

    const numberBlock = {
      id: "number-block",
      type: "number",
      icon: Mail,
      label: "Number",
      category: "Number",
    };

    rerender(<DraggableBlock block={numberBlock} />);

    expect(screen.getByText("Number")).toBeInTheDocument();
    expect(useDraggable).toHaveBeenLastCalledWith({
      id: "library-number-block",
      data: {
        source: "library",
        blockType: "number",
      },
    });
  });
});
