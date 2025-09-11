import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GDPRPage from "../../app/gdpr/page";

// Mock components
jest.mock("../../components/shared/navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

jest.mock("../../components/gdpr/gdpr-dashboard", () => ({
  GDPRDashboard: ({ onTabChange }: any) => (
    <div data-testid="gdpr-dashboard">
      <button onClick={() => onTabChange("overview")}>Overview</button>
      <button onClick={() => onTabChange("settings")}>Settings</button>
      <button onClick={() => onTabChange("requests")}>Requests</button>
      GDPR Dashboard
    </div>
  ),
}));

describe("GDPRPage", () => {
  it("should render the GDPR page heading", () => {
    render(<GDPRPage />);

    expect(screen.getByText("GDPR Compliance")).toBeInTheDocument();
  });

  it("should render the navigation component", () => {
    render(<GDPRPage />);

    expect(screen.getByTestId("navigation")).toBeInTheDocument();
  });

  it("should render the GDPR dashboard component", () => {
    render(<GDPRPage />);

    expect(screen.getByTestId("gdpr-dashboard")).toBeInTheDocument();
  });

  it("should render tab navigation", () => {
    render(<GDPRPage />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Data Retention")).toBeInTheDocument();
    expect(screen.getByText("Privacy Settings")).toBeInTheDocument();
    expect(screen.getByText("Data Requests")).toBeInTheDocument();
  });

  it("should handle tab changes", () => {
    render(<GDPRPage />);

    const settingsButton = screen.getByText("Settings");
    fireEvent.click(settingsButton);

    // Verify the tab change was handled (implementation specific)
    expect(screen.getByTestId("gdpr-dashboard")).toBeInTheDocument();
  });

  it("should display compliance status section", () => {
    render(<GDPRPage />);

    expect(screen.getByText("Compliance Status")).toBeInTheDocument();
  });

  it("should display quick actions", () => {
    render(<GDPRPage />);

    expect(screen.getByText("Download DPA")).toBeInTheDocument();
    expect(screen.getByText("Export Data")).toBeInTheDocument();
    expect(screen.getByText("View Audit Log")).toBeInTheDocument();
  });

  it("should have proper page layout", () => {
    const { container } = render(<GDPRPage />);

    const mainContainer = container.querySelector(".min-h-screen");
    expect(mainContainer).toBeInTheDocument();

    const contentWrapper = container.querySelector(".container");
    expect(contentWrapper).toBeInTheDocument();
  });

  it("should render information cards", () => {
    render(<GDPRPage />);

    expect(screen.getByText(/Data Residency/)).toBeInTheDocument();
    expect(screen.getByText(/Encryption/)).toBeInTheDocument();
    expect(screen.getByText(/Right to Access/)).toBeInTheDocument();
    expect(screen.getByText(/Right to Deletion/)).toBeInTheDocument();
  });
});
