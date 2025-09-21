"use client";

import { useState, useEffect } from "react";
import { Button } from "@skemya/ui";
import { Badge } from "@skemya/ui";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@skemya/ui";
import {
  Play,
  Pause,
  Share2,
  Copy,
  QrCode,
  Link2,
  Globe,
  ChevronDown,
  Eye,
  Calendar,
  Users,
  BarChart3,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formsApi } from "../../lib/api/forms";
import { PublishDialog } from "./publish-dialog";
import QRCode from "qrcode";

interface PublishManagerProps {
  formId: string;
  form: any;
}

export function PublishManager({ formId, form }: PublishManagerProps) {
  const [isPublished, setIsPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [publishedVersion, setPublishedVersion] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Load form status
  useEffect(() => {
    const loadFormStatus = async () => {
      try {
        setIsLoading(true);
        const formData = await formsApi.get(formId);
        const published = formData.status === "published";
        setIsPublished(published);

        if (published) {
          const baseUrl = window.location.origin.replace("3001", "3000"); // Marketing site
          const formUrl = `${baseUrl}/f/${formData.slug || formId}`;
          setPublishedUrl(formUrl);
          setPublishedVersion(formData.latest_version);

          // Generate QR code
          const qrDataUrl = await QRCode.toDataURL(formUrl, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeUrl(qrDataUrl);
        }
      } catch (error) {
        console.error("Failed to load form status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormStatus();
  }, [formId]);

  const handlePublish = () => {
    setShowPublishDialog(true);
  };

  const handleUnpublish = async () => {
    if (
      !confirm("Are you sure you want to unpublish this form? It will no longer accept responses.")
    ) {
      return;
    }

    try {
      await formsApi.unpublish(formId);
      setIsPublished(false);
      toast.success("Form unpublished successfully");
    } catch (error) {
      console.error("Failed to unpublish form:", error);
      toast.error("Failed to unpublish form");
    }
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyEmbedCode = (type: "iframe" | "script") => {
    let code = "";
    if (type === "iframe") {
      code = `<iframe src="${publishedUrl}" width="100%" height="600" frameborder="0"></iframe>`;
    } else {
      code = `<script src="${window.location.origin}/embed.js" data-form-id="${formId}"></script>`;
    }
    copyToClipboard(code, "Embed code copied!");
  };

  if (isLoading) {
    return (
      <Button size="sm" disabled>
        <div className="h-4 w-4 border-2 border-transparent border-t-current animate-spin rounded-full" />
      </Button>
    );
  }

  return (
    <>
      {isPublished ? (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-100 text-green-800">
            <Globe className="h-3 w-3 mr-1" />
            Live
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Manage
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Form
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Live Form
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/forms/${formId}/responses`}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Responses
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleUnpublish} className="text-red-600">
                <Pause className="h-4 w-4 mr-2" />
                Unpublish Form
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Button size="sm" onClick={handlePublish} className="group">
          <Play className="h-4 w-4 mr-2" />
          Publish
        </Button>
      )}

      <PublishDialog
        isOpen={showPublishDialog}
        onClose={() => {
          setShowPublishDialog(false);
          // Reload form status after publishing
          if (!isPublished) {
            window.location.reload();
          }
        }}
        formId={formId}
      />

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Form
            </DialogTitle>
            <DialogDescription>
              Share your form with respondents or embed it on your website
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Form URL */}
            <div className="space-y-2">
              <h3 className="font-semibold">Direct Link</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={publishedUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(publishedUrl, "Form link copied!")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" asChild>
                  <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="space-y-2">
              <h3 className="font-semibold">QR Code</h3>
              <div className="flex items-start gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  {qrCodeUrl && <img src={qrCodeUrl} alt="Form QR Code" className="w-32 h-32" />}
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Share this QR code for easy mobile access
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.download = `form-${formId}-qr.png`;
                      link.href = qrCodeUrl;
                      link.click();
                    }}
                  >
                    Download QR Code
                  </Button>
                </div>
              </div>
            </div>

            {/* Embed Options */}
            <div className="space-y-2">
              <h3 className="font-semibold">Embed on Your Website</h3>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">iFrame Embed</span>
                    <Button variant="ghost" size="sm" onClick={() => copyEmbedCode("iframe")}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="text-xs text-muted-foreground">
                    {`<iframe src="${publishedUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                  </code>
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">JavaScript Embed</span>
                    <Button variant="ghost" size="sm" onClick={() => copyEmbedCode("script")}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="text-xs text-muted-foreground">
                    {`<script src="${window.location.origin}/embed.js" data-form-id="${formId}"></script>`}
                  </code>
                </div>
              </div>
            </div>

            {/* Form Info */}
            {publishedVersion && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div>
                      Published on {new Date(publishedVersion.published_at).toLocaleDateString()}
                    </div>
                    {publishedVersion.response_count > 0 && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {publishedVersion.response_count} responses
                        </span>
                        <span>Version {publishedVersion.version}</span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
