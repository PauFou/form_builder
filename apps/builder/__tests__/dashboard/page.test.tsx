import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "../../app/dashboard/page";

// Mock the navigation component
jest.mock("../../components/shared/navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe("Dashboard", () => {
  it("should render the dashboard heading", () => {
    render(<Dashboard />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("should render the navigation component", () => {
    render(<Dashboard />);

    expect(screen.getByTestId("navigation")).toBeInTheDocument();
  });

  it("should render stats cards", () => {
    render(<Dashboard />);

    expect(screen.getByText("Total Forms")).toBeInTheDocument();
    expect(screen.getByText("Total Submissions")).toBeInTheDocument();
    expect(screen.getByText("Active Forms")).toBeInTheDocument();
    expect(screen.getByText("Completion Rate")).toBeInTheDocument();
  });

  it("should render recent forms section", () => {
    render(<Dashboard />);

    expect(screen.getByText("Recent Forms")).toBeInTheDocument();
  });

  it("should render quick actions", () => {
    render(<Dashboard />);

    expect(screen.getByText("Create New Form")).toBeInTheDocument();
    expect(screen.getByText("View All Forms")).toBeInTheDocument();
    expect(screen.getByText("View Analytics")).toBeInTheDocument();
  });

  it("should have correct layout structure", () => {
    const { container } = render(<Dashboard />);

    const mainContainer = container.querySelector(".min-h-screen");
    expect(mainContainer).toBeInTheDocument();

    const contentArea = container.querySelector(".max-w-7xl");
    expect(contentArea).toBeInTheDocument();
  });
});
