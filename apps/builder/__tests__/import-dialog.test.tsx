import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportDialog } from "../components/import/import-dialog";

// Mock the API
const mockApi = {
  post: jest.fn(),
};

jest.mock("../lib/api/forms", () => ({
  api: mockApi,
}));

// Mock UI components
jest.mock("@forms/ui", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" data-variant={variant}>
      {children}
    </button>
  ),
  Input: ({ onChange, placeholder, value }: any) => (
    <input onChange={onChange} placeholder={placeholder} value={value} data-testid="input" />
  ),
  Label: ({ children }: any) => <label data-testid="label">{children}</label>,
  Textarea: ({ onChange, placeholder, value }: any) => (
    <textarea onChange={onChange} placeholder={placeholder} value={value} data-testid="textarea" />
  ),
  RadioGroup: ({ children, onValueChange }: any) => (
    <div data-testid="radio-group" onChange={onValueChange}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value }: any) => <input type="radio" value={value} data-testid="radio-item" />,
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <p data-testid="alert-description">{children}</p>,
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe("ImportDialog", () => {
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders import dialog when open", () => {
    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Import Form")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ImportDialog open={false} onOpenChange={() => {}} onImport={mockOnImport} />);

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders import method options", () => {
    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    expect(screen.getByText("Typeform")).toBeInTheDocument();
    expect(screen.getByText("Google Forms")).toBeInTheDocument();
  });

  it("shows URL input for Typeform import", () => {
    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    // Select Typeform
    const typeformRadio = screen.getByDisplayValue("typeform");
    fireEvent.click(typeformRadio);

    expect(screen.getByPlaceholderText(/Typeform URL/i)).toBeInTheDocument();
  });

  it("shows JSON input for Google Forms import", () => {
    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    // Select Google Forms
    const googleFormsRadio = screen.getByDisplayValue("google_forms");
    fireEvent.click(googleFormsRadio);

    expect(screen.getByPlaceholderText(/Google Forms JSON/i)).toBeInTheDocument();
  });

  it("validates required fields before import", async () => {
    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    const importButton = screen.getByText("Import Form");
    fireEvent.click(importButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Please provide/i)).toBeInTheDocument();
    });
  });

  it("handles successful Typeform import", async () => {
    const mockImportResponse = {
      data: {
        form: { id: "imported-form", title: "Imported Form" },
        report: {
          total_questions: 5,
          imported: 5,
          warnings: [],
          unsupported: [],
        },
      },
    };

    mockApi.post.mockResolvedValue(mockImportResponse);

    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    // Select Typeform and enter URL
    const typeformRadio = screen.getByDisplayValue("typeform");
    fireEvent.click(typeformRadio);

    const urlInput = screen.getByPlaceholderText(/Typeform URL/i);
    fireEvent.change(urlInput, { target: { value: "https://typeform.com/to/abc123" } });

    const importButton = screen.getByText("Import Form");
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/forms/import/", {
        type: "typeform",
        source: "https://typeform.com/to/abc123",
      });
      expect(mockOnImport).toHaveBeenCalledWith(mockImportResponse.data.form);
    });
  });

  it("handles successful Google Forms import", async () => {
    const mockImportResponse = {
      data: {
        form: { id: "imported-form", title: "Imported Google Form" },
        report: {
          total_questions: 3,
          imported: 3,
          warnings: [],
          adapted: [],
        },
      },
    };

    mockApi.post.mockResolvedValue(mockImportResponse);

    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    // Select Google Forms and enter JSON
    const googleFormsRadio = screen.getByDisplayValue("google_forms");
    fireEvent.click(googleFormsRadio);

    const jsonInput = screen.getByPlaceholderText(/Google Forms JSON/i);
    const mockJson = JSON.stringify({ info: { title: "Test Form" }, items: [] });
    fireEvent.change(jsonInput, { target: { value: mockJson } });

    const importButton = screen.getByText("Import Form");
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/forms/import/", {
        type: "google_forms",
        source: mockJson,
      });
      expect(mockOnImport).toHaveBeenCalledWith(mockImportResponse.data.form);
    });
  });

  it("displays import report after successful import", async () => {
    const mockImportResponse = {
      data: {
        form: { id: "imported-form", title: "Imported Form" },
        report: {
          total_questions: 5,
          imported: 4,
          warnings: ["Some feature not supported"],
          unsupported: [{ field: "payment", suggestion: "Use custom field" }],
        },
      },
    };

    mockApi.post.mockResolvedValue(mockImportResponse);

    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    // Perform import
    const typeformRadio = screen.getByDisplayValue("typeform");
    fireEvent.click(typeformRadio);

    const urlInput = screen.getByPlaceholderText(/Typeform URL/i);
    fireEvent.change(urlInput, { target: { value: "https://typeform.com/to/abc123" } });

    const importButton = screen.getByText("Import Form");
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText("Import Complete")).toBeInTheDocument();
      expect(screen.getByText("5 total questions")).toBeInTheDocument();
      expect(screen.getByText("4 imported successfully")).toBeInTheDocument();
    });
  });

  it("handles import errors gracefully", async () => {
    mockApi.post.mockRejectedValue(new Error("Import failed"));

    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    // Perform import
    const typeformRadio = screen.getByDisplayValue("typeform");
    fireEvent.click(typeformRadio);

    const urlInput = screen.getByPlaceholderText(/Typeform URL/i);
    fireEvent.change(urlInput, { target: { value: "https://typeform.com/to/abc123" } });

    const importButton = screen.getByText("Import Form");
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to import/i)).toBeInTheDocument();
    });
  });

  it("shows loading state during import", async () => {
    mockApi.post.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    render(<ImportDialog open={true} onOpenChange={() => {}} onImport={mockOnImport} />);

    // Start import
    const typeformRadio = screen.getByDisplayValue("typeform");
    fireEvent.click(typeformRadio);

    const urlInput = screen.getByPlaceholderText(/Typeform URL/i);
    fireEvent.change(urlInput, { target: { value: "https://typeform.com/to/abc123" } });

    const importButton = screen.getByText("Import Form");
    fireEvent.click(importButton);

    expect(screen.getByText("Importing...")).toBeInTheDocument();
    expect(importButton).toBeDisabled();
  });
});
