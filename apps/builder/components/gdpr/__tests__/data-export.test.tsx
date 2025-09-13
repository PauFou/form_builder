import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataExport } from "../data-export";
import { useGDPRStore } from "../../../lib/stores/gdpr-store";

// Mock the store
jest.mock("../../../lib/stores/gdpr-store");

// Mock UI components
jest.mock("@forms/ui", () => ({
  ...jest.requireActual("@forms/ui"),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, value, onValueChange }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      data-testid="format-select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  Progress: ({ value }: any) => (
    <div role="progressbar" aria-valuenow={value}>
      {value}%
    </div>
  ),
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Download: () => <span>Download</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
}));

// Mock file download
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock createElement to avoid jsdom navigation error
const originalCreateElement = document.createElement;
beforeAll(() => {
  document.createElement = jest.fn((tag) => {
    if (tag === "a") {
      const anchor = {
        href: "",
        download: "",
        click: jest.fn(),
        style: {},
      };
      return anchor as any;
    }
    return originalCreateElement.call(document, tag);
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

describe("DataExport", () => {
  const mockExportData = jest.fn();
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      exportData: mockExportData,
      exportStatus: "idle",
      exportProgress: 0,
    });
  });

  it("renders data export interface", () => {
    render(<DataExport userId={mockUserId} />);

    expect(screen.getByText("Export Personal Data")).toBeInTheDocument();
    expect(screen.getByText(/Export all your personal data/)).toBeInTheDocument();
  });

  it("shows format selection", () => {
    render(<DataExport userId={mockUserId} />);

    expect(screen.getByText("Select Format")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
  });

  it("exports data in JSON format", async () => {
    const user = userEvent.setup();
    mockExportData.mockResolvedValue({
      data: { name: "Test User" },
      format: "json",
    });

    render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText("Export Data");
    await user.click(exportButton);

    expect(mockExportData).toHaveBeenCalledWith(mockUserId, "json");
  });

  it("exports data in CSV format", async () => {
    const user = userEvent.setup();
    render(<DataExport userId={mockUserId} />);

    // Select CSV format using the select element
    const formatSelect = screen.getByTestId("format-select");
    await user.selectOptions(formatSelect, "csv");

    const exportButton = screen.getByText("Export Data");
    await user.click(exportButton);

    expect(mockExportData).toHaveBeenCalledWith(mockUserId, "csv");
  });

  it("shows loading state during export", () => {
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      exportData: mockExportData,
      exportStatus: "loading",
      exportProgress: 50,
    });

    render(<DataExport userId={mockUserId} />);

    expect(screen.getByText("Exporting...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });

  it("disables button during export", () => {
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      exportData: mockExportData,
      exportStatus: "loading",
      exportProgress: 50,
    });

    render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText("Exporting...");
    expect(exportButton).toBeDisabled();
  });

  it("shows success message after export", () => {
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      exportData: mockExportData,
      exportStatus: "success",
      exportProgress: 100,
    });

    render(<DataExport userId={mockUserId} />);

    expect(screen.getByText(/Your data has been exported successfully/)).toBeInTheDocument();
  });

  it("shows error message on export failure", () => {
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      exportData: mockExportData,
      exportStatus: "error",
      exportProgress: 0,
      exportError: "Network error",
    });

    render(<DataExport userId={mockUserId} />);

    expect(screen.getByText("Failed to export data. Network error")).toBeInTheDocument();
  });

  it("downloads file after successful export", async () => {
    const user = userEvent.setup();
    const mockData = { name: "Test User", email: "test@example.com" };

    mockExportData.mockResolvedValue({
      data: mockData,
      format: "json",
    });

    const { rerender } = render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText("Export Data");
    await user.click(exportButton);

    // Simulate the store updating status to success after export
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      exportData: mockExportData,
      exportStatus: "success",
      exportProgress: 100,
      exportError: null,
    });

    rerender(<DataExport userId={mockUserId} />);

    // Now the success message should be visible
    expect(screen.getByText("Your data has been exported successfully.")).toBeInTheDocument();

    // Check that download was triggered
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("handles empty data export", async () => {
    const user = userEvent.setup();
    mockExportData.mockResolvedValue({
      data: {},
      format: "json",
    });

    const { rerender } = render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText("Export Data");
    await user.click(exportButton);

    // Simulate the store updating status to success after export
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      exportData: mockExportData,
      exportStatus: "success",
      exportProgress: 100,
      exportError: null,
    });

    rerender(<DataExport userId={mockUserId} />);

    expect(screen.getByText("Your data has been exported successfully.")).toBeInTheDocument();
    expect(mockExportData).toHaveBeenCalled();
  });
});
