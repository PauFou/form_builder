"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Globe,
  Monitor,
  MapPin,
  Tag,
  Download,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
} from "@skemya/ui";
import { toast } from "react-hot-toast";
import { formsApi } from "../../../../../lib/api/forms";
import { format, formatDistanceToNow } from "date-fns";

interface SubmissionDetail {
  id: string;
  formId: string;
  formTitle: string;
  respondentKey: string;
  createdAt: Date;
  completedAt?: Date;
  status: "completed" | "partial" | "abandoned";
  answers: Record<string, any>;
  metadata: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    location?: {
      country?: string;
      city?: string;
      region?: string;
    };
    device?: {
      type?: string;
      browser?: string;
      os?: string;
    };
  };
  tags: string[];
  events: Array<{
    type: string;
    timestamp: Date;
    data?: any;
  }>;
  blocks: Array<{
    id: string;
    question: string;
    type: string;
    answer?: any;
  }>;
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["answers"]));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, [formId, submissionId]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const response = await formsApi.getSubmission(formId, submissionId);
      setSubmission(response.data);
    } catch (error) {
      console.error("Failed to load submission:", error);
      toast.error("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await formsApi.deleteSubmissions(formId, [submissionId]);
      toast.success("Submission deleted");
      router.push(`/forms/${formId}/submissions`);
    } catch (error) {
      console.error("Failed to delete submission:", error);
      toast.error("Failed to delete submission");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;

    try {
      const newTags = [...(submission?.tags || []), tagInput.trim()];
      await formsApi.updateSubmission(formId, submissionId, { tags: newTags });
      setSubmission((prev) => (prev ? { ...prev, tags: newTags } : null));
      setTagInput("");
      setIsAddingTag(false);
      toast.success("Tag added");
    } catch (error) {
      console.error("Failed to add tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const newTags = submission?.tags.filter((tag) => tag !== tagToRemove) || [];
      await formsApi.updateSubmission(formId, submissionId, { tags: newTags });
      setSubmission((prev) => (prev ? { ...prev, tags: newTags } : null));
      toast.success("Tag removed");
    } catch (error) {
      console.error("Failed to remove tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        submission,
        exportedAt: new Date(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submission-${submissionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Submission exported");
    } catch (error) {
      console.error("Failed to export submission:", error);
      toast.error("Failed to export submission");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "abandoned":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Submission not found</h1>
          <p className="text-muted-foreground">The submission you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/forms/${formId}/submissions`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Submissions
              </Button>
              <h1 className="text-lg font-semibold">Submission Detail</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getStatusIcon(submission.status)}
                  <span className="capitalize">{submission.status} Submission</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Started</p>
                    <p className="font-medium">{format(new Date(submission.createdAt), "PPp")}</p>
                  </div>
                  {submission.completedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="font-medium">
                        {format(new Date(submission.completedAt), "PPp")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Answers */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("answers")}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {expandedSections.has("answers") ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    Answers
                  </CardTitle>
                  <Badge variant="secondary">{submission.blocks.length} responses</Badge>
                </div>
              </CardHeader>
              {expandedSections.has("answers") && (
                <CardContent className="space-y-4">
                  {submission.blocks.map((block) => (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{block.question}</h4>
                        <Badge variant="outline" className="text-xs">
                          {block.type}
                        </Badge>
                      </div>
                      <div className="bg-muted rounded-md p-3">
                        {block.answer !== undefined && block.answer !== null ? (
                          <p className="whitespace-pre-wrap">
                            {typeof block.answer === "object"
                              ? JSON.stringify(block.answer, null, 2)
                              : String(block.answer)}
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic">No answer provided</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(String(block.answer));
                          toast.success("Answer copied to clipboard");
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Answer
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("activity")}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {expandedSections.has("activity") ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    Activity Timeline
                  </CardTitle>
                  <Badge variant="secondary">{submission.events.length} events</Badge>
                </div>
              </CardHeader>
              {expandedSections.has("activity") && (
                <CardContent>
                  <div className="space-y-4">
                    {submission.events.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <p className="font-medium">{event.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Respondent Info */}
            <Card>
              <CardHeader>
                <CardTitle>Respondent Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Respondent ID</p>
                  <p className="font-mono text-sm">{submission.respondentKey}</p>
                </div>

                {submission.metadata.ip && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      IP Address
                    </p>
                    <p className="font-mono text-sm">{submission.metadata.ip}</p>
                  </div>
                )}

                {submission.metadata.location && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </p>
                    <p className="text-sm">
                      {[
                        submission.metadata.location.city,
                        submission.metadata.location.region,
                        submission.metadata.location.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}

                {submission.metadata.device && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      Device
                    </p>
                    <p className="text-sm">
                      {submission.metadata.device.browser} on {submission.metadata.device.os}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {submission.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}

                  {isAddingTag ? (
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag..."
                        className="h-7 w-24"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsAddingTag(true)}>
                      <Tag className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission?</DialogTitle>
            <DialogDescription>
              This will permanently delete this submission. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
