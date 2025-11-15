"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Wrench,
  Share2,
  BarChart3,
  Plug,
  Undo2,
  Redo2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
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
  const { form, isDirty, undo, redo, canUndo, canRedo, updateForm, markClean } =
    useFormBuilderStore();
  const [internalActiveTab, setInternalActiveTab] = useState<Tab>("build");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(form?.title || "My Form");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Use controlled tab if provided, otherwise use internal state
  const activeTab = controlledTab !== undefined ? controlledTab : internalActiveTab;

  // Sync title with form state
  useEffect(() => {
    if (form?.title) {
      setTitleValue(form.title);
    }
  }, [form?.title]);

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

      setLastSaved(new Date());
      markClean();
    } catch (error) {
      console.error("Failed to save form:", error);
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleSubmit = () => {
    if (titleValue.trim() && titleValue !== form?.title) {
      updateForm({ title: titleValue.trim() });
    }
    setIsEditingTitle(false);
  };

  const tabs = [
    { id: "build" as Tab, label: "Build", icon: Wrench },
    { id: "integrate" as Tab, label: "Integrate", icon: Plug },
    { id: "share" as Tab, label: "Share", icon: Share2 },
    { id: "results" as Tab, label: "Results", icon: BarChart3 },
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
    router.push(`/forms/${formId}/publish`);
  };

  const handleTabClick = (tabId: Tab) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  // Save status indicator
  const saveStatus = isSaving ? "saving" : isDirty ? "unsaved" : lastSaved ? "saved" : null;

  return (
    <>
      <header className="h-[108px] bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto h-full px-20 py-8 flex items-center justify-between">
          {/* Left Section - Logo + Back */}
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              {/* Logo icon - orange form icon */}
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              {/* Form Title */}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleSubmit();
                    }
                    if (e.key === "Escape") {
                      setTitleValue(form?.title || "My Form");
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-xl font-bold text-black tracking-tight bg-transparent border-b-2 border-gray-300 focus:border-black focus:outline-none px-1"
                  autoFocus
                />
              ) : (
                <span
                  className="text-xl font-bold text-black tracking-tight cursor-pointer hover:text-gray-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                >
                  {form?.title || "MY FORM"}
                </span>
              )}

              {/* Save Status Indicator */}
              <AnimatePresence mode="wait">
                {saveStatus && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 text-xs ml-2"
                  >
                    {saveStatus === "saving" && (
                      <>
                        <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        <span className="text-blue-600">Saving...</span>
                      </>
                    )}
                    {saveStatus === "saved" && (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-600">Saved</span>
                      </>
                    )}
                    {saveStatus === "unsaved" && (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-600">Unsaved</span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center Section - Tabs */}
          <div className="flex items-center gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 text-base font-semibold text-black transition-colors rounded-md relative",
                    isActive ? "bg-gray-100" : "hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Undo/Redo group */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => canUndo() && undo()}
                disabled={!canUndo()}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  canUndo() ? "hover:bg-gray-100 text-gray-700" : "text-gray-300 cursor-not-allowed"
                )}
                title="Undo"
              >
                <Undo2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => canRedo() && redo()}
                disabled={!canRedo()}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  canRedo() ? "hover:bg-gray-100 text-gray-700" : "text-gray-300 cursor-not-allowed"
                )}
                title="Redo"
              >
                <Redo2 className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Button - Yellow like YouForm "Log In" */}
            <button
              onClick={handlePreview}
              className="px-6 py-2 text-base font-normal text-black bg-[#FFE711] border-2 border-black rounded-md hover:bg-[#FFD700] transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Preview
            </button>

            {/* Publish Button - Teal like YouForm "Sign Up" */}
            <button
              onClick={handlePublish}
              className="px-6 py-2 text-base font-normal text-black bg-[#45AD94] border-2 border-black rounded-md hover:bg-[#3D9A82] transition-colors"
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      {/* Preview Modal */}
      <PreviewModal open={isPreviewOpen} onOpenChange={setIsPreviewOpen} formId={formId} />
    </>
  );
}
