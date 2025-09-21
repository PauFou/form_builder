"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from "@skemya/ui";
import { Users, FileText, Activity, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { formsApi } from "../../lib/api/forms";
import { apiClient } from "../../lib/api/axios-client";

interface AnalyticsDashboardProps {
  formId: string;
}

interface Submission {
  id: string;
  form: string;
  completed_at: string | null;
  started_at: string;
  respondent_key: string;
  metadata_json: any;
  answers?: any[];
}

export function AnalyticsDashboardReal({ formId }: AnalyticsDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch form data
  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => formsApi.get(formId),
  });

  // Fetch submissions - using the actual API endpoint
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["submissions", formId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/v1/forms/${formId}/submissions/`);
        // Handle both paginated and non-paginated responses
        if (response.data.results) {
          // DRF paginated response
          return {
            submissions: response.data.results,
            total: response.data.count || response.data.results.length,
          };
        } else if (Array.isArray(response.data)) {
          // Direct array response
          return {
            submissions: response.data,
            total: response.data.length,
          };
        } else {
          // Custom response format
          return {
            submissions: response.data.submissions || [],
            total: response.data.total || 0,
          };
        }
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
        return { submissions: [], total: 0 };
      }
    },
  });

  const submissions = submissionsData?.submissions || [];
  const totalSubmissions = submissionsData?.total || 0;

  // Calculate real statistics from actual data
  const stats = {
    totalSubmissions,
    totalQuestions: form?.pages?.reduce((acc, page) => acc + (page.blocks?.length || 0), 0) || 0,
    publishStatus: form?.status || "draft",
    lastSubmission:
      submissions.length > 0
        ? submissions
            .filter((s: Submission) => s.completed_at)
            .sort(
              (a: any, b: any) =>
                new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
            )[0]?.completed_at
        : null,
    submissionsToday: submissions.filter((s: Submission) => {
      if (!s.completed_at) return false;
      const submissionDate = new Date(s.completed_at);
      const today = new Date();
      return submissionDate.toDateString() === today.toDateString();
    }).length,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchSubmissions();
      toast.success("Data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  if (formLoading || submissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Form Analytics</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Real Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">All time responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Form Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Across {form?.pages?.length || 0} page{form?.pages?.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Form Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant={stats.publishStatus === "published" ? "default" : "secondary"}
                className={stats.publishStatus === "published" ? "bg-green-100 text-green-800" : ""}
              >
                {stats.publishStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.publishStatus === "published"
                ? "Accepting responses"
                : "Not accepting responses"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Submissions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissionsToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastSubmission
                ? `Last: ${format(new Date(stats.lastSubmission), "h:mm a")}`
                : "No submissions yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Latest responses to your form</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions
                .filter((s: Submission) => s.completed_at)
                .slice(0, 5)
                .map((submission: Submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Respondent {submission.respondent_key.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(submission.completed_at!), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                ))}
              {totalSubmissions > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {totalSubmissions - 5} more...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No submissions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {form?.status === "published"
                  ? "Share your form to start collecting responses"
                  : "Publish your form to start collecting responses"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Form Information</CardTitle>
          <CardDescription>Details about your form structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Form Title</span>
              <span className="text-sm font-medium">{form?.title || "Untitled Form"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Created</span>
              <span className="text-sm font-medium">
                {form?.createdAt ? format(new Date(form.createdAt), "MMM d, yyyy") : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Updated</span>
              <span className="text-sm font-medium">
                {form?.updatedAt ? format(new Date(form.updatedAt), "MMM d, yyyy") : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Pages</span>
              <span className="text-sm font-medium">{form?.pages?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Questions</span>
              <span className="text-sm font-medium">{stats.totalQuestions}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
