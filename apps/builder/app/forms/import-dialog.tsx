"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@skemya/ui";
import { Upload, FileText, Globe, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { formsApi } from "../../lib/api/forms";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportDialog({ isOpen, onClose, onImportComplete }: ImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState<"typeform" | "google_forms">("typeform");
  const [importUrl, setImportUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "success" | "error">(
    "idle"
  );

  const handleImport = async () => {
    if (!importUrl && !file) {
      toast.error("Please provide a URL or file to import");
      return;
    }

    setIsImporting(true);
    setImportStatus("importing");

    try {
      // Mock import for now
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setImportStatus("success");
      toast.success("Form imported successfully!");

      setTimeout(() => {
        onImportComplete();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setImportStatus("error");
      toast.error("Failed to import form");
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setImportUrl("");
    setFile(null);
    setImportStatus("idle");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportUrl(""); // Clear URL when file is selected
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[525px] glass-card">
            <DialogHeader>
              <DialogTitle>Import Form</DialogTitle>
              <DialogDescription>
                Import your existing forms from Typeform or Google Forms
              </DialogDescription>
            </DialogHeader>

            <Tabs value={importType} onValueChange={(v) => setImportType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="typeform" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Typeform
                </TabsTrigger>
                <TabsTrigger value="google_forms" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Google Forms
                </TabsTrigger>
              </TabsList>

              <TabsContent value="typeform" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="typeform-url">Typeform URL</Label>
                  <Input
                    id="typeform-url"
                    placeholder="https://yourname.typeform.com/to/formId"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={isImporting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the public URL of your Typeform
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeform-file">Upload JSON Export</Label>
                  <Input
                    id="typeform-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    disabled={isImporting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Export your Typeform as JSON and upload it here
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="google_forms" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="gforms-url">Google Forms URL</Label>
                  <Input
                    id="gforms-url"
                    placeholder="https://docs.google.com/forms/d/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={isImporting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure your form is publicly accessible
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Import Status */}
            <AnimatePresence mode="wait">
              {importStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-4 p-4 rounded-lg border ${
                    importStatus === "success"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : importStatus === "error"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {importStatus === "importing" && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Importing your form...</span>
                      </>
                    )}
                    {importStatus === "success" && (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Form imported successfully!</span>
                      </>
                    )}
                    {importStatus === "error" && (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span>Failed to import form. Please try again.</span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || (!importUrl && !file)}
                className="min-w-[100px]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
