"use client";

import { useState, useEffect, useCallback } from "react";
import { Input, Label } from "@skemya/ui";
import { Link, ExternalLink, AlertCircle, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface URLBlockProps {
  id: string;
  question: string;
  description?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  allowedDomains?: string[]; // Optional domain restrictions
  requireHttps?: boolean;
  isPreview?: boolean;
  className?: string;
}

export function URLBlock({
  id,
  question,
  description,
  required = false,
  value = "",
  onChange,
  onBlur,
  placeholder = "https://example.com",
  allowedDomains,
  requireHttps = false,
  isPreview = false,
  className,
}: URLBlockProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateURL = useCallback(
    (url: string) => {
      if (!url.trim()) {
        setValidationError("");
        setIsValid(null);
        return;
      }

      try {
        const urlObj = new URL(url);

        // Check protocol
        if (requireHttps && urlObj.protocol !== "https:") {
          setValidationError("HTTPS is required");
          setIsValid(false);
          return;
        }

        if (!["http:", "https:"].includes(urlObj.protocol)) {
          setValidationError("URL must start with http:// or https://");
          setIsValid(false);
          return;
        }

        // Check allowed domains
        if (allowedDomains && allowedDomains.length > 0) {
          const isAllowedDomain = allowedDomains.some(
            (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
          );

          if (!isAllowedDomain) {
            setValidationError(`URL must be from: ${allowedDomains.join(", ")}`);
            setIsValid(false);
            return;
          }
        }

        setValidationError("");
        setIsValid(true);
      } catch {
        setValidationError("Please enter a valid URL");
        setIsValid(false);
      }
    },
    [allowedDomains, requireHttps]
  );

  useEffect(() => {
    setLocalValue(value);
    validateURL(value);
  }, [value, validateURL]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange?.(newValue);

    // Add protocol if missing
    if (newValue && !newValue.match(/^https?:\/\//i)) {
      const protocolValue = `https://${newValue}`;
      setLocalValue(protocolValue);
      onChange?.(protocolValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    validateURL(localValue);
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const openURL = () => {
    if (isValid && localValue) {
      window.open(localValue, "_blank", "noopener,noreferrer");
    }
  };

  const containerClasses = cn(
    "space-y-3 p-4 rounded-lg border-2 border-transparent transition-all duration-200",
    isFocused && "border-primary ring-2 ring-primary/20",
    isPreview && "border-border bg-muted/30",
    validationError && "border-destructive/50",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="space-y-2">
        <Label htmlFor={id} className="text-base font-medium flex items-center gap-2">
          <Link className="h-4 w-4" />
          {question}
          {required && <span className="text-destructive">*</span>}
        </Label>

        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Input
            id={id}
            name={id}
            type="url"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            className={cn(
              "text-base pr-20",
              validationError && "border-destructive focus:border-destructive",
              isValid && "border-green-500 focus:border-green-500"
            )}
            aria-describedby={description ? `${id}-description` : undefined}
            aria-invalid={!!validationError}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isValid === true && <Check className="h-4 w-4 text-green-500" />}
            {isValid === false && <AlertCircle className="h-4 w-4 text-destructive" />}
            {isValid && localValue && (
              <button
                type="button"
                onClick={openURL}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Open URL in new tab"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {validationError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validationError}
          </p>
        )}

        {isValid && localValue && (
          <p className="text-xs text-muted-foreground">Valid URL • Click the arrow to open</p>
        )}
      </div>
    </div>
  );
}

URLBlock.displayName = "URLBlock";
