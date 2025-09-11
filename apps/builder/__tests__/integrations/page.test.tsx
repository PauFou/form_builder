import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IntegrationsPage from "../../app/integrations/page";
import { getIntegrations, toggleIntegration } from "../../lib/api/integrations";

// Mock dependencies
jest.mock("../../lib/api/integrations", () => ({
  getIntegrations: jest.fn(),
  toggleIntegration: jest.fn(),
}));

jest.mock("../../components/shared/navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe("IntegrationsPage", () => {
  const mockIntegrations = [
    {
      id: "google-sheets",
      name: "Google Sheets",
      description: "Export submissions to Google Sheets",
      icon: "📊",
      enabled: true,
      configured: true,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Send notifications to Slack",
      icon: "💬",
      enabled: false,
      configured: false,
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect to 5000+ apps",
      icon: "⚡",
      enabled: true,
      configured: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);
  });

  it("should render the integrations page heading", () => {
    render(<IntegrationsPage />);

    expect(screen.getByText("Integrations")).toBeInTheDocument();
  });

  it("should display loading state initially", () => {
    render(<IntegrationsPage />);

    expect(screen.getByText("Loading integrations...")).toBeInTheDocument();
  });

  it("should display all integrations after loading", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Google Sheets")).toBeInTheDocument();
      expect(screen.getByText("Slack")).toBeInTheDocument();
      expect(screen.getByText("Zapier")).toBeInTheDocument();
    });
  });

  it("should display integration descriptions", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Export submissions to Google Sheets")).toBeInTheDocument();
      expect(screen.getByText("Send notifications to Slack")).toBeInTheDocument();
      expect(screen.getByText("Connect to 5000+ apps")).toBeInTheDocument();
    });
  });

  it("should show enabled status for integrations", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      const toggleButtons = screen.getAllByRole("switch");
      expect(toggleButtons[0]).toBeChecked(); // Google Sheets enabled
      expect(toggleButtons[1]).not.toBeChecked(); // Slack disabled
      expect(toggleButtons[2]).toBeChecked(); // Zapier enabled
    });
  });

  it("should toggle integration when switch clicked", async () => {
    (toggleIntegration as jest.Mock).mockResolvedValue({ ...mockIntegrations[1], enabled: true });

    render(<IntegrationsPage />);

    await waitFor(() => {
      const slackToggle = screen.getAllByRole("switch")[1];
      fireEvent.click(slackToggle);
    });

    expect(toggleIntegration).toHaveBeenCalledWith("slack", true);
  });

  it("should show configure button for unconfigured integrations", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      const configureButtons = screen.getAllByText("Configure");
      expect(configureButtons).toHaveLength(1); // Only Slack needs configuration
    });
  });

  it("should show settings button for configured integrations", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      const settingsButtons = screen.getAllByText("Settings");
      expect(settingsButtons).toHaveLength(2); // Google Sheets and Zapier
    });
  });

  it("should handle error state", async () => {
    (getIntegrations as jest.Mock).mockRejectedValue(new Error("Failed to load"));

    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load integrations")).toBeInTheDocument();
    });
  });

  it("should show integration categories", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Data Export")).toBeInTheDocument();
      expect(screen.getByText("Notifications")).toBeInTheDocument();
      expect(screen.getByText("Automation")).toBeInTheDocument();
    });
  });
});
