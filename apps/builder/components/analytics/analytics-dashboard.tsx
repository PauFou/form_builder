'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  formId: string;
  organizationId: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export function AnalyticsDashboard({ formId, organizationId }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState('7d');
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());

  // Update dates when range changes
  useEffect(() => {
    const end = new Date();
    let start = new Date();
    
    switch (dateRange) {
      case '24h':
        start = subDays(end, 1);
        break;
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
    }
    
    setStartDate(startOfDay(start));
    setEndDate(endOfDay(end));
  }, [dateRange]);

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', formId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        organization_id: organizationId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_URL}/analytics/form/${formId}?${params}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch funnel data
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['funnel', formId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        organization_id: organizationId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_URL}/analytics/funnel/${formId}?${params}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch funnel');
      return response.json();
    },
  });

  // Fetch real-time data
  const { data: realtime } = useQuery({
    queryKey: ['realtime', formId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ANALYTICS_URL}/analytics/realtime/${formId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch realtime data');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Form performance and user insights
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Real-time indicator */}
      {realtime && (
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-muted-foreground">
            {Object.values(realtime.stats || {}).reduce((a: any, b: any) => a + b, 0)} events today
          </span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {analytics?.views.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Form loaded by visitors
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {analytics?.completions.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">Rate:</span>
                  <span className={
                    analytics?.completion_rate > 0.3 
                      ? 'text-green-600' 
                      : 'text-amber-600'
                  }>
                    {formatPercentage(analytics?.completion_rate || 0)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatDuration(analytics?.avg_completion_time_seconds || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  To complete form
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drop-off Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPercentage(analytics?.drop_off_rate || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Started but not completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="dropoff">Drop-off Analysis</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                User progression through your form
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <Skeleton className="h-[400px]" />
              ) : funnel?.funnel ? (
                <ResponsiveContainer width="100%" height={400}>
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="count"
                      data={funnel.funnel}
                      isAnimationActive
                    >
                      <LabelList
                        position="center"
                        content={({ value, name }: any) => (
                          <text
                            x="50%"
                            y="50%"
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan x="50%" dy="-0.5em" fontSize="14">
                              {name}
                            </tspan>
                            <tspan x="50%" dy="1.5em" fontSize="20" fontWeight="bold">
                              {value}
                            </tspan>
                          </text>
                        )}
                      />
                      {funnel.funnel.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No funnel data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
              <CardDescription>
                Form views by device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-[300px]" />
              ) : analytics?.device_breakdown ? (
                <div className="space-y-4">
                  {Object.entries(analytics.device_breakdown).map(([device, count]: [string, any]) => {
                    const Icon = DEVICE_ICONS[device as keyof typeof DEVICE_ICONS] || Monitor;
                    const percentage = (count / analytics.views) * 100;
                    
                    return (
                      <div key={device} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{device}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {count.toLocaleString()} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No device data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dropoff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Drop-off Points</CardTitle>
              <CardDescription>
                Where users are abandoning the form
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-[300px]" />
              ) : analytics?.top_drop_off_points?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.top_drop_off_points.map((point: any, index: number) => (
                    <div key={point.step_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">Step: {point.step_id}</span>
                        </div>
                        <div className="text-sm text-right">
                          <div>
                            <span className="text-muted-foreground">Drop rate: </span>
                            <span className="font-medium text-red-600">
                              {formatPercentage(point.drop_rate)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {point.started - point.completed} of {point.started} dropped
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={point.drop_rate * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No drop-off data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Rate</CardTitle>
              <CardDescription>
                Form validation and submission errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-[200px]" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                      <div>
                        <p className="font-semibold">Overall Error Rate</p>
                        <p className="text-sm text-muted-foreground">
                          Percentage of interactions with errors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatPercentage(analytics?.error_rate || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {analytics?.error_rate > 0.05 ? (
                          <span className="text-amber-600">Above average</span>
                        ) : (
                          <span className="text-green-600">Good</span>
                        )}
                      </p>
                    </div>
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