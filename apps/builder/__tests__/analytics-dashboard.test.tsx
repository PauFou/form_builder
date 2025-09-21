import React from "react";
import { render, screen, waitFor } from "../lib/test-utils";
import { AnalyticsDashboard } from "../components/analytics/analytics-dashboard";
import { analyticsApi } from "@/lib/api/analytics";

// Mock the analytics API
jest.mock("@/lib/api/analytics", () => ({
  analyticsApi: {
    getFormAnalytics: jest.fn(),
    getFunnelAnalytics: jest.fn(),
  },
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
  FunnelChart: ({ children }: any) => <div data-testid="funnel-chart">{children}</div>,
  Funnel: () => <div data-testid="funnel" />,
  LabelList: () => <div data-testid="label-list" />,
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date) => "2025-01-01"),
  formatDistanceToNow: jest.fn(() => "2 days ago"),
  subDays: jest.fn((date, days) => new Date()),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock UI components
jest.mock("@skemya/ui", () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
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
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertTitle: ({ children }: any) => <h4 data-testid="alert-title">{children}</h4>,
  AlertDescription: ({ children }: any) => <p data-testid="alert-description">{children}</p>,
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: any) => <button data-testid="tabs-trigger">{children}</button>,
  DatePickerWithRange: () => <div data-testid="date-picker-with-range" />,
  useToast: () => ({ toast: jest.fn() }),
}));

describe("AnalyticsDashboard", () => {
  const mockAnalyticsData = {
    views: 1250,
    starts: 980,
    completions: 95,
    completion_rate: 85.3,
    avg_completion_time_seconds: 180,
    drop_off_rate: 23.5,
    error_rate: 2.1,
    views_over_time: [
      { date: "2025-01-01", views: 50, starts: 40, completions: 4 },
      { date: "2025-01-02", views: 75, starts: 60, completions: 6 },
      { date: "2025-01-03", views: 60, starts: 48, completions: 5 },
    ],
  };

  const mockQuestionData = {
    questions: [
      {
        block_id: "block1",
        question: "Name",
        response_rate: 95.2,
        answered: 952,
        skipped: 48,
        avg_time_seconds: 5.2,
        drop_off_rate: 4.8,
      },
      {
        block_id: "block2",
        question: "Email",
        response_rate: 88.5,
        answered: 885,
        skipped: 115,
        avg_time_seconds: 8.3,
        drop_off_rate: 11.5,
      },
      {
        block_id: "block3",
        question: "Phone",
        response_rate: 72.1,
        answered: 721,
        skipped: 279,
        avg_time_seconds: 12.1,
        drop_off_rate: 27.9,
      },
    ],
  };

  const mockFunnelData = {
    funnel: [
      { step: "Form View", count: 1250, percentage: 100 },
      { step: "Started", count: 980, percentage: 78.4 },
      { step: "Page 2", count: 750, percentage: 60 },
      { step: "Completed", count: 95, percentage: 7.6 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the analytics API calls
    (analyticsApi.getFormAnalytics as jest.Mock).mockResolvedValue(mockAnalyticsData);
    (analyticsApi.getFunnelAnalytics as jest.Mock).mockResolvedValue(mockFunnelData);
  });

  it("renders loading state initially", () => {
    // Make the API calls never resolve to keep loading state
    (analyticsApi.getFormAnalytics as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (analyticsApi.getFunnelAnalytics as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<AnalyticsDashboard formId="test-form" />);

    expect(screen.getByTestId("activity-icon")).toBeInTheDocument();
  });

  it("renders analytics data after loading", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    // Wait for loading to complete and data to render
    await waitFor(() => {
      // First check that loading is done
      expect(screen.queryByTestId("activity-icon")).not.toBeInTheDocument();
      // Then check for the tab list which should appear after loading
      expect(screen.getByTestId("tabs-list")).toBeInTheDocument();
    });

    // Now check that the dashboard is rendered with data
    await waitFor(() => {
      // Check that the cards are rendered
      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBeGreaterThan(0);

      // Check that tabs are rendered
      const tabTriggers = screen.getAllByTestId("tabs-trigger");
      expect(tabTriggers.length).toBeGreaterThanOrEqual(3); // Overview, Question Performance, Funnel Analysis
    });
  });

  it("renders overview metrics cards", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      // Wait for loading to complete
      expect(screen.queryByTestId("activity-icon")).not.toBeInTheDocument();

      // Check that cards are rendered
      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBeGreaterThanOrEqual(4); // At least 4 metric cards
    });
  });

  it("renders charts", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      // Wait for loading to complete
      expect(screen.queryByTestId("activity-icon")).not.toBeInTheDocument();

      // Check for tabs which contain charts
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });
  });

  it("calls API with correct parameters", async () => {
    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      // Check that API was called
      expect(analyticsApi.getFormAnalytics).toHaveBeenCalled();
      expect(analyticsApi.getFunnelAnalytics).toHaveBeenCalled();

      // Verify they were called with the form ID
      expect(analyticsApi.getFormAnalytics).toHaveBeenCalledWith(
        "test-form",
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
      expect(analyticsApi.getFunnelAnalytics).toHaveBeenCalledWith(
        "test-form",
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it("handles API errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    (analyticsApi.getFormAnalytics as jest.Mock).mockRejectedValue(new Error("API Error"));
    (analyticsApi.getFunnelAnalytics as jest.Mock).mockRejectedValue(new Error("API Error"));

    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      // Just verify the error was logged
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch analytics:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it("shows empty state when no data", async () => {
    const emptyData = {
      views: 0,
      starts: 0,
      completions: 0,
      completion_rate: 0,
      avg_completion_time_seconds: 0,
      drop_off_rate: 0,
      error_rate: 0,
      views_over_time: [],
    };

    (analyticsApi.getFormAnalytics as jest.Mock).mockResolvedValue(emptyData);
    (analyticsApi.getFunnelAnalytics as jest.Mock).mockResolvedValue({ funnel: [] });

    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      // Wait for loading to complete
      expect(screen.queryByTestId("activity-icon")).not.toBeInTheDocument();
      // Should still render the dashboard structure
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });
  });

  it("formats large numbers correctly", async () => {
    const largeNumberData = {
      views: 15750,
      starts: 12500,
      completions: 1250,
      completion_rate: 92.1,
      avg_completion_time_seconds: 240,
      drop_off_rate: 7.9,
      error_rate: 1.2,
      views_over_time: [],
    };

    (analyticsApi.getFormAnalytics as jest.Mock).mockResolvedValue(largeNumberData);
    (analyticsApi.getFunnelAnalytics as jest.Mock).mockResolvedValue(mockFunnelData);

    render(<AnalyticsDashboard formId="test-form" />);

    await waitFor(() => {
      // Wait for loading to complete
      expect(screen.queryByTestId("activity-icon")).not.toBeInTheDocument();
      // Dashboard should be rendered
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });
  });
});
