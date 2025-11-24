"use client";

import React from "react";
import { Plus, Palette, GitBranch, Play, Globe, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface CanvasToolbarProps {
  formId: string;
  onAddBlock?: () => void;
  onOpenDesign?: () => void;
  onOpenPreview?: () => void;
}

export function CanvasToolbar({
  formId,
  onAddBlock,
  onOpenDesign,
  onOpenPreview,
}: CanvasToolbarProps) {
  const router = useRouter();

  const handleLogic = () => {
    router.push(`/forms/${formId}/logic`);
  };

  const handleSettings = () => {
    router.push(`/forms/${formId}/settings`);
  };

  return (
    <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 border-b border-gray-200 bg-white">
      {/* Left - Primary Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={onAddBlock}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Block</span>
          <span className="sm:hidden">Add</span>
        </button>

        <button
          onClick={onOpenDesign}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Design</span>
        </button>

        <button
          onClick={handleLogic}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logic</span>
        </button>
      </div>

      {/* Right - Secondary Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          onClick={onOpenPreview}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Preview"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Language"
        >
          <Globe className="w-4 h-4" />
        </button>
        <button
          onClick={handleSettings}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
