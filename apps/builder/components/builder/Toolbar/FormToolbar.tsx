"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Undo2, Redo2, Eye, Link2, ExternalLink } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { PreviewModal } from "../Preview/PreviewModal";
import { toast } from "react-hot-toast";
import { formsApi } from "../../../lib/api/forms";

interface FormToolbarProps {
  formId: string;
  activeTab?: "build" | "integrate" | "share" | "results";
  onTabChange?: (tab: "build" | "integrate" | "share" | "results") => void;
}

type Tab = "build" | "integrate" | "share" | "results";

export function FormToolbar({ formId, activeTab: controlledTab, onTabChange }: FormToolbarProps) {
  const router = useRouter();
  const { form, isDirty, undo, redo, canUndo, canRedo, markClean } = useFormBuilderStore();
  const [internalActiveTab, setInternalActiveTab] = useState<Tab>("build");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Use controlled tab if provided, otherwise use internal state
  const activeTab = controlledTab !== undefined ? controlledTab : internalActiveTab;

  // Auto-save when form is dirty
  useEffect(() => {
    if (isDirty && form) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
    }
  }, [isDirty, form]);

  const handleSave = async () => {
    if (!form || isSaving) return;

    setIsSaving(true);
    try {
      await formsApi.update(formId, {
        title: form.title,
        description: form.description,
        pages: form.pages,
        theme: form.theme,
        logic: form.logic,
        settings: form.settings,
      });

      markClean();
    } catch (error) {
      console.error("Failed to save form:", error);
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "build" as Tab, label: "Build" },
    { id: "integrate" as Tab, label: "Integrate" },
    { id: "share" as Tab, label: "Share" },
    { id: "results" as Tab, label: "Results" },
  ];

  const handleBack = () => {
    router.push("/forms");
  };

  const handlePreview = async () => {
    await handleSave();
    setIsPreviewOpen(true);
  };

  const handlePublish = async () => {
    await handleSave();
    toast.success("Form published successfully!");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/preview/${formId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleOpenInNewTab = () => {
    window.open(`/preview/${formId}`, "_blank");
  };

  const handleTabClick = (tabId: Tab) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditedTitle(form?.title || "");
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== form?.title) {
      // Update form title via API
      formsApi.update(formId, { title: editedTitle.trim() });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      setEditedTitle(form?.title || "");
    }
  };

  return (
    <>
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between relative">
            {/* Left Section - Back Arrow + Title */}
            <div className="flex items-center gap-3 lg:gap-4 flex-1">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Back to forms"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </button>

              <div className="w-px h-5 sm:h-6 bg-gray-300" />

              {/* Form Title - Editable */}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="px-2 py-1 text-sm font-medium text-gray-900 border border-indigo-600 rounded focus:outline-none focus:ring-1 focus:ring-indigo-600 min-w-[200px]"
                  autoFocus
                />
              ) : (
                <button
                  onClick={handleTitleClick}
                  className="px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  {form?.title || "Untitled Form"}
                </button>
              )}
            </div>

            {/* Undo/Redo - Positioned between title and tabs */}
            <div className="absolute left-1/4 -translate-x-1/2 hidden md:flex items-center gap-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo"
              >
                <Undo2 className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo"
              >
                <Redo2 className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Center Section - Tab Selector (absolutely centered) */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-0.5 sm:gap-1 bg-gray-100 rounded p-0.5 sm:p-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Preview */}
              <button
                onClick={handlePreview}
                className="hidden sm:flex px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors items-center gap-1.5"
                title="Preview form"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden lg:inline">Preview</span>
              </button>

              {/* Preview mobile (icon only) */}
              <button
                onClick={handlePreview}
                className="sm:hidden p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Preview form"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Get Link */}
              <button
                onClick={handleCopyLink}
                className="hidden lg:flex px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors items-center gap-1.5"
                title="Copy form link"
              >
                <Link2 className="w-4 h-4" />
                Get Link
              </button>

              {/* Get Link tablet (icon only) */}
              <button
                onClick={handleCopyLink}
                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Copy form link"
              >
                <Link2 className="w-4 h-4" />
              </button>

              {/* Open in New Tab */}
              <button
                onClick={handleOpenInNewTab}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="w-px h-5 sm:h-6 bg-gray-300" />

              {/* Publish */}
              <button
                onClick={handlePublish}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors whitespace-nowrap"
              >
                Publish
              </button>
            </div>
          </div>

          {/* Mobile Tab Selector (below on small screens) */}
          <div className="md:hidden mt-3 flex items-center gap-1 bg-gray-100 rounded p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Preview Modal */}
      <PreviewModal open={isPreviewOpen} onOpenChange={setIsPreviewOpen} formId={formId} />
    </>
  );
}
