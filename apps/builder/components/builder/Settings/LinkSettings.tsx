"use client";

import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

export function LinkSettings() {
  const { form, updateForm } = useFormBuilderStore();
  const socialImageInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const settings = form?.settings || {};
  const linkSettings = settings.linkSettings || {};

  const [socialImagePreview, setSocialImagePreview] = useState<string | null>(
    linkSettings.socialPreviewImage || null
  );
  const [faviconPreview, setFaviconPreview] = useState<string | null>(linkSettings.favicon || null);

  const handleLinkSettingChange = (key: string, value: any) => {
    updateForm({
      settings: {
        ...settings,
        linkSettings: {
          ...linkSettings,
          [key]: value,
        },
      },
    });
  };

  const handleSocialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setSocialImagePreview(dataUrl);
        handleLinkSettingChange("socialPreviewImage", dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.match(/image\/(png|x-icon|vnd.microsoft.icon)/)) {
        alert("Please upload a .png or .ico file");
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setFaviconPreview(dataUrl);
        handleLinkSettingChange("favicon", dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const title = linkSettings.title || "My Form";
  const description = linkSettings.description || "Fill out my Youform";

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <p className="text-sm text-gray-600">
          Setup how your forms will appear in social media like Facebook, X etc.
        </p>
      </div>

      {/* Title */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">Title</Label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleLinkSettingChange("title", e.target.value)}
          maxLength={60}
          placeholder="My Form"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent mb-2"
        />
        <p className="text-xs text-gray-500">Max characters {title.length}/60.</p>
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">Description</Label>
        <textarea
          value={description}
          onChange={(e) => handleLinkSettingChange("description", e.target.value)}
          maxLength={110}
          placeholder="Fill out my Youform"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent mb-2 resize-none"
        />
        <p className="text-xs text-gray-500">Max characters {description.length}/110.</p>
      </div>

      {/* Social Preview Image */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-semibold text-gray-900">Social Preview Image</Label>
          <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">PRO</span>
        </div>
        <input
          ref={socialImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleSocialImageUpload}
          className="hidden"
        />
        <button
          onClick={() => socialImageInputRef.current?.click()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors mb-2"
        >
          {socialImagePreview ? "Change file" : "Aucun fichier choisi"}
        </button>
        <p className="text-xs text-gray-500">Recommended size 1200x630. Should be less than 5MB.</p>
      </div>

      {/* Favicon */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-semibold text-gray-900">Favicon</Label>
          <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">PRO</span>
        </div>
        <input
          ref={faviconInputRef}
          type="file"
          accept=".ico,.png,image/x-icon,image/png"
          onChange={handleFaviconUpload}
          className="hidden"
        />
        <button
          onClick={() => faviconInputRef.current?.click()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors mb-2"
        >
          {faviconPreview ? "Change file" : "Aucun fichier choisi"}
        </button>
        <p className="text-xs text-gray-500">Recommended size 60x60. Ideally .ico or .png image.</p>
      </div>

      {/* Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favicon Preview */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
          <Label className="text-sm font-semibold text-gray-900 mb-4 block">Favicon Preview</Label>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="w-8 h-8 flex items-center justify-center bg-white rounded border border-gray-300">
              {faviconPreview ? (
                <img src={faviconPreview} alt="Favicon" className="w-6 h-6 object-contain" />
              ) : (
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  Y
                </div>
              )}
            </div>
            <span className="text-sm text-gray-700 font-medium">{title}</span>
          </div>
        </div>

        {/* Social Preview Image */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
          <Label className="text-sm font-semibold text-gray-900 mb-4 block">
            Social Preview Image
          </Label>
          <div className="border border-gray-200 rounded overflow-hidden">
            {/* Image */}
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
              {socialImagePreview ? (
                <img
                  src={socialImagePreview}
                  alt="Social Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm">No preview image</div>
              )}
            </div>
            {/* Content */}
            <div className="p-3 bg-white border-t border-gray-200">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">YOUFORM.COM</p>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{title}</h3>
              <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
