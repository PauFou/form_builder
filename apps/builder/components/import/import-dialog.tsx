"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  FileCode2,
  FileType,
  Import,
  Loader2,
  Table,
} from "lucide-react";

import { formsApi } from "../../lib/api/forms";
import { ParityReport } from "./parity-report";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const router = useRouter();
  const [importType, setImportType] = useState<"typeform" | "google_forms" | "tally">("typeform");
  const [source, setSource] = useState("");
  const [credentials, setCredentials] = useState({ access_token: "", api_key: "" });
  const [preview, setPreview] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [requirements, setRequirements] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [showParityReport, setShowParityReport] = useState(false);

  // Validate source
  const validateMutation = useMutation({
    mutationFn: (data: { type: "typeform" | "google_forms" | "tally"; source: string }) =>
      formsApi.validateImport(data),
    onSuccess: (data) => {
      setValidationResult(data);
    },
  });

  // Get requirements
  const requirementsMutation = useMutation({
    mutationFn: (sourceType: "typeform" | "google_forms" | "tally") =>
      formsApi.getImportRequirements(sourceType),
    onSuccess: (data) => {
      setRequirements(data);
    },
  });

  // Preview import
  const previewMutation = useMutation({
    mutationFn: (data: {
      type: "typeform" | "google_forms" | "tally";
      source: string;
      credentials?: any;
    }) => formsApi.previewImport(data),
    onSuccess: (data) => {
      setPreview(data.preview);
    },
  });

  // Perform import
  const importMutation = useMutation({
    mutationFn: (data: {
      type: "typeform" | "google_forms" | "tally";
      source: string;
      credentials?: any;
    }) => formsApi.importForm(data),
    onSuccess: (data) => {
      setImportResult(data);

      if (data.success) {
        if (data.mapping_report && data.warnings && data.warnings.length > 0) {
          toast.success("Form imported with some warnings - view the parity report");
          setShowParityReport(true);
        } else {
          toast.success("Form imported successfully!");
          router.push(`/forms/${data.form_id}/edit`);
          onOpenChange(false);
        }
      } else {
        toast.error("Import failed - check the error details");
        setShowParityReport(true);
      }
    },
    onError: () => {
      toast.error("Failed to import form");
    },
  });

  const handleSourceChange = (value: string) => {
    setSource(value);
    setValidationResult(null);
    setPreview(null);

    // Auto-validate when URL is pasted
    if (value.startsWith("http")) {
      validateMutation.mutate({ type: importType, source: value });
    }
  };

  const handlePreview = () => {
    let credentialsData = undefined;
    if (importType === "typeform") {
      credentialsData = { access_token: credentials.access_token };
    } else if (importType === "tally") {
      credentialsData = { api_key: credentials.api_key };
    }

    const data = {
      type: importType,
      source,
      credentials: credentialsData,
    };
    previewMutation.mutate(data);
  };

  const handleImport = () => {
    let credentialsData = undefined;
    if (importType === "typeform") {
      credentialsData = { access_token: credentials.access_token };
    } else if (importType === "tally") {
      credentialsData = { api_key: credentials.api_key };
    }

    const data = {
      type: importType,
      source,
      credentials: credentialsData,
    };
    importMutation.mutate(data);
  };

  const renderImportContent = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="source">
            {importType === "typeform"
              ? "Typeform URL or ID"
              : importType === "google_forms"
                ? "Google Forms URL or ID"
                : "Tally URL or Form ID"}
          </Label>
          <Input
            id="source"
            placeholder={
              importType === "typeform"
                ? "https://form.typeform.com/to/abcdef or abcdef"
                : importType === "google_forms"
                  ? "https://docs.google.com/forms/d/abc123/edit"
                  : "https://tally.so/r/abc123 or abc123"
            }
            value={source}
            onChange={(e) => handleSourceChange(e.target.value)}
          />
          {validationResult && (
            <div className="flex items-center gap-2 text-sm">
              {validationResult.valid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">{validationResult.message}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{validationResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>

        {importType === "typeform" && (
          <div className="space-y-2">
            <Label htmlFor="access_token">Personal Access Token</Label>
            <Input
              id="access_token"
              type="password"
              placeholder="Your Typeform access token"
              value={credentials.access_token}
              onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get your token from Typeform account settings → Personal tokens
            </p>
          </div>
        )}

        {importType === "tally" && (
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="Your Tally API key"
              value={credentials.api_key}
              onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from Tally account settings → API & Webhooks
            </p>
          </div>
        )}

        {importType === "google_forms" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll be redirected to Google to authorize access to your forms
            </AlertDescription>
          </Alert>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Title:</span>{" "}
                  <span className="font-medium">{preview.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pages:</span>{" "}
                  <span className="font-medium">{preview.page_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Questions:</span>{" "}
                  <span className="font-medium">{preview.field_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Logic:</span>{" "}
                  {preview.has_logic ? (
                    <Badge variant="default" className="text-xs">
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      No
                    </Badge>
                  )}
                </div>
              </div>

              {preview.field_types && Object.keys(preview.field_types).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Field Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preview.field_types).map(([type, count]) => (
                      <Badge key={type} variant="outline">
                        {type}: {count as any}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {preview.warnings && preview.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Import Warnings:</p>
                  <ul className="list-disc list-inside text-sm">
                    {preview.warnings.slice(0, 5).map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                    {preview.warnings.length > 5 && (
                      <li>...and {preview.warnings.length - 5} more warnings</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={showParityReport ? "max-w-4xl" : "max-w-2xl"}>
        {showParityReport && importResult ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Report</DialogTitle>
              <DialogDescription>
                Review your form import results and compatibility
              </DialogDescription>
            </DialogHeader>
            <ParityReport
              report={importResult.mapping_report}
              platform={importType}
              onClose={() => {
                if (importResult.success && importResult.form_id) {
                  router.push(`/forms/${importResult.form_id}/edit`);
                }
                onOpenChange(false);
              }}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Import Form</DialogTitle>
              <DialogDescription>
                Import your existing forms from Typeform, Google Forms, or Tally
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={importType}
              onValueChange={(v: any) => {
                setImportType(v);
                setSource("");
                setCredentials({ access_token: "", api_key: "" });
                setPreview(null);
                setValidationResult(null);
                requirementsMutation.mutate(v);
              }}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="typeform" className="gap-2">
                  <FileType className="h-4 w-4" />
                  Typeform
                </TabsTrigger>
                <TabsTrigger value="google_forms" className="gap-2">
                  <FileCode2 className="h-4 w-4" />
                  Google Forms
                </TabsTrigger>
                <TabsTrigger value="tally" className="gap-2">
                  <Table className="h-4 w-4" />
                  Tally
                </TabsTrigger>
              </TabsList>

              <TabsContent value="typeform" className="mt-4">
                {renderImportContent()}
              </TabsContent>

              <TabsContent value="google_forms" className="mt-4">
                {renderImportContent()}
              </TabsContent>

              <TabsContent value="tally" className="mt-4">
                {renderImportContent()}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {!preview ? (
                <Button
                  onClick={handlePreview}
                  disabled={
                    !source ||
                    !validationResult?.valid ||
                    (importType === "typeform" && !credentials.access_token) ||
                    (importType === "tally" && !credentials.api_key) ||
                    previewMutation.isPending
                  }
                >
                  {previewMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleImport} disabled={importMutation.isPending}>
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Import className="h-4 w-4 mr-2" />
                      Import Form
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
