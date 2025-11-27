"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  Calendar,
  Tag,
  CheckSquare,
  XSquare,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Checkbox,
} from "@skemya/ui";
import { toast } from "react-hot-toast";
import { formsApi } from "../../../../lib/api/forms";
import { formatDistanceToNow } from "date-fns";

interface Submission {
  id: string;
  formId: string;
  respondentKey: string;
  createdAt: Date;
  completedAt?: Date;
  status: "completed" | "partial" | "abandoned";
  answers: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    location?: string;
  };
  tags?: string[];
}

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<string[]>([]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSubmissions();
    loadTags();
  }, [formId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await formsApi.getSubmissions(formId, {
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setSubmissions(response.submissions);
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await formsApi.getTags(formId);
      setTags(response);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  // Filter submissions based on search
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        // Search in answers
        const answerText = Object.values(submission.answers)
          .map((v) => String(v))
          .join(" ")
          .toLowerCase();

        if (
          !answerText.includes(searchLower) &&
          !submission.respondentKey.toLowerCase().includes(searchLower) &&
          !submission.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, searchQuery]);

  // Virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: filteredSubmissions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(new Set(filteredSubmissions.map((s) => s.id)));
    } else {
      setSelectedSubmissions(new Set());
    }
  };

  const handleSelectSubmission = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedSubmissions);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedSubmissions(newSelection);
  };

  const handleBulkExport = async () => {
    try {
      const ids = Array.from(selectedSubmissions);
      const response = await formsApi.exportSubmissions(formId, { ids, format: "csv" });
      // Handle download
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submissions-${formId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Submissions exported");
    } catch (error) {
      console.error("Failed to export submissions:", error);
      toast.error("Failed to export submissions");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedSubmissions.size} submissions? This cannot be undone.`)) {
      return;
    }

    try {
      const ids = Array.from(selectedSubmissions);
      await formsApi.deleteSubmissions(formId, ids);
      setSubmissions((prev) => prev.filter((s) => !selectedSubmissions.has(s.id)));
      setSelectedSubmissions(new Set());
      toast.success(`Deleted ${ids.length} submissions`);
    } catch (error) {
      console.error("Failed to delete submissions:", error);
      toast.error("Failed to delete submissions");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "partial":
        return "warning";
      case "abandoned":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/forms")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Forms
              </Button>
              <h1 className="text-lg font-semibold">Submissions</h1>
              <Badge variant="secondary">{filteredSubmissions.length} total</Badge>
            </div>

            <div className="flex items-center gap-2">
              {selectedSubmissions.size > 0 && (
                <>
                  <Badge variant="outline">{selectedSubmissions.size} selected</Badge>
                  <Button variant="outline" size="sm" onClick={handleBulkExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b bg-background/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <XSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No submissions found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Submissions will appear here once respondents complete your form"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            {/* Table Header */}
            <div className="flex items-center gap-4 p-4 border-b bg-muted/50">
              <Checkbox
                checked={
                  selectedSubmissions.size === filteredSubmissions.length &&
                  filteredSubmissions.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <div className="grid grid-cols-12 gap-4 flex-1 text-sm font-medium">
                <div className="col-span-2">Respondent</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Submitted</div>
                <div className="col-span-3">Tags</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            </div>

            {/* Virtual List */}
            <div ref={parentRef} className="h-[600px] overflow-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const submission = filteredSubmissions[virtualRow.index];
                  const isSelected = selectedSubmissions.has(submission.id);

                  return (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="flex items-center gap-4 px-4 py-3 border-b hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectSubmission(submission.id, checked as boolean)
                        }
                      />

                      <div className="grid grid-cols-12 gap-4 flex-1">
                        <div className="col-span-2 font-medium">{submission.respondentKey}</div>

                        <div className="col-span-2">
                          <Badge variant={getStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </div>

                        <div className="col-span-3 text-sm text-muted-foreground">
                          {submission.completedAt
                            ? formatDistanceToNow(new Date(submission.completedAt), {
                                addSuffix: true,
                              })
                            : "Not completed"}
                        </div>

                        <div className="col-span-3 flex flex-wrap gap-1">
                          {submission.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/forms/${formId}/submissions/${submission.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {}}>
                                <Tag className="h-4 w-4 mr-2" />
                                Add Tags
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {}}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {}} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
