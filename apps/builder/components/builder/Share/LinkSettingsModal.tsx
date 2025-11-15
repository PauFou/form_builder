"use client";

import React, { useState } from "react";
import { X, Globe, Image, Type, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
} from "@skemya/ui";

interface LinkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  settings?: {
    seoTitle?: string;
    seoDescription?: string;
    ogImage?: string;
    favicon?: string;
    customSlug?: string;
    passwordProtected?: boolean;
    password?: string;
    showBranding?: boolean;
  };
  onSave: (settings: any) => void;
}

export function LinkSettingsModal({
  isOpen,
  onClose,
  formId,
  settings = {},
  onSave,
}: LinkSettingsModalProps) {
  const [seoTitle, setSeoTitle] = useState(settings.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(settings.seoDescription || "");
  const [ogImage, setOgImage] = useState(settings.ogImage || "");
  const [favicon, setFavicon] = useState(settings.favicon || "");
  const [customSlug, setCustomSlug] = useState(settings.customSlug || "");
  const [passwordProtected, setPasswordProtected] = useState(settings.passwordProtected || false);
  const [password, setPassword] = useState(settings.password || "");
  const [showBranding, setShowBranding] = useState(settings.showBranding ?? true);

  const handleSave = () => {
    onSave({
      seoTitle,
      seoDescription,
      ogImage,
      favicon,
      customSlug,
      passwordProtected,
      password: passwordProtected ? password : undefined,
      showBranding,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Link Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SEO Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">SEO & Metadata</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo-title">Page Title</Label>
              <Input
                id="seo-title"
                placeholder="My Awesome Form"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
              <p className="text-xs text-gray-500">Appears in browser tab and search results</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo-description">Meta Description</Label>
              <Textarea
                id="seo-description"
                placeholder="A brief description of your form..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Shown in search engine results (recommended: 150-160 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og-image">Open Graph Image URL</Label>
              <Input
                id="og-image"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Image shown when sharing on social media (1200x630px recommended)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon">Favicon URL</Label>
              <Input
                id="favicon"
                type="url"
                placeholder="https://example.com/favicon.ico"
                value={favicon}
                onChange={(e) => setFavicon(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Small icon shown in browser tab (32x32px or .ico file)
              </p>
            </div>
          </div>

          {/* URL Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Custom URL</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-slug">Custom Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">youform.com/f/</span>
                <Input
                  id="custom-slug"
                  placeholder={formId}
                  value={customSlug}
                  onChange={(e) =>
                    setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Create a memorable, easy-to-share URL for your form
              </p>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="password-protected">Password Protection</Label>
                <p className="text-sm text-gray-500">Require a password to access this form</p>
              </div>
              <Switch
                id="password-protected"
                checked={passwordProtected}
                onCheckedChange={setPasswordProtected}
              />
            </div>

            {passwordProtected && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Branding Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900">Branding</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-branding">Show Branding</Label>
                <p className="text-sm text-gray-500">Display "Powered by YourForm" footer</p>
              </div>
              <Switch id="show-branding" checked={showBranding} onCheckedChange={setShowBranding} />
            </div>
            {!showBranding && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">PRO</span> feature: Remove branding requires a PRO
                  plan subscription.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
