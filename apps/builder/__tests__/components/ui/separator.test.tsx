import React from "react";
import { render } from "@testing-library/react";
import { Separator } from "../../../components/ui/separator";

describe("Separator", () => {
  it("should render horizontal separator by default", () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild;
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass("h-[1px]");
    expect(separator).toHaveClass("w-full");
  });

  it("should render vertical separator", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstChild;
    expect(separator).toHaveClass("h-full");
    expect(separator).toHaveClass("w-[1px]");
  });

  it("should apply custom className", () => {
    const { container } = render(<Separator className="my-4" />);
    const separator = container.firstChild;
    expect(separator).toHaveClass("my-4");
  });

  it("should have proper aria attributes for decorative separator", () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild;
    // Decorative separators have role="none" by default
    expect(separator).toHaveAttribute("role", "none");
    // Decorative separators don't have aria-orientation
  });

  it("should have proper aria attributes when not decorative", () => {
    const { container } = render(<Separator decorative={false} />);
    const separator = container.firstChild;
    expect(separator).toHaveAttribute("role", "separator");
    // Radix UI's separator manages aria-orientation internally
  });
});
