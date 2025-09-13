"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@forms/ui";
import { Button } from "@forms/ui";
import { AlertTriangle, AlertCircle, Key, RefreshCw } from "lucide-react";
import type { ValidationError } from "../../lib/validators/form-validators";

interface ValidationErrorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ValidationError[];
  onFix?: () => void;
}

export function ValidationErrorsDialog({
  open,
  onOpenChange,
  errors,
  onFix,
}: ValidationErrorsDialogProps) {
  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Form Validation Errors
          </DialogTitle>
          <DialogDescription>
            Please fix the following errors before publishing your form:
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {groupedErrors.duplicate_key && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium">
                <Key className="h-4 w-4" />
                Duplicate Field Keys
              </h3>
              {groupedErrors.duplicate_key.map((error, index) => (
                <div key={index} className="rounded-md bg-red-50 p-3 text-sm">
                  <p className="font-medium text-red-800">{error.message}</p>
                  {error.details && (
                    <ul className="mt-2 space-y-1 text-red-700">
                      {error.details.questions?.map((question: string, i: number) => (
                        <li key={i}>• {question}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-red-600">
                    Each field must have a unique key for data collection and integrations.
                  </p>
                </div>
              ))}
            </div>
          )}

          {groupedErrors.logic_cycle && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium">
                <RefreshCw className="h-4 w-4" />
                Logic Cycles Detected
              </h3>
              {groupedErrors.logic_cycle.map((error, index) => (
                <div key={index} className="rounded-md bg-red-50 p-3 text-sm">
                  <p className="font-medium text-red-800">{error.message}</p>
                  <p className="mt-2 text-xs text-red-600">
                    Logic cycles create infinite loops. Please review your logic rules.
                  </p>
                </div>
              ))}
            </div>
          )}

          {groupedErrors.referenced_field && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                Missing Field References
              </h3>
              {groupedErrors.referenced_field.map((error, index) => (
                <div key={index} className="rounded-md bg-red-50 p-3 text-sm">
                  <p className="font-medium text-red-800">{error.message}</p>
                  <p className="mt-2 text-xs text-red-600">
                    Logic rules reference fields that no longer exist.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onFix && (
            <Button onClick={onFix}>
              Go to Form Builder
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}