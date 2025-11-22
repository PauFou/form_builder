import * as React from "react";

import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  label?: string;
  srOnly?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error = false,
      errorMessage,
      helperText,
      label,
      srOnly = false,
      id,
      required,
      disabled,
      maxLength,
      showCharCount = false,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const errorId = errorMessage ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const charCountId = showCharCount ? `${textareaId}-char-count` : undefined;

    // Build aria-describedby from available descriptions
    const describedBy = [helperId, charCountId, errorId].filter(Boolean).join(" ") || undefined;

    // Character count calculation
    const currentValue = value || defaultValue || "";
    const currentLength = typeof currentValue === "string" ? currentValue.length : 0;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
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

        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[70px] w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-colors",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          aria-invalid={error}
          aria-describedby={describedBy}
          aria-required={required}
          maxLength={maxLength}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          ref={ref}
          {...props}
        />

        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
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

          {showCharCount && maxLength && (
            <p
              id={charCountId}
              className={cn(
                "text-xs shrink-0",
                currentLength > maxLength * 0.9 ? "text-warning" : "text-muted-foreground",
                currentLength >= maxLength && "text-destructive"
              )}
              aria-live="polite"
            >
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
