"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Eye,
  Download,
  ChevronDown,
  ChevronRight,
  GitBranch,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@skemya/ui";
import { toast } from "react-hot-toast";
import { formsApi } from "../../../../lib/api/forms";
import { formatDistanceToNow } from "date-fns";

interface FormVersion {
  id: string;
  version: number;
  publishedAt?: Date;
  publishedBy: {
    id: string;
    email: string;
    name?: string;
  };
  status: "draft" | "published" | "archived";
  canaryPercent?: number;
  changes: {
    blocks?: number;
    pages?: number;
    logic?: number;
    theme?: boolean;
  };
  schema: any;
}

export default function FormVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<[string?, string?]>([]);
  const [expandedVersions, setExpandedVersions] = useState<string[]>([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<FormVersion | null>(null);

  useEffect(() => {
    loadVersions();
  }, [formId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await formsApi.getVersions(formId);
      setVersions(response);
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: FormVersion) => {
    setVersionToRestore(version);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!versionToRestore) return;

    try {
      await formsApi.restoreVersion(formId, versionToRestore.id);
      toast.success(`Restored to version ${versionToRestore.version}`);
      router.push(`/forms/${formId}/edit`);
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore version");
    } finally {
      setRestoreDialogOpen(false);
    }
  };

  const handleExport = async (version: FormVersion) => {
    try {
      const blob = new Blob([JSON.stringify(version.schema, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `form-${formId}-v${version.version}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Version exported");
    } catch (error) {
      console.error("Failed to export version:", error);
      toast.error("Failed to export version");
    }
  };

  const toggleVersionExpanded = (versionId: string) => {
    setExpandedVersions((prev) =>
      prev.includes(versionId) ? prev.filter((id) => id !== versionId) : [...prev, versionId]
    );
  };

  const renderVersionCard = (version: FormVersion) => {
    const isExpanded = expandedVersions.includes(version.id);
    const isSelected = selectedVersions.includes(version.id);

    return (
      <motion.div
        key={version.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className={isSelected ? "ring-2 ring-primary" : ""}>
          <CardHeader className="cursor-pointer" onClick={() => toggleVersionExpanded(version.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Version {version.version}
                    {version.status === "published" && (
                      <Badge variant="success" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    )}
                    {version.canaryPercent && (
                      <Badge variant="secondary" className="ml-1">
                        {version.canaryPercent}% canary
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {version.publishedAt
                      ? formatDistanceToNow(new Date(version.publishedAt), { addSuffix: true })
                      : "Draft"}
                    {" by "}
                    {version.publishedBy.name || version.publishedBy.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/preview/${formId}?version=${version.version}`, "_blank");
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(version);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(version);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {isExpanded && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {version.changes.blocks !== undefined && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{version.changes.blocks}</p>
                    <p className="text-sm text-muted-foreground">Fields</p>
                  </div>
                )}
                {version.changes.pages !== undefined && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{version.changes.pages}</p>
                    <p className="text-sm text-muted-foreground">Pages</p>
                  </div>
                )}
                {version.changes.logic !== undefined && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{version.changes.logic}</p>
                    <p className="text-sm text-muted-foreground">Logic Rules</p>
                  </div>
                )}
                {version.changes.theme && (
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Custom Theme</p>
                  </div>
                )}
              </div>

              {selectedVersions[0] && selectedVersions[0] !== version.id && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (selectedVersions[0] === version.id) {
                        setSelectedVersions([undefined, selectedVersions[1]]);
                      } else if (selectedVersions[1] === version.id) {
                        setSelectedVersions([selectedVersions[0], undefined]);
                      } else if (!selectedVersions[1]) {
                        setSelectedVersions([selectedVersions[0], version.id]);
                      } else {
                        setSelectedVersions([version.id, undefined]);
                      }
                    }}
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Compare with Version{" "}
                    {versions.find((v) => v.id === selectedVersions[0])?.version}
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/forms/${formId}/edit`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Builder
            </Button>
            <h1 className="text-lg font-semibold">Version History</h1>
          </div>

          <div className="flex items-center gap-2">
            <Select value="all" onValueChange={() => {}}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Versions</SelectItem>
                <SelectItem value="published">Published Only</SelectItem>
                <SelectItem value="drafts">Drafts Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto py-8 px-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => renderVersionCard(version))}

            {versions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No versions yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm">
                    Version history will appear here once you publish your form
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version {versionToRestore?.version}?</DialogTitle>
            <DialogDescription>
              This will replace your current form with version {versionToRestore?.version}. Your
              current changes will be saved as a new draft version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
