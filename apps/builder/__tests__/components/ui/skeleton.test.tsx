import React from "react";
import { render } from "@testing-library/react";
import { Skeleton } from "../../../components/ui/skeleton";

describe("Skeleton", () => {
  it("should render skeleton", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("should apply custom className", () => {
    const { container } = render(<Skeleton className="w-full h-4" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("w-full");
    expect(skeleton).toHaveClass("h-4");
  });

  it("should merge classes correctly", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("custom-class");
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("rounded-md");
    expect(skeleton).toHaveClass("bg-muted");
  });
});
