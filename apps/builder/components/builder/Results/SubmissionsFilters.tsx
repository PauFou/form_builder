"use client";

import React, { useState } from "react";
import { Search, Filter, Calendar, Tag, Download, X } from "lucide-react";
import { Button, Input } from "@skemya/ui";
import { cn } from "../../../lib/utils";

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface SubmissionsFiltersProps {
  onSearchChange: (query: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
  onTagsChange: (tags: string[]) => void;
  onExportAll: () => void;
  totalCount: number;
}

export function SubmissionsFilters({
  onSearchChange,
  onDateRangeChange,
  onTagsChange,
  onExportAll,
  totalCount,
}: SubmissionsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags] = useState<string[]>(["Important", "Follow-up", "Spam", "VIP"]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleDateStartChange = (value: string) => {
    setDateStart(value);
    onDateRangeChange(value, dateEnd);
  };

  const handleDateEndChange = (value: string) => {
    setDateEnd(value);
    onDateRangeChange(dateStart, value);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onTagsChange(newTags);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDateStart("");
    setDateEnd("");
    setSelectedTags([]);
    onSearchChange("");
    onDateRangeChange("", "");
    onTagsChange([]);
  };

  const hasActiveFilters = searchQuery || dateStart || dateEnd || selectedTags.length > 0;

  return (
    <div className="bg-white border-b">
      <div className="px-6 py-4">
        {/* Search and Actions Row */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="youform-secondary"
            size="youform-sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "gap-2",
              showAdvancedFilters && "bg-gray-100"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </Button>

          {/* Export All */}
          <Button
            variant="youform-secondary"
            size="youform-sm"
            onClick={onExportAll}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export All
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateStart}
                    onChange={(e) => handleDateStartChange(e.target.value)}
                    className="text-sm"
                    placeholder="Start date"
                  />
                  <span className="text-gray-400">to</span>
                  <Input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => handleDateEndChange(e.target.value)}
                    className="text-sm"
                    placeholder="End date"
                  />
                </div>
              </div>

              {/* Tags Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Filter by Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        selectedTags.includes(tag)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-gray-600">
                  {totalCount} result{totalCount !== 1 ? "s" : ""} found
                </span>
                <Button
                  variant="youform-ghost"
                  size="youform-sm"
                  onClick={handleClearFilters}
                  className="gap-2 text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
