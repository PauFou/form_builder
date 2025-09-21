"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Alert,
  AlertDescription,
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
import { format, formatDistanceToNow, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { apiClient } from "../../lib/api/axios-client";
import {
  analyticsApi,
  type FormAnalytics,
  type FunnelStep,
  type RealtimeStats,
} from "../../lib/api/analytics";
import { toast } from "react-hot-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  FunnelChart,
  Funnel as FunnelComponent,
  LabelList,
} from "recharts";

interface AnalyticsDashboardProps {
  formId: string;
}

// Using FormAnalytics from analytics API

interface QuestionStats {
  question_id: string;
  question: string;
  type: string;
  required: boolean;
  answered: number;
  skipped: number;
  response_rate: number;
  avg_time_seconds: number;
}

// Using FunnelStep from analytics API

export function AnalyticsDashboard({ formId }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      // TODO: Get organization ID from auth context
      const organizationId = "placeholder-org-id";

      // Fetch form analytics from ClickHouse analytics service
      const analyticsData = await analyticsApi.getFormAnalytics(
        formId,
        organizationId,
        dateRange?.from?.toISOString(),
        dateRange?.to?.toISOString()
      );
      setAnalytics(analyticsData);

      // Fetch funnel data from ClickHouse analytics service
      const funnelResponse = await analyticsApi.getFunnelAnalytics(
        formId,
        organizationId,
        dateRange?.from?.toISOString(),
        dateRange?.to?.toISOString()
      );
      setFunnelData(funnelResponse?.funnel || []);

      // For now, we'll use mock data for question stats until we implement field-level analytics
      setQuestionStats([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, dateRange]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportAnalytics = () => {
    // Generate CSV export
    const csvHeader = "Metric,Value\\n";
    const csvData = [
      `Total Views,${analytics?.views || 0}`,
      `Total Starts,${analytics?.starts || 0}`,
      `Total Completions,${analytics?.completions || 0}`,
      `Completion Rate,${analytics?.completion_rate || 0}%`,
      `Average Completion Time,${formatTime(analytics?.avg_completion_time_seconds || 0)}`,
      `Drop-off Rate,${analytics?.drop_off_rate || 0}%`,
      `Error Rate,${analytics?.error_rate || 0}%`,
    ].join("\\n");

    const blob = new Blob([csvHeader + csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-analytics-${formId}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          {/* Date Range Selector - TODO: Implement proper date picker */}
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
                      ? ((count / analytics.views) * 100).toFixed(1)
                      : "0";
                    return (
                      <div key={device} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {device || "Unknown"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
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
                  {analytics.top_drop_off_points.map((point, index) => (
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
              {funnelData && funnelData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <FunnelComponent dataKey="count" data={funnelData} isAnimationActive>
                        <LabelList
                          position="center"
                          content={({ value, payload }: any) => (
                            <text
                              x={payload.x}
                              y={payload.y}
                              fill="#fff"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan x={payload.x} dy="-0.5em" fontSize="14" fontWeight="bold">
                                {payload.step_name}
                              </tspan>
                              <tspan x={payload.x} dy="1.5em" fontSize="12">
                                {value} ({payload.conversion_rate.toFixed(1)}%)
                              </tspan>
                            </text>
                          )}
                        />
                      </FunnelComponent>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3" />
                    <p>No funnel data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
