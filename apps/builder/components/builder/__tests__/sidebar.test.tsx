import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../sidebar";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

// Mock the store
jest.mock("../../../lib/stores/form-builder-store");

// Mock UI components
jest.mock("@forms/ui", () => ({
  ...jest.requireActual("@forms/ui"),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  Tabs: ({ children, defaultValue }: any) => <div data-default={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-tab={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-tab-trigger={value}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Type: () => <span>Type</span>,
  Mail: () => <span>Mail</span>,
  Phone: () => <span>Phone</span>,
  Calendar: () => <span>Calendar</span>,
  Hash: () => <span>Hash</span>,
  DollarSign: () => <span>DollarSign</span>,
  Link: () => <span>Link</span>,
  MapPin: () => <span>MapPin</span>,
  Search: () => <span>Search</span>,
  FileText: () => <span>FileText</span>,
  ToggleLeft: () => <span>ToggleLeft</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  Radio: () => <span>Radio</span>,
  CheckSquare: () => <span>CheckSquare</span>,
  Grid3x3: () => <span>Grid3x3</span>,
  Star: () => <span>Star</span>,
  Gauge: () => <span>Gauge</span>,
  Ruler: () => <span>Ruler</span>,
  List: () => <span>List</span>,
  FileSignature: () => <span>FileSignature</span>,
  Upload: () => <span>Upload</span>,
  CreditCard: () => <span>CreditCard</span>,
  CalendarDays: () => <span>CalendarDays</span>,
}));

describe("Sidebar", () => {
  const mockAddBlock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedPageId: "page-1",
    });
  });

  it("renders sidebar with tabs", () => {
    render(<Sidebar />);

    expect(screen.getByText("Blocks")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("shows search input in blocks tab", () => {
    render(<Sidebar />);

    const searchInput = screen.getByPlaceholderText("Search blocks...");
    expect(searchInput).toBeInTheDocument();
  });

  it("displays all block categories", () => {
    render(<Sidebar />);

    expect(screen.getByText("basic")).toBeInTheDocument();
    expect(screen.getByText("contact")).toBeInTheDocument();
    expect(screen.getByText("choice")).toBeInTheDocument();
    expect(screen.getByText("advanced")).toBeInTheDocument();
  });

  it("displays basic blocks", () => {
    render(<Sidebar />);

    expect(screen.getByText("Short Text")).toBeInTheDocument();
    expect(screen.getByText("Long Text")).toBeInTheDocument();
    expect(screen.getByText("Number")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("displays contact blocks", () => {
    render(<Sidebar />);

    // Look for text within the block items, not icons
    const blockTexts = screen.getAllByText("Phone");
    const phoneBlock = blockTexts.find((el) => el.className === "text-sm");
    expect(phoneBlock).toBeInTheDocument();

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
  });

  it("displays choice blocks", () => {
    render(<Sidebar />);

    expect(screen.getByText("Dropdown")).toBeInTheDocument();
    // Radio might have duplicates too - get all and check
    const radioTexts = screen.getAllByText("Radio");
    expect(radioTexts.length).toBeGreaterThan(0);

    expect(screen.getByText("Checkbox")).toBeInTheDocument();
    expect(screen.getByText("Matrix")).toBeInTheDocument();
  });

  it("displays advanced blocks", () => {
    render(<Sidebar />);

    expect(screen.getByText("Rating")).toBeInTheDocument();
    expect(screen.getByText("NPS")).toBeInTheDocument();
    expect(screen.getByText("Scale")).toBeInTheDocument();
    expect(screen.getByText("Ranking")).toBeInTheDocument();
    expect(screen.getByText("Signature")).toBeInTheDocument();
    expect(screen.getByText("File Upload")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Scheduler")).toBeInTheDocument();
  });

  it("filters blocks by search term", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const searchInput = screen.getByPlaceholderText("Search blocks...");
    await user.type(searchInput, "email");

    // Should show email block
    expect(screen.getByText("Email")).toBeInTheDocument();

    // Should hide non-matching blocks
    expect(screen.queryByText("Short Text")).not.toBeInTheDocument();
  });

  it("calls addBlock when clicking a block", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const emailBlock = screen.getByText("Email").closest('div[draggable="true"]');
    await user.click(emailBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "email",
        question: "",
        required: false,
      }),
      "page-1"
    );
  });

  it("makes blocks draggable", () => {
    render(<Sidebar />);

    const blocks = screen
      .getAllByRole("button")
      .filter((el) => el.getAttribute("draggable") === "true");

    expect(blocks.length).toBeGreaterThan(0);
  });
});
