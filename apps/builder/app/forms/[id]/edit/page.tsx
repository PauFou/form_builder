"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
} from "@forms/ui";
import {
  ArrowLeft,
  Download,
  Eye,
  MoreVertical,
  Play,
  Redo,
  Save,
  Settings,
  Undo,
} from "lucide-react";

import { BlockLibrary } from "../../../../components/builder/block-library";
import { FormCanvas } from "../../../../components/builder/form-canvas";
import { BlockSettings } from "../../../../components/builder/block-settings";
import { formsApi } from "../../../../lib/api/forms";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { DEMO_FORMS } from "../../../../lib/demo-forms";

export default function EditFormPage() {
  const params = useParams();
  const formId = params.id as string;

  const { form, setForm, isDirty, undo, redo, history, historyIndex, markClean } =
    useFormBuilderStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["form", formId],
    queryFn: async () => {
      // Check if it's a demo form first
      if (DEMO_FORMS[formId]) {
        return DEMO_FORMS[formId];
      }
      return formsApi.get(formId);
    },
  });

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data, setForm]);

  const handleSave = async () => {
    if (!form || !isDirty) return;

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
      toast.success("Form saved successfully");
    } catch (error) {
      toast.error("Failed to save form");
    }
  };

  const handlePublish = async () => {
    try {
      await formsApi.publish(formId);
      toast.success("Form published successfully");
    } catch (error) {
      toast.error("Failed to publish form");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Failed to load form</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <Link href="/forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold">{form?.title || "Untitled Form"}</h1>
          {isDirty && <span className="text-sm text-muted-foreground">(Unsaved changes)</span>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" asChild>
            <Link href={`/forms/${formId}/preview`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>

          <Button size="sm" onClick={handleSave} disabled={!isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          <Button size="sm" variant="default" onClick={handlePublish}>
            <Play className="h-4 w-4 mr-2" />
            Publish
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Form Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete Form</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Builder Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Library */}
        <aside className="w-80 border-r bg-muted/50 p-4 overflow-y-auto">
          <BlockLibrary />
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 p-4 overflow-hidden">
          <FormCanvas />
        </main>

        {/* Right Sidebar - Block Settings */}
        <aside className="w-96 border-l bg-muted/50 p-4 overflow-y-auto">
          <BlockSettings />
        </aside>
      </div>
    </div>
  );
}
