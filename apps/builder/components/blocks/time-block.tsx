"use client";

import { useState, useEffect } from "react";
import { Input, Label } from "@skemya/ui";
import { Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface TimeBlockProps {
  id: string;
  question: string;
  description?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minTime?: string;
  maxTime?: string;
  step?: number; // in minutes
  isPreview?: boolean;
  className?: string;
}

export function TimeBlock({
  id,
  question,
  description,
  required = false,
  value = "",
  onChange,
  onBlur,
  placeholder = "Select time",
  minTime,
  maxTime,
  step = 15,
  isPreview = false,
  className,
}: TimeBlockProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Format time value for display
  const formatTimeValue = (timeValue: string) => {
    if (!timeValue) return "";

    // Parse HH:MM format
    const [hours, minutes] = timeValue.split(":").map((num) => parseInt(num, 10));
    if (isNaN(hours) || isNaN(minutes)) return timeValue;

    // Convert to 12-hour format for display
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, "0");

    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const containerClasses = cn(
    "space-y-3 p-4 rounded-lg border-2 border-transparent transition-all duration-200",
    isFocused && "border-primary ring-2 ring-primary/20",
    isPreview && "border-border bg-muted/30",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="space-y-2">
        <Label htmlFor={id} className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {question}
          {required && <span className="text-destructive">*</span>}
        </Label>

        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="space-y-2">
        <Input
          id={id}
          name={id}
          type="time"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={minTime}
          max={maxTime}
          step={step * 60} // Convert minutes to seconds for HTML step attribute
          required={required}
          className="text-base"
          aria-describedby={description ? `${id}-description` : undefined}
        />

        {localValue && (
          <p className="text-xs text-muted-foreground">Selected: {formatTimeValue(localValue)}</p>
        )}
      </div>
    </div>
  );
}

TimeBlock.displayName = "TimeBlock";
