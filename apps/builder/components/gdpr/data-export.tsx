"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
} from "@skemya/ui";
import { Download, AlertCircle, CheckCircle } from "lucide-react";
import { useGDPRStore } from "../../lib/stores/gdpr-store";

interface DataExportProps {
  userId: string;
}

export function DataExport({ userId }: DataExportProps) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const { exportData, exportStatus, exportProgress, exportError } = useGDPRStore();

  const handleExport = async () => {
    try {
      const result = await exportData(userId, format);

      // Create and download file
      const blob = new Blob(
        [format === "json" ? JSON.stringify(result.data, null, 2) : result.data],
        { type: format === "json" ? "application/json" : "text/csv" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal-data.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Personal Data</CardTitle>
        <CardDescription>Export all your personal data in your preferred format</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Format</label>
          <Select value={format} onValueChange={(v) => setFormat(v as "json" | "csv")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {exportStatus === "loading" && (
          <div className="space-y-2">
            <Progress value={exportProgress} />
            <p className="text-sm text-muted-foreground">Preparing your data...</p>
          </div>
        )}

        {exportStatus === "success" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Your data has been exported successfully.</AlertDescription>
          </Alert>
        )}

        {exportStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to export data. {exportError}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleExport} disabled={exportStatus === "loading"} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          {exportStatus === "loading" ? "Exporting..." : "Export Data"}
        </Button>
      </CardContent>
    </Card>
  );
}
