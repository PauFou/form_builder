import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../loading-spinner";

describe("LoadingSpinner", () => {
  it("renders loading spinner", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("shows default loading text", () => {
    render(<LoadingSpinner />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows custom loading text", () => {
    render(<LoadingSpinner text="Saving changes..." />);

    expect(screen.getByText("Saving changes...")).toBeInTheDocument();
  });

  it("applies default size", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".h-8.w-8");
    expect(spinner).toBeInTheDocument();
  });

  it("applies small size", () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector(".h-4.w-4");
    expect(spinner).toBeInTheDocument();
  });

  it("applies large size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector(".h-12.w-12");
    expect(spinner).toBeInTheDocument();
  });

  it("centers content by default", () => {
    const { container } = render(<LoadingSpinner />);

    const wrapper = container.querySelector(".flex.items-center.justify-center");
    expect(wrapper).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("has spinning animation", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("is accessible with aria-label", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Loading");
  });

  it("shows spinner and text together", () => {
    render(<LoadingSpinner text="Processing..." />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("applies full height when specified", () => {
    const { container } = render(<LoadingSpinner fullHeight />);

    const wrapper = container.querySelector(".h-full");
    expect(wrapper).toBeInTheDocument();
  });
});
