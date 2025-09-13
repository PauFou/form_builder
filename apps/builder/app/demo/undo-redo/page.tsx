"use client";

import { useEffect } from "react";
import { FormBuilder } from "../../../components/builder/form-builder";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import type { Form } from "@forms/contracts";

const demoForm: Form = {
  id: "demo-form",
  title: "Demo Form for Undo/Redo",
  description: "Test the undo/redo functionality",
  pages: [
    {
      id: "page-1",
      title: "First Page",
      blocks: [
        {
          id: "block-1",
          type: "short_text",
          question: "What's your name?",
          required: true,
        },
        {
          id: "block-2",
          type: "email",
          question: "What's your email?",
          required: true,
        },
      ],
    },
  ],
  settings: {
    showProgressBar: true,
    allowBackNavigation: true,
    autoSaveProgress: false,
    language: "en",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function UndoRedoDemo() {
  const { initializeForm } = useFormBuilderStore();

  useEffect(() => {
    initializeForm(demoForm);
  }, [initializeForm]);

  const handleSave = () => {
    console.log("Save clicked");
  };

  const handlePreview = () => {
    console.log("Preview clicked");
  };

  const handlePublish = () => {
    console.log("Publish clicked");
  };

  return (
    <div className="h-screen">
      <FormBuilder
        onSave={handleSave}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />
    </div>
  );
}