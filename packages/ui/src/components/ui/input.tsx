import * as React from "react";

import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  label?: string;
  srOnly?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error = false,
      errorMessage,
      helperText,
      label,
      srOnly = false,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    // Build aria-describedby from available descriptions
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              srOnly && "sr-only"
            )}
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-9 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium transition-colors",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          aria-invalid={error}
          aria-describedby={describedBy}
          aria-required={required}
          disabled={disabled}
          ref={ref}
          {...props}
        />

        {helperText && (
          <p id={helperId} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}

        {errorMessage && (
          <p id={errorId} className="text-xs text-destructive" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
