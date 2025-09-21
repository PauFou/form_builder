"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { ModernFormBuilderEnhanced } from "../../../../components/builder/modern-form-builder-enhanced";
import { PublishDialog } from "../../../../components/publish/publish-dialog";
import { formsApi } from "../../../../lib/api/forms";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { DEMO_FORMS } from "../../../../lib/demo-forms";

export default function EditFormPage() {
  const params = useParams();
  const formId = params.id as string;

  const { form, setForm, markClean } = useFormBuilderStore();
  const [showPublishDialog, setShowPublishDialog] = useState(false);

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
      console.log("EditFormPage: Raw API data:", data);
      setForm(data);
    }
  }, [data, setForm]);

  const handleSave = async () => {
    if (!form) return;

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

  const handlePublish = () => {
    setShowPublishDialog(true);
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
    <>
      <ModernFormBuilderEnhanced formId={formId} onSave={handleSave} onPublish={handlePublish} />

      <PublishDialog
        isOpen={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        formId={formId}
      />
    </>
  );
}
