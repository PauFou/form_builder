"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Info,
} from "lucide-react";

interface ParityReportProps {
  report: {
    total_fields: number;
    supported_fields: number;
    partially_supported_fields: number;
    unsupported_fields: number;
    field_mappings: Array<{
      source_type: string;
      source_id: string;
      target_type: string;
      target_id: string;
      notes?: string;
    }>;
    warnings: string[];
    platform_specific?: {
      [key: string]: {
        features_preserved: string[];
        features_requiring_adjustment: string[];
        features_not_supported: string[];
      };
    };
  };
  platform: "typeform" | "google_forms" | "tally";
  onClose?: () => void;
}

export function ParityReport({ report, platform, onClose }: ParityReportProps) {
  const [showFieldMappings, setShowFieldMappings] = useState(false);

  const supportPercentage = Math.round(
    ((report.supported_fields + report.partially_supported_fields * 0.5) / report.total_fields) *
      100
  );

  const getFieldTypeIcon = (type: string) => {
    if (type.includes("text") || type.includes("email")) return "✏️";
    if (type.includes("select") || type.includes("choice")) return "☑️";
    if (type.includes("number") || type.includes("scale")) return "🔢";
    if (type.includes("date") || type.includes("time")) return "📅";
    if (type.includes("file") || type.includes("upload")) return "📎";
    if (type.includes("payment")) return "💳";
    return "📋";
  };

  const downloadReport = () => {
    const reportData = {
      import_date: new Date().toISOString(),
      platform,
      ...report,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}-import-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const platformSpecific = report.platform_specific?.[platform];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Import Parity Report</h3>
          <p className="text-sm text-muted-foreground">
            Review how your {platform.charAt(0).toUpperCase() + platform.slice(1).replace("_", " ")}{" "}
            form was imported
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadReport}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Compatibility</span>
            <div className="flex items-center gap-2">
              <Progress value={supportPercentage} className="w-32" />
              <span className="text-sm font-medium">{supportPercentage}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-semibold">{report.supported_fields}</p>
              <p className="text-xs text-muted-foreground">Fully Supported</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-semibold">{report.partially_supported_fields}</p>
              <p className="text-xs text-muted-foreground">Partially Supported</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-semibold">{report.unsupported_fields}</p>
              <p className="text-xs text-muted-foreground">Not Supported</p>
            </div>
          </div>

          {report.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">Import Warnings:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {report.warnings.slice(0, 3).map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                  {report.warnings.length > 3 && (
                    <li className="text-muted-foreground">
                      ...and {report.warnings.length - 3} more warnings
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {platformSpecific && (
        <Tabs defaultValue="preserved" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preserved">
              <CheckCircle className="h-4 w-4 mr-2" />
              Preserved
            </TabsTrigger>
            <TabsTrigger value="adjusted">
              <AlertCircle className="h-4 w-4 mr-2" />
              Need Adjustment
            </TabsTrigger>
            <TabsTrigger value="unsupported">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Not Supported
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preserved" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-700">Features Preserved</CardTitle>
                <CardDescription>
                  These features were successfully imported without changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {platformSpecific.features_preserved.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjusted" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-yellow-700">
                  Features Requiring Adjustment
                </CardTitle>
                <CardDescription>
                  These features were imported but may need manual review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {platformSpecific.features_requiring_adjustment.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unsupported" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-700">Features Not Supported</CardTitle>
                <CardDescription>These features could not be imported</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {platformSpecific.features_not_supported.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowFieldMappings(!showFieldMappings)}
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Field Mappings ({report.field_mappings.length})
          </span>
          {showFieldMappings ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {showFieldMappings && (
          <Card>
            <ScrollArea className="h-[300px]">
              <CardContent className="p-0">
                {report.field_mappings.map((mapping, idx) => (
                  <div key={idx}>
                    <div className="px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getFieldTypeIcon(mapping.source_type)}</span>
                          <div>
                            <p className="text-sm font-medium">{mapping.source_type}</p>
                            <p className="text-xs text-muted-foreground">ID: {mapping.source_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">→</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{mapping.target_type}</p>
                            <p className="text-xs text-muted-foreground">ID: {mapping.target_id}</p>
                          </div>
                        </div>
                      </div>
                      {mapping.notes && (
                        <div className="mt-2 flex items-start gap-2">
                          <Info className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <p className="text-xs text-muted-foreground">{mapping.notes}</p>
                        </div>
                      )}
                    </div>
                    {idx < report.field_mappings.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </ScrollArea>
          </Card>
        )}
      </div>

      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose}>Close Report</Button>
        </div>
      )}
    </div>
  );
}
