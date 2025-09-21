"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@skemya/ui";
import { Input } from "@skemya/ui";
import { Label } from "@skemya/ui";
import { Textarea } from "@skemya/ui";
import { Badge } from "@skemya/ui";
import { Slider } from "@skemya/ui";
import { Switch } from "@skemya/ui";
import { Alert, AlertDescription } from "@skemya/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@skemya/ui";
import {
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  GitBranch,
  Zap,
  Shield,
  Globe,
  Eye,
} from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { formsApi } from "../../lib/api/forms";
import type { FormVersion } from "@skemya/contracts";
import { cn } from "../../lib/utils";
import { toast } from "react-hot-toast";
import { ValidationErrorsDialog } from "./validation-errors-dialog";

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
}

interface ValidationIssue {
  type: "error" | "warning" | "info";
  message: string;
  location?: string;
}

export function PublishDialog({ isOpen, onClose, formId }: PublishDialogProps) {
  const { form, validateFormData, validationErrors } = useFormBuilderStore();
  const [isPublishing, setIsPublishing] = useState(false);
  const [canaryPercent, setCanaryPercent] = useState(5);
  const [enableCanary, setEnableCanary] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Form validation function
  const validateForm = useCallback(async () => {
    if (!form) return;

    setIsValidating(true);
    const issues: ValidationIssue[] = [];

    // Use our validation system
    const formErrors = validateFormData();

    // Convert our validation errors to the dialog format
    formErrors.forEach((error) => {
      issues.push({
        type: "error",
        message: error.message,
        location:
          error.type === "duplicate_key"
            ? "Field Keys"
            : error.type === "logic_cycle"
              ? "Logic Rules"
              : "Form Structure",
      });
    });

    // Additional validation logic based on brief requirements
    try {
      // Check for required fields
      if (!form.title?.trim()) {
        issues.push({
          type: "error",
          message: "Form title is required",
          location: "Form settings",
        });
      }

      // Check for at least one page
      if (!form.pages || form.pages.length === 0) {
        issues.push({
          type: "error",
          message: "Form must have at least one page",
          location: "Form structure",
        });
      }

      // Check for at least one block
      const totalBlocks = form.pages?.reduce((acc, page) => acc + page.blocks.length, 0) || 0;
      if (totalBlocks === 0) {
        issues.push({
          type: "error",
          message: "Form must have at least one field",
          location: "Form content",
        });
      }

      // Check for orphaned pages in logic rules
      const logicRules = form.logic?.rules || [];
      const referencedPages = new Set<string>();

      logicRules.forEach((rule) => {
        rule.actions.forEach((action) => {
          if (action.type === "jump" && action.target) {
            referencedPages.add(action.target);
          }
        });
      });

      referencedPages.forEach((pageId) => {
        const pageExists = form.pages?.some((page) => page.id === pageId);
        if (!pageExists) {
          issues.push({
            type: "error",
            message: `Logic rule references non-existent page: ${pageId}`,
            location: "Logic rules",
          });
        }
      });

      // Check for logic cycles (simplified)
      if (logicRules.length > 0) {
        const hasComplexLogic = logicRules.some((rule) =>
          rule.actions.some((action) => action.type === "jump")
        );

        if (hasComplexLogic) {
          issues.push({
            type: "warning",
            message: "Complex logic detected - verify no infinite loops exist",
            location: "Logic validation",
          });
        }
      }

      // Performance warnings
      if (totalBlocks > 50) {
        issues.push({
          type: "warning",
          message: `Large form detected (${totalBlocks} fields) - consider splitting into multiple pages`,
          location: "Performance",
        });
      }

      // Check for missing required settings
      form.pages?.forEach((page, pageIndex) => {
        page.blocks.forEach((block, blockIndex) => {
          if (block.required && !block.question?.trim()) {
            issues.push({
              type: "warning",
              message: `Required field missing question text`,
              location: `Page ${pageIndex + 1}, Field ${blockIndex + 1}`,
            });
          }
        });
      });

      setValidationIssues(issues);
    } catch (error) {
      console.error("Validation error:", error);
      issues.push({
        type: "error",
        message: "Validation failed - please check form structure",
        location: "System",
      });
      setValidationIssues(issues);
    } finally {
      setIsValidating(false);
    }
  }, [form, validateFormData]);

  // Load form versions on open
  useEffect(() => {
    if (!isOpen || !formId) return;

    const loadVersions = async () => {
      try {
        const formVersions = await formsApi.versions(formId);
        setVersions(formVersions);
      } catch (error) {
        console.error("Failed to load versions:", error);
      }
    };

    loadVersions();
    validateForm();
  }, [isOpen, formId, validateForm]);

  const handlePublish = async () => {
    if (!form) return;

    // Run validation again to ensure we have latest errors
    const formErrors = validateFormData();
    const errors = validationIssues.filter((issue) => issue.type === "error");

    if (formErrors.length > 0 || errors.length > 0) {
      setShowValidationErrors(true);
      return;
    }

    setIsPublishing(true);

    try {
      const publishData = {
        canary_percent: enableCanary ? canaryPercent : 100,
        release_notes: releaseNotes.trim() || undefined,
      };

      const newVersion = await formsApi.publish(formId, publishData);

      toast.success(
        enableCanary
          ? `Form published with ${canaryPercent}% canary deployment`
          : "Form published successfully"
      );

      onClose();
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish form");
    } finally {
      setIsPublishing(false);
    }
  };

  const getIssueIcon = (type: ValidationIssue["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getIssueColor = (type: ValidationIssue["type"]) => {
    switch (type) {
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-amber-200 bg-amber-50";
      case "info":
        return "border-blue-200 bg-blue-50";
    }
  };

  const errorCount = validationIssues.filter((i) => i.type === "error").length;
  const warningCount = validationIssues.filter((i) => i.type === "warning").length;
  const canPublish = errorCount === 0 && !isValidating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Publish Form
          </DialogTitle>
          <DialogDescription>
            Create a new published version of your form. Published forms are frozen and versioned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Validation</h3>
              {isValidating && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  Validating...
                </Badge>
              )}
            </div>

            {!isValidating && (
              <div className="flex gap-2">
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    {errorCount} error{errorCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {warningCount} warning{warningCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {errorCount === 0 && warningCount === 0 && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready to publish
                  </Badge>
                )}
              </div>
            )}

            {validationIssues.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {validationIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={cn("border rounded-lg p-3", getIssueColor(issue.type))}
                  >
                    <div className="flex items-start gap-2">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.message}</p>
                        {issue.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Location: {issue.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version History */}
          {versions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Previous Versions</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {versions.slice(0, 3).map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span className="text-sm">
                        {version.publishedAt
                          ? new Date(version.publishedAt).toLocaleDateString()
                          : "Draft"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {version.publishedAt ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canary Deployment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Deployment Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how this version will be rolled out
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={enableCanary} onCheckedChange={setEnableCanary} />
                <Label>Canary Deployment</Label>
              </div>
            </div>

            {enableCanary && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Canary Deployment</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Percentage of users to receive new version: {canaryPercent}%
                  </Label>
                  <Slider
                    value={[canaryPercent]}
                    onValueChange={(value) => setCanaryPercent(value[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Canary deployment allows you to test the new version with a small percentage of
                    users before full rollout.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Release Notes */}
          <div className="space-y-3">
            <Label htmlFor="release-notes">Release Notes (Optional)</Label>
            <Textarea
              id="release-notes"
              placeholder="Describe what's new in this version..."
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Publish Info */}
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Once published, this version becomes immutable. The form
              schema is frozen and versioned. You can create new versions but cannot modify
              published ones.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={!canPublish || isPublishing} className="gap-2">
            {isPublishing ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Publish Form
                {enableCanary && ` (${canaryPercent}%)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ValidationErrorsDialog
        open={showValidationErrors}
        onOpenChange={setShowValidationErrors}
        errors={validationErrors}
        onFix={() => {
          setShowValidationErrors(false);
          onClose();
        }}
      />
    </Dialog>
  );
}

PublishDialog.displayName = "PublishDialog";
