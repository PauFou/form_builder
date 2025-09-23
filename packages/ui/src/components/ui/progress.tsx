import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../../lib/utils";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /**
   * Accessible label for the progress bar
   */
  ariaLabel?: string;
  /**
   * Descriptive text for the progress (e.g., "Uploading file...")
   */
  ariaDescription?: string;
  /**
   * Show percentage text alongside the progress bar
   */
  showPercentage?: boolean;
  /**
   * Minimum value (default: 0)
   */
  min?: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    {
      className,
      value,
      ariaLabel,
      ariaDescription,
      showPercentage = false,
      min = 0,
      max = 100,
      ...props
    },
    ref
  ) => {
    const percentage = React.useMemo(() => {
      if (value === undefined || value === null) return 0;
      return Math.round(((value - min) / (max - min)) * 100);
    }, [value, min, max]);

    const descriptionId = ariaDescription ? React.useId() : undefined;

    return (
      <div className="w-full">
        {ariaDescription && (
          <div id={descriptionId} className="text-sm text-muted-foreground mb-2">
            {ariaDescription}
          </div>
        )}

        <div className="flex items-center gap-3">
          <ProgressPrimitive.Root
            ref={ref}
            className={cn(
              "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
              className
            )}
            value={value}
            max={max}
            aria-label={ariaLabel}
            aria-describedby={descriptionId}
            aria-valuenow={value ?? undefined}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={`${percentage}%`}
            {...props}
          >
            <ProgressPrimitive.Indicator
              className="h-full w-full flex-1 bg-primary transition-all"
              style={{ transform: `translateX(-${100 - percentage}%)` }}
            />
          </ProgressPrimitive.Root>

          {showPercentage && (
            <span
              className="text-xs font-medium text-muted-foreground min-w-[3ch]"
              aria-hidden="true"
            >
              {percentage}%
            </span>
          )}
        </div>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
