"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@forms/ui";
import { BarChart3, Users, Clock, TrendingUp, Activity } from "lucide-react";

interface AnalyticsDashboardProps {
  formId: string;
}

export function AnalyticsDashboard({ formId }: AnalyticsDashboardProps) {
  // Mock data for demonstration
  const stats = {
    totalViews: 1234,
    totalSubmissions: 456,
    avgCompletionTime: "3m 24s",
    completionRate: 78,
    dropOffRate: 22,
  };

  const questionStats = [
    { question: "How satisfied are you?", answered: 450, skipped: 6 },
    { question: "What features do you use?", answered: 440, skipped: 16 },
    { question: "Any suggestions?", answered: 420, skipped: 36 },
  ];

  return (
    <div className="space-y-6">
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>Analytics are in beta</AlertTitle>
        <AlertDescription>
          These are sample analytics. Real-time analytics will be available in production.
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">+4% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletionTime}</div>
            <p className="text-xs text-muted-foreground">-18s from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Question Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Question Performance</CardTitle>
          <CardDescription>Response rates for each question in your form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questionStats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{stat.question}</p>
                  <span className="text-sm text-muted-foreground">{stat.answered} answered</span>
                </div>
                <Progress
                  value={(stat.answered / (stat.answered + stat.skipped)) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funnel Analysis Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Funnel Analysis</CardTitle>
          <CardDescription>Drop-off points in your form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-3" />
              <p>Funnel visualization coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
