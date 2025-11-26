"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "../../lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, ...props }, ref) => {
  const isChecked = checked || props.defaultChecked;

  return (
    <SwitchPrimitives.Root
      checked={checked}
      className={cn(
        // Base styles
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // État OFF
        "bg-gray-200 border-gray-300",
        // État ON
        "data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600",
        // Hover states
        "hover:bg-gray-300 data-[state=checked]:hover:bg-indigo-700",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-out",
          // Position - slide animation from left to right
          "translate-x-0.5 data-[state=checked]:translate-x-5"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

// Type export
export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;

export { Switch };
