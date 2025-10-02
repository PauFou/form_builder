import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-muted/50 backdrop-blur-sm border border-border/50 text-muted-foreground",
        secondary: "bg-secondary/50 border border-border/50 text-secondary-foreground",
        destructive: "bg-destructive/10 border border-destructive/20 text-destructive",
        outline: "border border-border/50 text-muted-foreground bg-transparent",
        success: "bg-green-50/50 border border-green-200/50 text-green-700",
        warning: "bg-yellow-50/50 border border-yellow-200/50 text-yellow-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether this badge represents a status that changes dynamically
   * When true, adds role="status" and aria-live="polite"
   */
  isStatus?: boolean;
  /**
   * Accessible label for screen readers when the badge content is not descriptive enough
   */
  ariaLabel?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, isStatus = false, ariaLabel, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        role={isStatus ? "status" : undefined}
        aria-live={isStatus ? "polite" : undefined}
        aria-label={ariaLabel}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
