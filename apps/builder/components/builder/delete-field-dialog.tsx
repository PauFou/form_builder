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
import { AlertTriangle } from "lucide-react";
import type { LogicRule } from "@forms/contracts";

interface DeleteFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  references: {
    isReferenced: boolean;
    rules: LogicRule[];
    referenceTypes: ("condition" | "action")[];
  };
  onConfirm: (removeReferences: boolean) => void;
}

export function DeleteFieldDialog({
  open,
  onOpenChange,
  fieldName,
  references,
  onConfirm,
}: DeleteFieldDialogProps) {
  if (!references.isReferenced) {
    // Simple delete confirmation
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{fieldName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm(false);
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Field has references
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Field is Referenced in Logic
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              The field "{fieldName}" is referenced in {references.rules.length} logic{" "}
              {references.rules.length === 1 ? "rule" : "rules"}.
            </p>

            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-sm font-medium">Referenced in:</p>
              <ul className="text-sm space-y-1">
                {references.rules.slice(0, 3).map((rule, index) => (
                  <li key={rule.id} className="text-muted-foreground">
                    • Rule {index + 1}: {describeRule(rule)}
                  </li>
                ))}
                {references.rules.length > 3 && (
                  <li className="text-muted-foreground">
                    • And {references.rules.length - 3} more...
                  </li>
                )}
              </ul>
            </div>

            <p className="font-medium">How would you like to proceed?</p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(true);
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            Delete field and remove from logic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function describeRule(rule: LogicRule): string {
  const conditions = rule.conditions
    .map((c) => `${c.field} ${c.operator.replace("_", " ")} ${c.value}`)
    .join(" AND ");

  const actions = rule.actions
    .map((a) => {
      switch (a.type) {
        case "show":
          return `Show ${a.target}`;
        case "hide":
          return `Hide ${a.target}`;
        case "jump":
          return `Jump to ${a.target}`;
        case "skip":
          return `Skip to ${a.target}`;
        case "set_value":
          return `Set ${a.target} to ${a.value}`;
        default:
          return `${a.type} ${a.target}`;
      }
    })
    .join(", ");

  return `If ${conditions} then ${actions}`;
}
