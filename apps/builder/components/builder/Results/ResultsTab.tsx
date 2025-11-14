"use client";

import React, { useState } from "react";
import { Eye, MousePointerClick, CheckCircle, BarChart3, Clock } from "lucide-react";
import { cn } from "../../../lib/utils";
import { SubmissionsTable } from "./SubmissionsTable";
import { SubmissionsFilters } from "./SubmissionsFilters";
import { AnalyticsCharts } from "./AnalyticsCharts";

interface ResultsTabProps {
  formId: string;
}

type SubTab = "submissions" | "summary" | "analytics";

export function ResultsTab({ formId }: ResultsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("submissions");
  const [submissionFilter, setSubmissionFilter] = useState<"completed" | "partial">("completed");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // Mock data - in production this would come from API
  const mockSubmissions: any[] = [];
  const mockBlocks: any[] = [];

  const subTabs = [
    { id: "submissions" as SubTab, label: "Submissions" },
    { id: "summary" as SubTab, label: "Summary" },
    { id: "analytics" as SubTab, label: "Analytics" },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          {/* Sub Tabs */}
          <div className="flex items-center gap-8 border-b">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "px-4 py-4 text-sm font-medium border-b-2 transition-colors relative",
                  activeSubTab === tab.id
                    ? "text-gray-900 border-gray-900"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Submission Filters */}
          {activeSubTab === "submissions" && (
            <div className="flex items-center gap-6 py-4">
              <button
                onClick={() => setSubmissionFilter("completed")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  submissionFilter === "completed"
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Completed
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    submissionFilter === "completed"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  )}
                >
                  0
                </span>
              </button>

              <button
                onClick={() => setSubmissionFilter("partial")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  submissionFilter === "partial"
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Partial
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    submissionFilter === "partial"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  )}
                >
                  0
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Views */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-700">Views</span>
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-semibold text-blue-900">0</div>
            <p className="text-xs text-blue-600 mt-1">Total page views</p>
          </div>

          {/* Starts */}
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-700">Starts</span>
              <MousePointerClick className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-semibold text-purple-900">0</div>
            <p className="text-xs text-purple-600 mt-1">Form interactions</p>
          </div>

          {/* Submissions */}
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700">Submissions</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-semibold text-green-900">0</div>
            <p className="text-xs text-green-600 mt-1">Completed forms</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-orange-700">Rate</span>
              <BarChart3 className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-semibold text-orange-900">0%</div>
            <p className="text-xs text-orange-600 mt-1">Completion rate</p>
          </div>

          {/* Avg Time */}
          <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-pink-700">Time</span>
              <Clock className="w-4 h-4 text-pink-600" />
            </div>
            <div className="text-2xl font-semibold text-pink-900">0s</div>
            <p className="text-xs text-pink-600 mt-1">Avg completion</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeSubTab === "submissions" && (
          <>
            {/* Filters */}
            <SubmissionsFilters
              onSearchChange={setSearchQuery}
              onDateRangeChange={(start, end) => setDateRange({ start, end })}
              onTagsChange={setFilterTags}
              onExportAll={() => console.log("Export all submissions")}
              totalCount={mockSubmissions.length}
            />

            {/* Table or Empty State */}
            {mockSubmissions.length > 0 ? (
              <SubmissionsTable
                submissions={mockSubmissions}
                blocks={mockBlocks}
                onView={(id) => console.log("View submission:", id)}
                onDelete={(ids) => console.log("Delete submissions:", ids)}
                onAddTags={(ids, tags) => console.log("Add tags:", ids, tags)}
                onExport={(ids) => console.log("Export submissions:", ids)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-20">
                  <p className="text-base text-gray-600">
                    No complete submissions yet. Please{" "}
                    <button className="text-blue-600 hover:text-blue-700 underline">
                      share
                    </button>{" "}
                    your form to the world to start collecting submissions.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {activeSubTab === "summary" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-20">
              <p className="text-base text-gray-600">
                No data available. Start collecting submissions to see summary statistics.
              </p>
            </div>
          </div>
        )}

        {activeSubTab === "analytics" && (
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-8 py-6">
              <AnalyticsCharts formId={formId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
