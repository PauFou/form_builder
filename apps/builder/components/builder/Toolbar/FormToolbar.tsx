"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Eye,
  Rocket,
  Settings,
  ChevronDown,
  Undo,
  Redo,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@skemya/ui";
import { toast } from "react-hot-toast";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { formsApi } from "../../../lib/api/forms";

interface FormToolbarProps {
  formId: string;
}

export function FormToolbar({ formId }: FormToolbarProps) {
  const router = useRouter();
  const { form, isDirty, updateForm, undo, redo, canUndo, canRedo, markClean } =
    useFormBuilderStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(form?.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (form?.title) {
      setTitle(form.title);
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
      toast.success("Form saved successfully");
    } catch (error) {
      console.error("Failed to save form:", error);
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleSubmit = () => {
    if (title.trim() && title !== form?.title) {
      updateForm({ title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handlePreview = () => {
    handleSave().then(() => {
      window.open(`/preview/${formId}`, "_blank");
    });
  };

  const handlePublish = () => {
    router.push(`/forms/${formId}/publish`);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;

    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

    if (diff < 60) return "Saved just now";
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `Saved ${Math.floor(diff / 3600)} hours ago`;
    return `Saved on ${lastSaved.toLocaleDateString()}`;
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Form Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleTitleSubmit();
                  }
                }}
                className="h-8 w-64"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTitle(form?.title || "");
                  setIsEditingTitle(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-semibold hover:bg-muted px-3 py-1 rounded-md transition-colors"
            >
              {form?.title || "Untitled Form"}
            </button>
          )}

          {/* Save Status */}
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                <span>Saving...</span>
              </motion.div>
            ) : isDirty ? (
              <motion.div
                key="unsaved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-yellow-600"
              >
                <AlertCircle className="h-3 w-3" />
                <span>Unsaved changes</span>
              </motion.div>
            ) : lastSaved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{formatLastSaved()}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Center Section - Undo/Redo */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)">
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleSave} disabled={!isDirty || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          <Button size="sm" variant="ghost" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button size="sm" onClick={handlePublish}>
            <Rocket className="h-4 w-4 mr-2" />
            Publish
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <Settings className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/forms/${formId}/settings`)}>
                Form Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${formId}/theme`)}>
                Theme Editor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${formId}/logic`)}>
                Logic Editor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/forms/${formId}/versions`)}>
                <Clock className="h-4 w-4 mr-2" />
                Version History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/forms")}
                className="text-muted-foreground"
              >
                Exit Builder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
