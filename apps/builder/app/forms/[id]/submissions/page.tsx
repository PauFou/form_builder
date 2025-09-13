"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@forms/ui";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  TrendingUp,
  Users,
  Target,
  Timer,
  RefreshCw,
  AlertCircle,
  Bookmark,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
// import { FixedSizeList as List } from "react-window";

type Submission = {
  id: string;
  respondentId: string;
  completedAt: string | null;
  status: "completed" | "partial";
  score?: number;
  tags: string[];
  answers: Record<string, any>;
  metadata: {
    userAgent: string;
    ipAddress: string;
    duration: number;
    device: string;
    locale: string;
    referrer?: string;
  };
  webhookDeliveries?: WebhookDelivery[];
};

type WebhookDelivery = {
  id: string;
  webhookId: string;
  submissionId: string;
  url: string;
  status: "pending" | "success" | "failed";
  attempt: number;
  statusCode?: number;
  error?: string;
  sentAt: string;
  nextRetryAt?: string;
};

type FormStats = {
  views: number;
  submissions: number;
  completionRate: number;
  averageTime: number;
};

// Generate mock data for testing large datasets
const generateMockSubmissions = (count: number): Submission[] => {
  const submissions: Submission[] = [];
  const statuses: ("completed" | "partial")[] = ["completed", "completed", "completed", "partial"];
  const scores = [65, 72, 85, 92, 78, 89, 94, 67, 83, 91];
  const tags = [
    ["satisfied", "premium"],
    ["promoter"],
    ["detractor"],
    [],
    ["trial"],
    ["enterprise"],
  ];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const completedAt =
      status === "completed"
        ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    submissions.push({
      id: `sub_${i + 1}`,
      respondentId: `resp_${Math.random().toString(36).substring(2, 11)}`,
      completedAt,
      status,
      score: status === "completed" ? scores[Math.floor(Math.random() * scores.length)] : undefined,
      tags: tags[Math.floor(Math.random() * tags.length)],
      answers: {
        q1: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"][
          Math.floor(Math.random() * 4)
        ],
        q2: [
          ["Dashboard", "Analytics"],
          ["Forms", "Logic"],
          ["API", "Integrations"],
        ][Math.floor(Math.random() * 3)],
        q3: "Sample feedback response...",
      },
      metadata: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        duration: Math.floor(Math.random() * 600) + 30, // 30-630 seconds
        device: ["Chrome on macOS", "Safari on iOS", "Firefox on Windows"][
          Math.floor(Math.random() * 3)
        ],
        locale: "en-US",
        referrer: Math.random() > 0.5 ? "https://google.com" : undefined,
      },
      webhookDeliveries:
        Math.random() > 0.7
          ? [
              {
                id: `wh_${i}_1`,
                webhookId: "webhook_1",
                submissionId: `sub_${i + 1}`,
                url: "https://api.example.com/webhook",
                status: Math.random() > 0.8 ? "failed" : "success",
                attempt: Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 2 : 1,
                statusCode: Math.random() > 0.8 ? 500 : 200,
                error: Math.random() > 0.8 ? "Connection timeout" : undefined,
                sentAt: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
                nextRetryAt:
                  Math.random() > 0.8
                    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
                    : undefined,
              },
            ]
          : [],
    });
  }

  return submissions;
};

const mockSubmissions = generateMockSubmissions(1000); // Generate 1000 submissions for testing

const mockStats: FormStats = {
  views: 2847,
  submissions: 1127,
  completionRate: 0.85,
  averageTime: 245, // seconds
};

export default function SubmissionsPage() {
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [exportProgress, setExportProgress] = useState<{
    isExporting: boolean;
    progress: number;
    format?: string;
  }>({ isExporting: false, progress: 0 });
  // const [savedViews, setSavedViews] = useState<Array<{id: string; name: string; filters: any}>>([]);

  // Column helper for TanStack Table
  const columnHelper = createColumnHelper<Submission>();

  // Define columns for the table
  const columns = useMemo<ColumnDef<Submission, any>[]>(
    () => [
      // Selection column
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 50,
      },
      columnHelper.accessor("respondentId" as any, {
        header: "Respondent",
        cell: ({ row }) => (
          <div
            className="cursor-pointer hover:text-primary"
            onClick={() => setSelectedSubmission(row.original)}
          >
            <div className="font-medium text-sm">{row.original.respondentId}</div>
            <div className="text-xs text-muted-foreground">{row.original.id}</div>
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor("status" as any, {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          return status === "completed" ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              <Clock className="h-3 w-3" />
              Partial
            </span>
          );
        },
        size: 120,
      }),
      columnHelper.accessor("completedAt" as any, {
        header: "Submitted",
        cell: ({ getValue }) => {
          const date = getValue();
          return date ? (
            <div>
              <div className="text-sm">{new Date(date).toLocaleDateString()}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(date).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
        size: 150,
      }),
      columnHelper.accessor("score" as any, {
        header: "Score",
        cell: ({ getValue }) => {
          const score = getValue();
          return score !== undefined ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{score}</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${score}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
        size: 120,
      }),
      columnHelper.accessor("tags" as any, {
        header: "Tags",
        cell: ({ getValue }) => {
          const tags = getValue();
          return (
            <div className="flex gap-1 flex-wrap">
              {tags.length > 0 ? (
                tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          );
        },
        size: 150,
      }),
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedSubmission(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        ),
        size: 80,
      },
    ],
    [columnHelper]
  );

  // Filtered data
  const filteredData = useMemo(() => {
    return mockSubmissions.filter(
      (submission) =>
        submission.respondentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.answers.q1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  // Initialize React Table
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: (updater) => {
      const currentSelection = Object.fromEntries(
        Array.from(selectedSubmissions).map((id) => [id, true])
      );
      const newSelection = typeof updater === "function" ? updater(currentSelection) : updater;
      setSelectedSubmissions(
        new Set(Object.keys(newSelection).filter((key) => newSelection[key] === true))
      );
    },
    state: {
      rowSelection: Object.fromEntries(Array.from(selectedSubmissions).map((id) => [id, true])),
    },
    getRowId: (row) => row.id,
  });

  // Export functionality
  const handleExport = async (format: "csv" | "parquet") => {
    setExportProgress({ isExporting: true, progress: 0, format });

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setExportProgress((prev) => ({ ...prev, progress: i }));
    }

    // Simulate download
    const blob = new Blob(["Mock export data"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    setExportProgress({ isExporting: false, progress: 0 });
  };

  // Webhook redrive functionality
  const handleWebhookRedrive = async (deliveryId: string) => {
    console.log(`Redriving webhook delivery: ${deliveryId}`);
    // In real implementation, this would call the API
  };

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header with Stats */}
        <header className="border-b bg-card">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to form
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="font-semibold">Submissions</h1>
                <p className="text-xs text-muted-foreground">
                  {mockStats.submissions.toLocaleString()} responses •{" "}
                  {Math.round(mockStats.completionRate * 100)}% completion rate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                disabled={exportProgress.isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportProgress.isExporting && exportProgress.format === "csv"
                  ? `Exporting... ${exportProgress.progress}%`
                  : "Export CSV"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("parquet")}
                disabled={exportProgress.isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportProgress.isExporting && exportProgress.format === "parquet"
                  ? `Exporting... ${exportProgress.progress}%`
                  : "Export Parquet"}
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8 px-6 py-4 bg-muted/30 border-t">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{mockStats.views.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{mockStats.submissions.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Submissions</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">
                  {Math.round(mockStats.completionRate * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Completion</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{formatDuration(mockStats.averageTime)}</div>
                <div className="text-xs text-muted-foreground">Avg Time</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-600">+12%</div>
                <div className="text-xs text-muted-foreground">vs Last Week</div>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search responses..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
              <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                2
              </span>
            </Button>
          </div>
          {selectedSubmissions.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedSubmissions.size} selected
              </span>
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Add tag
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4 mr-2" />
                Export selected
              </Button>
            </div>
          )}

          {/* Saved Views */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Views
            </Button>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Save Current View
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-muted/30"
          >
            <div className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Status</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option>All statuses</option>
                    <option>Completed</option>
                    <option>Partial</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Date range</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <input type="date" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Tags</label>
                  <input
                    type="text"
                    placeholder="Filter by tags..."
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Score range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" size="sm">
                  Clear filters
                </Button>
                <Button size="sm">Apply filters</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TanStack Table with React Window for Virtualization */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="flex bg-muted/50 border-b sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => {
                const width = header.getSize();
                return (
                  <div
                    key={header.id}
                    className="px-4 py-3 text-sm font-medium flex items-center border-r last:border-r-0"
                    style={{ width, minWidth: width, maxWidth: width }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                );
              })
            )}
          </div>

          {/* Table Body - Scrollable with pagination-like approach */}
          <div className="flex-1 overflow-auto">
            <div className="min-w-full">
              {table
                .getRowModel()
                .rows.slice(0, 100)
                .map((row) => (
                  <div
                    key={row.id}
                    className="flex border-b hover:bg-muted/30 transition-colors items-center"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const column = cell.column;
                      const width = column.getSize();
                      return (
                        <div
                          key={cell.id}
                          className="px-4 py-3 flex items-center border-r last:border-r-0"
                          style={{ width, minWidth: width, maxWidth: width }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>

          {/* Table Footer */}
          <div className="border-t px-4 py-3 bg-muted/30 text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of {filteredData.length} submissions
            {selectedSubmissions.size > 0 && (
              <span className="ml-4">• {selectedSubmissions.size} selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Detail Panel with Webhooks */}
      <div className="w-96 border-l bg-card flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Response Details</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedSubmission ? (
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Metadata</h4>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-1">Submitted</dt>
                    <dd className="font-medium">
                      {selectedSubmission.completedAt
                        ? new Date(selectedSubmission.completedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "In progress"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Duration</dt>
                    <dd className="font-medium">
                      {formatDuration(selectedSubmission.metadata.duration)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Device</dt>
                    <dd className="font-medium">{selectedSubmission.metadata.device}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">IP Address</dt>
                    <dd className="font-medium font-mono text-xs">
                      {selectedSubmission.metadata.ipAddress}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Locale</dt>
                    <dd className="font-medium">{selectedSubmission.metadata.locale}</dd>
                  </div>
                  {selectedSubmission.metadata.referrer && (
                    <div>
                      <dt className="text-muted-foreground mb-1">Referrer</dt>
                      <dd className="font-medium text-xs break-all">
                        {selectedSubmission.metadata.referrer}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Answers</h4>
                <div className="space-y-4">
                  {Object.entries(selectedSubmission.answers).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                        {key === "q1"
                          ? "Satisfaction"
                          : key === "q2"
                            ? "Features Used"
                            : key === "q3"
                              ? "Feedback"
                              : key}
                      </p>
                      <p className="text-sm font-medium">
                        {Array.isArray(value) ? value.join(", ") : value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubmission.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Tags</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSubmission.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Webhook Timeline */}
              {selectedSubmission.webhookDeliveries &&
                selectedSubmission.webhookDeliveries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Webhook Timeline</h4>
                    <div className="space-y-3">
                      {selectedSubmission.webhookDeliveries.map((delivery) => (
                        <div key={delivery.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {delivery.status === "success" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : delivery.status === "failed" ? (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className="text-xs font-medium capitalize">
                                {delivery.status}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(delivery.sentAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-muted-foreground">URL:</span>{" "}
                              <span className="font-mono">{delivery.url}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Attempt:</span>{" "}
                              {delivery.attempt}
                            </div>
                            {delivery.statusCode && (
                              <div>
                                <span className="text-muted-foreground">Status:</span>{" "}
                                {delivery.statusCode}
                              </div>
                            )}
                            {delivery.error && (
                              <div className="text-red-600">
                                <span className="text-muted-foreground">Error:</span>{" "}
                                {delivery.error}
                              </div>
                            )}
                          </div>
                          {delivery.status === "failed" && (
                            <div className="pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWebhookRedrive(delivery.id)}
                                className="w-full"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Redrive
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full mb-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Response
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {selectedSubmissions.size === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-8">
                  Click on a response to view details
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-center">
                    {selectedSubmissions.size} responses selected
                  </p>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      <Tag className="h-4 w-4 mr-2" />
                      Bulk Add Tags
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
