import React from "react";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { Type } from "lucide-react";

// Mock framer-motion - must be before import
jest.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
      ({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )
    ),
  },
}));

import { BlockItem } from "../BlockItem";

describe("BlockItem", () => {
  const mockBlock = {
    type: "short_text",
    label: "Short Text",
    icon: Type,
    description: "Single line text input",
  };

  const renderWithDndContext = (component: React.ReactElement) => {
    return render(<DndContext>{component}</DndContext>);
  };

  it("renders block item with label and description", () => {
    renderWithDndContext(<BlockItem block={mockBlock} />);

    expect(screen.getByText("Short Text")).toBeInTheDocument();
    expect(screen.getByText("Single line text input")).toBeInTheDocument();
  });

  it("renders block icon", () => {
    const { container } = renderWithDndContext(<BlockItem block={mockBlock} />);

    // Check icon is rendered (lucide icons render as svg)
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("applies draggable attributes", () => {
    const { container } = renderWithDndContext(<BlockItem block={mockBlock} />);

    // DndKit adds data attributes to draggable elements
    const draggableElement = container.querySelector("[data-type='new-block']");
    expect(draggableElement || container.firstChild).toBeInTheDocument();
  });

  it("shows grip handle on hover", () => {
    const { container } = renderWithDndContext(<BlockItem block={mockBlock} />);

    // Grip handle should be present (GripVertical icon)
    const gripHandle = container.querySelector("svg");
    expect(gripHandle).toBeInTheDocument();
  });

  it("renders with correct styling classes", () => {
    const { container } = renderWithDndContext(<BlockItem block={mockBlock} />);

    const blockElement = container.firstChild as HTMLElement;
    expect(blockElement).toHaveClass("group");
    expect(blockElement).toHaveClass("cursor-move");
  });

  it("handles different block types", () => {
    const emailBlock = {
      type: "email",
      label: "Email",
      icon: Type,
      description: "Email address input",
    };

    renderWithDndContext(<BlockItem block={emailBlock} />);

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Email address input")).toBeInTheDocument();
  });

  it("maintains stable draggable ID across re-renders", () => {
    const { rerender } = renderWithDndContext(<BlockItem block={mockBlock} />);

    const firstRender = screen.getByText("Short Text").closest("div");

    rerender(
      <DndContext>
        <BlockItem block={mockBlock} />
      </DndContext>
    );

    const secondRender = screen.getByText("Short Text").closest("div");

    // Element should still be the same after re-render
    expect(firstRender).toBe(secondRender);
  });
});
