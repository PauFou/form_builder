"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  FileJson,
  Download,
  Calendar,
  Filter,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Progress,
  Checkbox,
} from "@skemya/ui";
import { toast } from "react-hot-toast";
import { formsApi } from "../../lib/api/forms";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  selectedSubmissionIds?: string[];
  totalSubmissions: number;
}

interface ExportOptions {
  format: "csv" | "json" | "xlsx" | "parquet";
  dateRange: "all" | "today" | "week" | "month" | "custom";
  customDateRange?: { start?: string; end?: string };
  status: "all" | "completed" | "partial";
  includeMetadata: boolean;
  includePartials: boolean;
  anonymize: boolean;
  fields: string[];
}

export function ExportDialog({
  open,
  onOpenChange,
  formId,
  selectedSubmissionIds = [],
  totalSubmissions,
}: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    dateRange: "all",
    status: "all",
    includeMetadata: true,
    includePartials: false,
    anonymize: false,
    fields: [],
  });

  const [availableFields, setAvailableFields] = useState<
    Array<{
      id: string;
      label: string;
      selected: boolean;
    }>
  >([]);

  const formatOptions = [
    {
      value: "csv",
      label: "CSV",
      description: "Comma-separated values, compatible with Excel",
      icon: FileText,
    },
    {
      value: "json",
      label: "JSON",
      description: "JavaScript Object Notation, for developers",
      icon: FileJson,
    },
    {
      value: "xlsx",
      label: "Excel",
      description: "Microsoft Excel workbook",
      icon: FileSpreadsheet,
    },
    {
      value: "parquet",
      label: "Parquet",
      description: "Columnar storage format for analytics",
      icon: FileText,
    },
  ];

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await formsApi.exportSubmissions(formId, {
        ids: selectedSubmissionIds.length > 0 ? selectedSubmissionIds : undefined,
        format: exportOptions.format,
        options: {
          dateRange:
            exportOptions.dateRange === "custom" ? exportOptions.customDateRange : undefined,
          status: exportOptions.status,
          includeMetadata: exportOptions.includeMetadata,
          includePartials: exportOptions.includePartials,
          anonymize: exportOptions.anonymize,
          fields: exportOptions.fields.length > 0 ? exportOptions.fields : undefined,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Handle file download
      const contentType = {
        csv: "text/csv",
        json: "application/json",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        parquet: "application/octet-stream",
      }[exportOptions.format];

      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `form-${formId}-export-${new Date().toISOString().split("T")[0]}.${exportOptions.format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Export completed successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  const estimatedSize = () => {
    const submissionCount = selectedSubmissionIds.length || totalSubmissions;
    const baseSize =
      {
        csv: 0.5, // KB per submission
        json: 1.2,
        xlsx: 0.8,
        parquet: 0.3,
      }[exportOptions.format] || 1;

    const multiplier = exportOptions.includeMetadata ? 1.5 : 1;
    const size = submissionCount * baseSize * multiplier;

    if (size < 1024) {
      return `${size.toFixed(1)} KB`;
    } else {
      return `${(size / 1024).toFixed(1)} MB`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Submissions</DialogTitle>
          <DialogDescription>
            Configure your export settings. You're exporting{" "}
            <strong>
              {selectedSubmissionIds.length > 0
                ? `${selectedSubmissionIds.length} selected`
                : `all ${totalSubmissions}`}
            </strong>{" "}
            submissions.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4 mt-4">
            <RadioGroup
              value={exportOptions.format}
              onValueChange={(value) =>
                setExportOptions({ ...exportOptions, format: value as any })
              }
            >
              {formatOptions.map((option) => (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Label
                    htmlFor={option.value}
                    className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <option.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Include field headers</p>
                <p className="text-sm text-muted-foreground">First row contains field names</p>
              </div>
              <Switch defaultChecked />
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select
                value={exportOptions.dateRange}
                onValueChange={(value) =>
                  setExportOptions({ ...exportOptions, dateRange: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Submission Status</Label>
              <Select
                value={exportOptions.status}
                onValueChange={(value) =>
                  setExportOptions({ ...exportOptions, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submissions</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                  <SelectItem value="partial">Partial Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Include partial submissions</p>
                <p className="text-sm text-muted-foreground">Export incomplete responses</p>
              </div>
              <Switch
                checked={exportOptions.includePartials}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includePartials: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Include metadata</p>
                <p className="text-sm text-muted-foreground">
                  IP, location, device info, timestamps
                </p>
              </div>
              <Switch
                checked={exportOptions.includeMetadata}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includeMetadata: checked })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">Privacy Notice</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Exported data may contain personal information. Ensure you comply with GDPR and
                    other privacy regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Anonymize data</p>
                <p className="text-sm text-muted-foreground">Remove or hash personal identifiers</p>
              </div>
              <Switch
                checked={exportOptions.anonymize}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, anonymize: checked })
                }
              />
            </div>

            {exportOptions.anonymize && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Anonymization will:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    Replace respondent IDs with hashes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    Remove IP addresses
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    Remove location data
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    Generalize timestamps to date only
                  </li>
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between mt-6 p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Estimated file size</p>
            <p className="font-medium">{estimatedSize()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Export format</p>
            <p className="font-medium uppercase">{exportOptions.format}</p>
          </div>
        </div>

        {exporting && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center mt-2">
              Preparing your export... {progress}%
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
