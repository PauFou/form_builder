import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataDeletion } from "../data-deletion";
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
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
  Alert: ({ children, variant }: any) => (
    <div role="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => <div>{children}</div>,
  Dialog: ({ children, open, onOpenChange }: any) => {
    // Clone children and pass open state down
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as any, { open, onOpenChange });
      }
      return child;
    });
    return <>{childrenWithProps}</>;
  },
  DialogContent: ({ children, open }: any) => (open ? <div role="dialog">{children}</div> : null),
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h3>{children}</h3>,
  DialogTrigger: ({ children, asChild, onOpenChange }: any) => {
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any>;
      return React.cloneElement(childElement, {
        onClick: (e: any) => {
          childElement.props.onClick?.(e);
          onOpenChange?.(true);
        },
      });
    }
    return <>{children}</>;
  },
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
  ),
  Label: ({ children }: any) => <label>{children}</label>,
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Trash2: () => <span>Trash2</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  XCircle: () => <span>XCircle</span>,
}));

describe("DataDeletion", () => {
  const mockDeleteData = jest.fn();
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      deleteData: mockDeleteData,
      deletionStatus: "idle",
    });
  });

  it("renders data deletion interface", () => {
    render(<DataDeletion userId={mockUserId} />);

    expect(screen.getByText("Delete Personal Data")).toBeInTheDocument();
    expect(screen.getByText(/Permanently delete all your personal data/)).toBeInTheDocument();
  });

  it("shows warning message", () => {
    render(<DataDeletion userId={mockUserId} />);

    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it("shows delete button", () => {
    render(<DataDeletion userId={mockUserId} />);

    // Find button containing the text, might have icon too
    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Delete All Data"));
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute("data-variant", "destructive");
  });

  it("opens confirmation dialog on delete click", async () => {
    const user = userEvent.setup();
    render(<DataDeletion userId={mockUserId} />);

    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Delete All Data"));
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton!);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Are you absolutely sure?")).toBeInTheDocument();
  });

  it("requires checkbox confirmation", async () => {
    const user = userEvent.setup();
    render(<DataDeletion userId={mockUserId} />);

    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Delete All Data"));
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton!);

    const confirmCheckbox = screen.getByRole("checkbox");
    expect(confirmCheckbox).not.toBeChecked();

    const confirmButton = screen.getByText("Delete Everything");
    expect(confirmButton).toBeDisabled();
  });

  it("enables confirm button after checkbox", async () => {
    const user = userEvent.setup();
    render(<DataDeletion userId={mockUserId} />);

    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Delete All Data"));
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton!);

    const confirmCheckbox = screen.getByRole("checkbox");
    await user.click(confirmCheckbox);

    const confirmButton = screen.getByText("Delete Everything");
    expect(confirmButton).not.toBeDisabled();
  });

  it("cancels deletion", async () => {
    const user = userEvent.setup();
    render(<DataDeletion userId={mockUserId} />);

    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Delete All Data"));
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton!);

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockDeleteData).not.toHaveBeenCalled();
  });

  it("confirms and executes deletion", async () => {
    const user = userEvent.setup();
    render(<DataDeletion userId={mockUserId} />);

    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Delete All Data"));
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton!);

    const confirmCheckbox = screen.getByRole("checkbox");
    await user.click(confirmCheckbox);

    const confirmButton = screen.getByText("Delete Everything");
    await user.click(confirmButton);

    expect(mockDeleteData).toHaveBeenCalledWith(mockUserId);
  });

  it("shows loading state during deletion", () => {
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      deleteData: mockDeleteData,
      deletionStatus: "loading",
    });

    render(<DataDeletion userId={mockUserId} />);

    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Deleting"));
    expect(deleteButton).toBeDisabled();
  });

  it("shows success message after deletion", () => {
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      deleteData: mockDeleteData,
      deletionStatus: "success",
    });

    render(<DataDeletion userId={mockUserId} />);

    expect(screen.getByText(/Your data has been deleted successfully/)).toBeInTheDocument();
  });

  it("shows error message on deletion failure", () => {
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      deleteData: mockDeleteData,
      deletionStatus: "error",
      deletionError: "Permission denied",
    });

    render(<DataDeletion userId={mockUserId} />);

    expect(screen.getByText("Failed to delete data. Permission denied")).toBeInTheDocument();
  });

  it("resets state after successful deletion", async () => {
    const { rerender } = render(<DataDeletion userId={mockUserId} />);

    // First show success
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      deleteData: mockDeleteData,
      deletionStatus: "success",
    });
    rerender(<DataDeletion userId={mockUserId} />);

    expect(screen.getByText(/Your data has been deleted successfully/)).toBeInTheDocument();

    // Then reset to idle
    (useGDPRStore as unknown as jest.Mock).mockReturnValue({
      deleteData: mockDeleteData,
      deletionStatus: "idle",
    });
    rerender(<DataDeletion userId={mockUserId} />);

    // Should show delete button again
    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) => btn.textContent?.includes("Delete All Data"));
    expect(deleteButton).toBeInTheDocument();
  });

  it("shows data types that will be deleted", () => {
    render(<DataDeletion userId={mockUserId} />);

    expect(screen.getByText(/Form submissions/)).toBeInTheDocument();
    expect(screen.getByText(/Personal information/)).toBeInTheDocument();
    expect(screen.getByText(/Account data/)).toBeInTheDocument();
  });
});
