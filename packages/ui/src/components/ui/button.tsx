import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 text-gray-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700",
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
        default: "h-10 px-4 py-2 text-sm rounded",
        sm: "h-8 px-3 py-1.5 text-xs rounded",
        lg: "h-11 px-6 py-2.5 text-base rounded",
        icon: "h-10 w-10 rounded",
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
