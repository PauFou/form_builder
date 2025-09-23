import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportDialog } from "../ExportDialog";
import { formsApi } from "../../../lib/api/forms";
import { toast } from "react-hot-toast";

jest.mock("../../../lib/api/forms");
jest.mock("react-hot-toast");

describe("ExportDialog", () => {
  const mockOnOpenChange = jest.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    formId: "form-123",
    selectedSubmissionIds: [],
    totalSubmissions: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();

    // Mock DOM methods
    const mockClick = jest.fn();
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === "a") {
        return {
          click: mockClick,
          href: "",
          download: "",
          setAttribute: jest.fn(),
          removeAttribute: jest.fn(),
        };
      }
      // For other elements, use the original createElement
      return originalCreateElement.call(document, tagName);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders export dialog with format options", () => {
    render(<ExportDialog {...defaultProps} />);

    expect(screen.getByText("Export Submissions")).toBeInTheDocument();
    expect(screen.getByText(/all 100/)).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("Excel")).toBeInTheDocument();
    expect(screen.getByText("Parquet")).toBeInTheDocument();
  });

  it("shows selected count when submissions are selected", () => {
    const props = {
      ...defaultProps,
      selectedSubmissionIds: ["1", "2", "3"],
    };
    render(<ExportDialog {...props} />);

    expect(screen.getByText(/3 selected/)).toBeInTheDocument();
  });

  it("switches between tabs", () => {
    render(<ExportDialog {...defaultProps} />);

    // Initially on Format tab
    expect(screen.getByText("Comma-separated values, compatible with Excel")).toBeInTheDocument();

    // Switch to Filters tab
    fireEvent.click(screen.getByRole("tab", { name: /filters/i }));
    expect(screen.getByText("Date Range")).toBeInTheDocument();
    expect(screen.getByText("Submission Status")).toBeInTheDocument();

    // Switch to Privacy tab
    fireEvent.click(screen.getByRole("tab", { name: /privacy/i }));
    expect(screen.getByText("Privacy Notice")).toBeInTheDocument();
    expect(screen.getByText("Anonymize data")).toBeInTheDocument();
  });

  it("handles format selection", () => {
    render(<ExportDialog {...defaultProps} />);

    const jsonOption = screen.getByLabelText("JSON");
    fireEvent.click(jsonOption);

    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("JavaScript Object Notation, for developers")).toBeInTheDocument();
  });

  it("handles date range selection", () => {
    render(<ExportDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("tab", { name: /filters/i }));

    const dateSelect = screen.getByText("All Time");
    fireEvent.click(dateSelect);

    const lastWeekOption = screen.getByRole("option", { name: "Last 7 days" });
    fireEvent.click(lastWeekOption);

    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
  });

  it("toggles anonymization options", () => {
    render(<ExportDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("tab", { name: /privacy/i }));

    const anonymizeSwitch = screen.getByRole("switch", { name: /anonymize data/i });
    fireEvent.click(anonymizeSwitch);

    expect(screen.getByText("Replace respondent IDs with hashes")).toBeInTheDocument();
    expect(screen.getByText("Remove IP addresses")).toBeInTheDocument();
  });

  it("estimates file size correctly", () => {
    render(<ExportDialog {...defaultProps} />);

    // Default CSV format, 100 submissions
    expect(screen.getByText("50.0 KB")).toBeInTheDocument();

    // Switch to JSON
    const jsonOption = screen.getByLabelText("JSON");
    fireEvent.click(jsonOption);

    expect(screen.getByText("120.0 KB")).toBeInTheDocument();
  });

  it("handles export successfully", async () => {
    const mockExportData = new Blob(["export data"], { type: "text/csv" });
    (formsApi.exportSubmissions as jest.Mock).mockResolvedValue({ data: mockExportData });

    render(<ExportDialog {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(formsApi.exportSubmissions).toHaveBeenCalledWith("form-123", {
        ids: undefined,
        format: "csv",
        options: {
          dateRange: "all",
          status: "all",
          includeMetadata: true,
          includePartials: false,
          anonymize: false,
          fields: undefined,
        },
      });
      expect(toast.success).toHaveBeenCalledWith("Export completed successfully");
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("handles export with selected submissions", async () => {
    const props = {
      ...defaultProps,
      selectedSubmissionIds: ["sub-1", "sub-2"],
    };
    const mockExportData = new Blob(["export data"], { type: "text/csv" });
    (formsApi.exportSubmissions as jest.Mock).mockResolvedValue({ data: mockExportData });

    render(<ExportDialog {...props} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(formsApi.exportSubmissions).toHaveBeenCalledWith("form-123", {
        ids: ["sub-1", "sub-2"],
        format: "csv",
        options: expect.any(Object),
      });
    });
  });

  it("handles export error", async () => {
    (formsApi.exportSubmissions as jest.Mock).mockRejectedValue(new Error("Export failed"));

    render(<ExportDialog {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Export failed. Please try again.");
    });
  });

  it("shows progress during export", async () => {
    (formsApi.exportSubmissions as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: "data" }), 100))
    );

    render(<ExportDialog {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    fireEvent.click(exportButton);

    expect(screen.getByText("Exporting...")).toBeInTheDocument();
    expect(screen.getByText(/preparing your export/i)).toBeInTheDocument();
  });

  it("disables buttons during export", async () => {
    (formsApi.exportSubmissions as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: "data" }), 100))
    );

    render(<ExportDialog {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    fireEvent.click(exportButton);

    expect(exportButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
