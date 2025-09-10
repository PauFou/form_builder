import React, { memo } from "react";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = memo(function ProgressBar({
  progress,
  className = "",
}: ProgressBarProps) {
  return (
    <div
      className={`fr-progress ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Form progress"
    >
      <div className="fr-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
});
