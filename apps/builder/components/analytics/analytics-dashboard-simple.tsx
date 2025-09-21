"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { toast } from "react-hot-toast";

interface AnalyticsDashboardProps {
  formId: string;
}

// Mock data for now - replace with real API calls
const getMockAnalytics = () => ({
  form_id: "1",
  views: 1250,
  starts: 850,
  completions: 620,
  completion_rate: 0.729,
  avg_completion_time_seconds: 180,
  drop_off_rate: 0.271,
  error_rate: 0.02,
  device_breakdown: {
    desktop: 750,
    mobile: 400,
    tablet: 100,
  },
  top_drop_off_points: [
    { step_id: "email", started: 850, completed: 780, drop_rate: 0.082 },
    { step_id: "address", started: 780, completed: 690, drop_rate: 0.115 },
    { step_id: "payment", started: 690, completed: 620, drop_rate: 0.101 },
  ],
});

const getMockQuestionStats = () => [
  {
    question_id: "1",
    question: "What's your name?",
    type: "short_text",
    required: true,
    answered: 850,
    skipped: 0,
    response_rate: 100,
  },
  {
    question_id: "2",
    question: "Email address",
    type: "email",
    required: true,
    answered: 780,
    skipped: 70,
    response_rate: 91.8,
  },
  {
    question_id: "3",
    question: "Phone number",
    type: "phone",
    required: false,
    answered: 650,
    skipped: 130,
    response_rate: 83.3,
  },
  {
    question_id: "4",
    question: "Address",
    type: "address",
    required: true,
    answered: 690,
    skipped: 90,
    response_rate: 88.5,
  },
];

export function AnalyticsDashboardSimple({ formId }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [questionStats, setQuestionStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use mock data for now
      setAnalytics(getMockAnalytics());
      setQuestionStats(getMockQuestionStats());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [formId]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportAnalytics = () => {
    const csvHeader = "Metric,Value\n";
    const csvData = [
      `Total Views,${analytics?.views || 0}`,
      `Total Starts,${analytics?.starts || 0}`,
      `Total Completions,${analytics?.completions || 0}`,
      `Completion Rate,${(analytics?.completion_rate * 100 || 0).toFixed(1)}%`,
      `Average Completion Time,${formatTime(analytics?.avg_completion_time_seconds || 0)}`,
      `Drop-off Rate,${(analytics?.drop_off_rate * 100 || 0).toFixed(1)}%`,
      `Error Rate,${(analytics?.error_rate * 100 || 0).toFixed(1)}%`,
    ].join("\n");

    const blob = new Blob([csvHeader + csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-analytics-${formId}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
              : "Last 30 days"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(false)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={exportAnalytics}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Question Performance</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.views || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                    : "All time"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.completions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.starts
                    ? `${analytics.completions} of ${analytics.starts} started`
                    : "No data"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(analytics?.avg_completion_time_seconds || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Per submission</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.completion_rate
                    ? `${(analytics.completion_rate * 100).toFixed(1)}%`
                    : "0%"}
                </div>
                <Progress value={(analytics?.completion_rate || 0) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Device Breakdown */}
          {analytics?.device_breakdown && Object.keys(analytics.device_breakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Form views by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.device_breakdown).map(([device, count]) => {
                    const percentage = analytics.views
                      ? (((count as number) / analytics.views) * 100).toFixed(1)
                      : "0";
                    return (
                      <div key={device} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {device || "Unknown"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {count as number} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={parseFloat(percentage)} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Drop-off Points */}
          {analytics?.top_drop_off_points && analytics.top_drop_off_points.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Drop-off Points</CardTitle>
                <CardDescription>Questions where users abandon the form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.top_drop_off_points.map((point: any, index: number) => (
                    <div key={point.step_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-sm">Step {point.step_id}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {(point.drop_rate * 100).toFixed(1)}% drop-off
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {point.completed} of {point.started} completed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Performance</CardTitle>
              <CardDescription>Response rates for each question in your form</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questionStats.length > 0 ? (
                  questionStats.map((stat) => (
                    <div key={stat.question_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{stat.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {stat.type}
                            </Badge>
                            {stat.required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {stat.response_rate.toFixed(1)}% answered
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stat.answered} of {stat.answered + stat.skipped} responses
                          </p>
                        </div>
                      </div>
                      <Progress value={stat.response_rate} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No question data available for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Funnel Analysis</CardTitle>
              <CardDescription>User progression through your form</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Funnel visualization coming soon</p>
                  <p className="text-sm mt-2">View conversion rates between form steps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
