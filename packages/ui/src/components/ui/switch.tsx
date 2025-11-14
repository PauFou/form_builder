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
        "peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // État OFF - gris clair avec bordure visible
        "bg-gray-200 border-gray-300",
        // État ON - couleur primaire vibrante (via data-state)
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        // Hover states
        "hover:bg-gray-300 data-[state=checked]:hover:brightness-110",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-all duration-200",
          // Position - translate conditionnellement
          "translate-x-0.5 data-[state=checked]:translate-x-6",
          // Shadow plus prononcée pour le thumb quand activé
          "data-[state=checked]:shadow-lg"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

// Type export
export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;

export { Switch };
