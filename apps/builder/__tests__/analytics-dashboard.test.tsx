import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AnalyticsDashboard } from "../components/analytics/analytics-dashboard";

// Mock the API
const mockApi = {
  get: jest.fn(),
};

jest.mock("../lib/api/forms", () => ({
  api: mockApi,
}));

// Mock recharts components
jest.mock("recharts", () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock UI components
jest.mock("@forms/ui", () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  ),
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

describe("AnalyticsDashboard", () => {
  const mockAnalyticsData = {
    overview: {
      total_views: 1250,
      total_submissions: 95,
      conversion_rate: 7.6,
      completion_rate: 85.3,
    },
    views_over_time: [
      { date: "2025-01-01", views: 50, submissions: 4 },
      { date: "2025-01-02", views: 75, submissions: 6 },
      { date: "2025-01-03", views: 60, submissions: 5 },
    ],
    funnel: [
      { step: "Form View", count: 1250, percentage: 100 },
      { step: "Started", count: 980, percentage: 78.4 },
      { step: "Page 2", count: 750, percentage: 60 },
      { step: "Completed", count: 95, percentage: 7.6 },
    ],
    completion_rates: [
      { block_id: "block1", question: "Name", completion_rate: 95.2 },
      { block_id: "block2", question: "Email", completion_rate: 88.5 },
      { block_id: "block3", question: "Phone", completion_rate: 72.1 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: mockAnalyticsData });
  });

  it("renders loading state initially", () => {
    mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AnalyticsDashboard formId="test-form" />);

    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
  });

  it("renders analytics data after loading", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      expect(screen.getByText("1,250")).toBeInTheDocument(); // Total views
      expect(screen.getByText("95")).toBeInTheDocument(); // Total submissions
      expect(screen.getByText("7.6%")).toBeInTheDocument(); // Conversion rate
      expect(screen.getByText("85.3%")).toBeInTheDocument(); // Completion rate
    });
  });

  it("renders overview metrics cards", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      expect(screen.getByText("Total Views")).toBeInTheDocument();
      expect(screen.getByText("Submissions")).toBeInTheDocument();
      expect(screen.getByText("Conversion Rate")).toBeInTheDocument();
      expect(screen.getByText("Completion Rate")).toBeInTheDocument();
    });
  });

  it("renders charts", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      expect(screen.getAllByTestId("area-chart")).toHaveLength(1);
      expect(screen.getAllByTestId("bar-chart")).toHaveLength(2);
    });
  });

  it("calls API with correct parameters", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/analytics/forms/test-form/", {
        params: {
          start_date: undefined,
          end_date: undefined,
        },
      });
    });
  });

  it("handles API errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockApi.get.mockRejectedValue(new Error("API Error"));

    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load analytics")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("shows empty state when no data", async () => {
    mockApi.get.mockResolvedValue({
      data: {
        overview: { total_views: 0, total_submissions: 0, conversion_rate: 0, completion_rate: 0 },
        views_over_time: [],
        funnel: [],
        completion_rates: [],
      },
    });

    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      expect(screen.getAllByText("0")).toHaveLength(2); // Total views and submissions
      expect(screen.getAllByText("0%")).toHaveLength(2); // Conversion and completion rates
    });
  });

  it("formats large numbers correctly", async () => {
    mockApi.get.mockResolvedValue({
      data: {
        ...mockAnalyticsData,
        overview: {
          total_views: 15750,
          total_submissions: 1250,
          conversion_rate: 7.9,
          completion_rate: 92.1,
        },
      },
    });

    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      expect(screen.getByText("15,750")).toBeInTheDocument();
      expect(screen.getByText("1,250")).toBeInTheDocument();
    });
  });
});
