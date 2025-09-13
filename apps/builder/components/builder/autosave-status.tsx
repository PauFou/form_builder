"use client";

import { useState, useEffect } from "react";
import { Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface AutosaveStatusProps {
  isDirty: boolean;
  lastSaved?: Date;
  isSaving?: boolean;
  className?: string;
}

export function AutosaveStatus({
  isDirty,
  lastSaved,
  isSaving = false,
  className,
}: AutosaveStatusProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

      if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    // Update immediately
    updateTimeAgo();

    // Update every second for the first minute, then every minute
    const interval = setInterval(() => {
      updateTimeAgo();
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  const getStatusText = () => {
    if (isSaving) return "Saving...";
    if (isDirty) return "Unsaved changes";
    if (lastSaved && timeAgo) return `Saved · ${timeAgo}`;
    return "Not saved";
  };

  const getStatusIcon = () => {
    if (isSaving) return <Clock className="h-3 w-3 animate-spin" />;
    if (isDirty) return <AlertCircle className="h-3 w-3 text-amber-500" />;
    if (lastSaved) return <Check className="h-3 w-3 text-green-500" />;
    return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
  };

  const getStatusColor = () => {
    if (isSaving) return "text-blue-600";
    if (isDirty) return "text-amber-600";
    if (lastSaved) return "text-green-600";
    return "text-muted-foreground";
  };

  return (
    <div
      className={cn("flex items-center gap-1.5 text-xs font-medium", getStatusColor(), className)}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}
