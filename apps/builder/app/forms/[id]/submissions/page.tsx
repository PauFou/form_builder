"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";

type Submission = {
  id: string;
  respondentId: string;
  completedAt: string | null;
  status: "completed" | "partial";
  score?: number;
  tags: string[];
  answers: Record<string, any>;
};

const mockSubmissions: Submission[] = [
  {
    id: "sub_1",
    respondentId: "resp_abc123",
    completedAt: "2025-09-09T10:30:00Z",
    status: "completed",
    score: 85,
    tags: ["satisfied", "premium"],
    answers: {
      q1: "Very satisfied",
      q2: ["Dashboard", "Analytics", "API"],
      q3: "The analytics features are incredibly powerful...",
    },
  },
  {
    id: "sub_2",
    respondentId: "resp_def456",
    completedAt: "2025-09-09T09:15:00Z",
    status: "completed",
    score: 92,
    tags: ["promoter"],
    answers: {
      q1: "Satisfied",
      q2: ["Forms", "Logic"],
      q3: "Love the conditional logic capabilities...",
    },
  },
  {
    id: "sub_3",
    respondentId: "resp_ghi789",
    completedAt: null,
    status: "partial",
    tags: [],
    answers: {
      q1: "Neutral",
      q2: ["Dashboard"],
    },
  },
];

export default function SubmissionsPage({ params }: { params: { formId: string } }) {
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to form
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold">Submissions</h1>
              <p className="text-xs text-muted-foreground">127 responses • 85% completion rate</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export selected
              </Button>
            </div>
          )}
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

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr className="text-left">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedSubmissions.size === mockSubmissions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubmissions(new Set(mockSubmissions.map((s) => s.id)));
                      } else {
                        setSelectedSubmissions(new Set());
                      }
                    }}
                  />
                </th>
                <th className="p-4 text-sm font-medium">Respondent</th>
                <th className="p-4 text-sm font-medium">Status</th>
                <th className="p-4 text-sm font-medium">Submitted</th>
                <th className="p-4 text-sm font-medium">Score</th>
                <th className="p-4 text-sm font-medium">Tags</th>
                <th className="p-4 text-sm font-medium">Q1: Satisfaction</th>
                <th className="p-4 text-sm font-medium">Q2: Features</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {mockSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedSubmissions.has(submission.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedSubmissions);
                        if (e.target.checked) {
                          newSelected.add(submission.id);
                        } else {
                          newSelected.delete(submission.id);
                        }
                        setSelectedSubmissions(newSelected);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-sm">{submission.respondentId}</div>
                      <div className="text-xs text-muted-foreground">{submission.id}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    {submission.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-full text-xs">
                        <Clock className="h-3 w-3" />
                        Partial
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {submission.completedAt ? (
                      <div>
                        <div className="text-sm">
                          {new Date(submission.completedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(submission.completedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {submission.score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{submission.score}</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${submission.score}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {submission.tags.length > 0 ? (
                        submission.tags.map((tag) => (
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
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{submission.answers.q1 || "—"}</span>
                  </td>
                  <td className="p-4">
                    {submission.answers.q2 ? (
                      <span className="text-sm">
                        {Array.isArray(submission.answers.q2)
                          ? submission.answers.q2.join(", ")
                          : submission.answers.q2}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="w-96 border-l bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Response Details</h3>
        </div>
        <div className="p-4">
          {selectedSubmissions.size === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Metadata</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd>Sep 9, 2025 at 10:30 AM</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd>3 min 24 sec</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Device</dt>
                    <dd>Chrome on macOS</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">IP Address</dt>
                    <dd>192.168.1.1</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">All Answers</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Q1: How satisfied are you?</p>
                    <p className="text-sm">Very satisfied</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Q2: What features do you use?
                    </p>
                    <p className="text-sm">Dashboard, Analytics, API</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Q3: Any feedback?</p>
                    <p className="text-sm">The analytics features are incredibly powerful...</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View full response
                </Button>
              </div>
            </div>
          )}
          {selectedSubmissions.size === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-8">
              Select a response to view details
            </p>
          )}
          {selectedSubmissions.size > 1 && (
            <p className="text-sm text-muted-foreground text-center mt-8">
              {selectedSubmissions.size} responses selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
