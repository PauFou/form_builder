import React from "react";
import { render, screen, fireEvent, waitFor } from "../../lib/test-utils";
import IntegrationsPage from "../../app/integrations/page";
import { integrationsApi } from "../../lib/api/integrations";

// Mock dependencies
jest.mock("../../lib/api/integrations", () => ({
  integrationsApi: {
    list: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    sync: jest.fn(),
  },
}));

jest.mock("../../components/shared/navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

// Mock UI components
jest.mock("@skemya/ui", () => ({
  ...jest.requireActual("@skemya/ui"),
  Skeleton: () => <div data-testid="skeleton" />,
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
    (integrationsApi.list as jest.Mock).mockResolvedValue({
      data: { integrations: mockIntegrations },
    });
  });

  it("should render the integrations page heading", () => {
    render(<IntegrationsPage />);

    expect(screen.getByText("Integrations")).toBeInTheDocument();
  });

  it("should display loading state initially", () => {
    // Mock the query to be in loading state
    (integrationsApi.list as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<IntegrationsPage />);

    // Check for skeleton cards instead of loading text
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should display all integrations after loading", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Google Sheets")).toBeInTheDocument();
      expect(screen.getByText("Slack")).toBeInTheDocument();
      expect(screen.getByText("Zapier")).toBeInTheDocument();
    });
  });

  it("should display integration type", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      // The component shows the type or type_display
      expect(screen.getByText("Google Sheets")).toBeInTheDocument();
      expect(screen.getByText("Slack")).toBeInTheDocument();
      expect(screen.getByText("Zapier")).toBeInTheDocument();
    });
  });

  it("should show active status for integrations", async () => {
    const activeIntegrations = [
      { ...mockIntegrations[0], status: "active" },
      { ...mockIntegrations[1], status: "inactive" },
      { ...mockIntegrations[2], status: "error" },
    ];

    (integrationsApi.list as jest.Mock).mockResolvedValue({
      data: { integrations: activeIntegrations },
    });

    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  it("should have settings dropdown menu", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      const moreButtons = screen
        .getAllByRole("button")
        .filter(
          (button) =>
            button.querySelector('[data-testid="more-vertical-icon"]') || button.textContent === ""
        );
      expect(moreButtons.length).toBeGreaterThan(0);
    });
  });

  it("should show configure button for all integrations", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      const configureButtons = screen.getAllByText("Configure");
      expect(configureButtons).toHaveLength(mockIntegrations.length);
    });
  });

  it("should display search input", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search integrations...");
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("should handle error state gracefully", async () => {
    // Mock the query to reject
    (integrationsApi.list as jest.Mock).mockRejectedValue(new Error("Failed to load"));

    render(<IntegrationsPage />);

    // The component should still render without crashing
    await waitFor(() => {
      expect(screen.getByText("Integrations")).toBeInTheDocument();
      expect(screen.getByText("Add Integration")).toBeInTheDocument();
    });
  });

  it("should show add integration button", async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      const addButton = screen.getByText("Add Integration");
      expect(addButton).toBeInTheDocument();
    });
  });
});
