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

  it("should have proper aria attributes", () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild;
    expect(separator).toHaveAttribute("role", "separator");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
  });
});
