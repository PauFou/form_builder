import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-border bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/50 active:bg-primary/10",
        secondary:
          "bg-muted text-foreground hover:bg-primary/5 hover:text-primary active:bg-primary/10",
        ghost: "hover:bg-primary/5 hover:text-primary active:bg-primary/10",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        // YouForm specific variants
        "youform-primary":
          "bg-[#475569] text-white hover:bg-[#334155] rounded-md shadow-sm transition-colors",
        "youform-pro":
          "bg-[#FF6B35] text-white hover:bg-[#E55A2B] rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-semibold",
        "youform-secondary":
          "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 rounded-md transition-colors",
        "youform-ghost":
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors",
        "youform-destructive":
          "text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-md transition-colors",
      },
      size: {
        default: "h-11 px-6 text-sm rounded-2xl",
        sm: "h-9 px-4 text-xs rounded-xl",
        lg: "h-12 px-8 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        // YouForm specific sizes
        "youform-sm": "h-8 px-3 py-1.5 text-xs",
        "youform-default": "h-10 px-4 py-2 text-sm",
        "youform-lg": "h-11 px-6 py-2.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
