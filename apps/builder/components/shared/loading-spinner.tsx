"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  fullHeight?: boolean;
}

export function LoadingSpinner({
  size = "md",
  text = "Loading...",
  className,
  fullHeight = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn("flex items-center justify-center gap-3", fullHeight && "h-full", className)}
    >
      <div
        role="status"
        aria-label="Loading"
        className={cn(
          "animate-spin rounded-full border-2 border-primary border-t-transparent",
          sizeClasses[size]
        )}
      />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );
}
