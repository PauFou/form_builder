"use client";

import { Button } from "@forms/ui";
import { Undo, Redo, Save, Eye, Rocket } from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { cn } from "@forms/ui";

interface ToolbarProps {
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  className?: string;
}

export function Toolbar({ onSave, onPreview, onPublish, className }: ToolbarProps) {
  const { canUndo, canRedo, undo, redo, getHistoryStatus, isDirty } = useFormBuilderStore();

  const historyStatus = getHistoryStatus();
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modifierKey = isMac ? "⌘" : "Ctrl";

  return (
    <div className={cn("flex items-center gap-2 p-4 border-b bg-background", className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          title={`Undo (${modifierKey}+Z)`}
          className="gap-1"
        >
          <Undo className="h-4 w-4" />
          <span className="hidden sm:inline">Undo</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          title={`Redo (${modifierKey}+Shift+Z)`}
          className="gap-1"
        >
          <Redo className="h-4 w-4" />
          <span className="hidden sm:inline">Redo</span>
        </Button>

        {/* History indicator */}
        <div className="px-2 text-xs text-muted-foreground">
          {historyStatus.current}/{historyStatus.total}
        </div>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          title={`Save (${modifierKey}+S)`}
          className="gap-1"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          title={`Preview (${modifierKey}+P)`}
          className="gap-1"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button variant="default" size="sm" onClick={onPublish} className="gap-1">
          <Rocket className="h-4 w-4" />
          <span className="hidden sm:inline">Publish</span>
        </Button>
      </div>
    </div>
  );
}
