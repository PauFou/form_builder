import React from "react";
import { render } from "@testing-library/react";
import { Badge } from "../../../components/ui/badge";

describe("Badge", () => {
  it("should render default badge", () => {
    const { getByText } = render(<Badge>Test Badge</Badge>);
    expect(getByText("Test Badge")).toBeInTheDocument();
  });

  it("should render secondary variant", () => {
    const { getByText } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(getByText("Secondary")).toBeInTheDocument();
  });

  it("should render destructive variant", () => {
    const { getByText } = render(<Badge variant="destructive">Error</Badge>);
    expect(getByText("Error")).toBeInTheDocument();
  });

  it("should render outline variant", () => {
    const { getByText } = render(<Badge variant="outline">Outline</Badge>);
    expect(getByText("Outline")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass("custom-class");
  });
});
