"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from "@skemya/ui";
import {
  ArrowLeft,
  Download,
  Search,
  Eye,
  Trash2,
  Filter,
  Calendar,
  Users,
  BarChart3,
  FileText,
} from "lucide-react";

import { formsApi } from "../../../../lib/api/forms";
import { apiClient } from "../../../../lib/api/axios-client";

interface Submission {
  id: string;
  form: string;
  completed_at: string | null;
  started_at: string;
  respondent_key: string;
  metadata_json: any;
  answers: Answer[];
}

interface Answer {
  id: string;
  block_id: string;
  type: string;
  value_json: any;
}

export default function FormResponsesPage() {
  const params = useParams();
  const formId = params.id as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Fetch form data
  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => formsApi.get(formId),
  });

  // Fetch submissions
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["submissions", formId, searchQuery],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/forms/${formId}/submissions/`, {
        params: {
          search: searchQuery,
          ordering: "-completed_at",
          expand: "answers", // Request answers to be included
        },
      });

      if (response.data.results) {
        return {
          submissions: response.data.results,
          total: response.data.count,
        };
      } else if (Array.isArray(response.data)) {
        return {
          submissions: response.data,
          total: response.data.length,
        };
      }

      return { submissions: [], total: 0 };
    },
  });

  const submissions = submissionsData?.submissions || [];
  const totalSubmissions = submissionsData?.total || 0;

  const handleExport = async () => {
    try {
      const response = await apiClient.post(`/v1/forms/${formId}/submissions/export/`, {
        format: "csv",
      });

      if (response.headers["content-type"]?.includes("text/csv")) {
        // Direct CSV response
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `form-${formId}-responses-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (response.data.url) {
        // URL response
        window.open(response.data.url, "_blank");
      }

      toast.success("Export completed");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const getAnswerValue = (answer: Answer): string => {
    if (!answer.value_json) return "—";

    if (typeof answer.value_json === "string") {
      return answer.value_json;
    }

    if (answer.value_json.value) {
      return answer.value_json.value;
    }

    if (answer.value_json.text) {
      return answer.value_json.text;
    }

    if (Array.isArray(answer.value_json)) {
      return answer.value_json.join(", ");
    }

    return JSON.stringify(answer.value_json);
  };

  const getBlockQuestion = (blockId: string): string => {
    if (!form) return blockId;

    for (const page of form.pages || []) {
      const block = page.blocks?.find((b) => b.id === blockId);
      if (block) {
        return block.question || blockId;
      }
    }

    return blockId;
  };

  if (formLoading || submissionsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/forms/${formId}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{form?.title} - Responses</h1>
            {form?.description && <p className="text-muted-foreground">{form.description}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/forms/${formId}/analytics`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter((s: Submission) => s.completed_at).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter((s: Submission) => !s.completed_at).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSubmissions > 0
                ? `${Math.round((submissions.filter((s: Submission) => s.completed_at).length / totalSubmissions) * 100)}%`
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by respondent ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="cards">Card View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Responses */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
            <p className="text-muted-foreground mb-4">
              {form?.status === "published"
                ? "Share your form to start collecting responses"
                : "Publish your form to start collecting responses"}
            </p>
            {form?.status !== "published" && (
              <Button asChild>
                <Link href={`/forms/${formId}/edit`}>Go to Editor</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left font-medium p-4 w-48">Respondent</th>
                  <th className="text-left font-medium p-4 w-48">Started</th>
                  <th className="text-left font-medium p-4 w-48">Completed</th>
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-right font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission: Submission) => (
                  <tr key={submission.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{submission.respondent_key.slice(0, 8)}...</td>
                    <td className="p-4">
                      {format(new Date(submission.started_at), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="p-4">
                      {submission.completed_at
                        ? format(new Date(submission.completed_at), "MMM d, yyyy h:mm a")
                        : "—"}
                    </td>
                    <td className="p-4">
                      <Badge variant={submission.completed_at ? "default" : "secondary"}>
                        {submission.completed_at ? "Completed" : "In Progress"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {submissions.map((submission: Submission) => (
            <Card
              key={submission.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedSubmission(submission)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Respondent {submission.respondent_key.slice(0, 8)}...
                  </CardTitle>
                  <Badge variant={submission.completed_at ? "default" : "secondary"}>
                    {submission.completed_at ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                <CardDescription>
                  Started {format(new Date(submission.started_at), "MMM d, yyyy 'at' h:mm a")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {submission.answers?.slice(0, 3).map((answer: Answer) => (
                    <div key={answer.id}>
                      <span className="font-medium">{getBlockQuestion(answer.block_id)}: </span>
                      <span className="text-muted-foreground">{getAnswerValue(answer)}</span>
                    </div>
                  ))}
                  {submission.answers?.length > 3 && (
                    <p className="text-muted-foreground">
                      ...and {submission.answers.length - 3} more answers
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Respondent ID</p>
                  <p className="text-muted-foreground">{selectedSubmission.respondent_key}</p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <Badge variant={selectedSubmission.completed_at ? "default" : "secondary"}>
                    {selectedSubmission.completed_at ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">Started</p>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedSubmission.started_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Completed</p>
                  <p className="text-muted-foreground">
                    {selectedSubmission.completed_at
                      ? format(new Date(selectedSubmission.completed_at), "MMM d, yyyy 'at' h:mm a")
                      : "Not completed"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Answers</h3>
                <div className="space-y-3">
                  {selectedSubmission.answers?.map((answer) => (
                    <div key={answer.id} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium mb-1">{getBlockQuestion(answer.block_id)}</p>
                      <p className="text-muted-foreground">{getAnswerValue(answer)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
