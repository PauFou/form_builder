"use client";

import React from "react";
import { Plus, Palette, GitBranch, Play, Globe, Settings } from "lucide-react";
import { Button } from "@skemya/ui";
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
    <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
      {/* Left - Canvas Tools */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onAddBlock}
          variant="youform-secondary"
          size="youform-default"
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </Button>

        <Button
          onClick={onOpenDesign}
          variant="youform-secondary"
          size="youform-default"
          className="gap-1.5"
        >
          <Palette className="w-4 h-4" />
          Design
        </Button>

        <Button
          onClick={handleLogic}
          variant="youform-secondary"
          size="youform-default"
          className="gap-1.5"
        >
          <GitBranch className="w-4 h-4" />
          Logic
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={onOpenPreview}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          title="Preview"
        >
          <Play className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Language">
          <Globe className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={handleSettings}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Right - Buy PRO */}
      <Button variant="youform-pro" size="youform-default" className="relative">
        Buy PRO
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
      </Button>
    </div>
  );
}
