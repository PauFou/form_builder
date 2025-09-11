"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { FormRenderer, type FormSchema } from "@forms/runtime";

export default function PreviewPage() {
  const params = useParams();
  const formId = params.id as string;
  const [submissionData, setSubmissionData] = useState<any>(null);

  // Get form from store (in builder context)
  const { form } = useFormBuilderStore();

  const handleSubmit = async (data: any) => {
    console.log("Form submitted:", data);
    setSubmissionData(data);
  };

  const handleReset = () => {
    setSubmissionData(null);
    // Clear any saved state
    if (typeof window !== "undefined") {
      const db = window.indexedDB.open("forms-offline", 1);
      db.onsuccess = (event) => {
        const database = (event.target as any).result;
        const transaction = database.transaction(["states"], "readwrite");
        const store = transaction.objectStore("states");
        store.clear();
      };
    }
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No form loaded</h3>
          <p className="text-muted-foreground">Please open this preview from the form builder</p>
        </div>
      </div>
    );
  }

  if (submissionData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-2xl w-full">
          <div className="bg-card rounded-lg p-8 shadow-lg">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Thank You!</h2>
            <p className="text-center text-muted-foreground mb-8">
              Your response has been recorded.
            </p>

            <div className="bg-muted rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-3">Submission Data (Preview Only):</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Form ID:</span> {submissionData.formId}
                </div>
                <div>
                  <span className="font-medium">Started at:</span>{" "}
                  {new Date(submissionData.startedAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Completed at:</span>{" "}
                  {new Date(submissionData.completedAt).toLocaleString()}
                </div>
                {submissionData.metadata?.completionTime && (
                  <div>
                    <span className="font-medium">Completion time:</span>{" "}
                    {(submissionData.metadata.completionTime / 1000).toFixed(1)}s
                  </div>
                )}
                <div className="mt-4">
                  <span className="font-medium">Values:</span>
                  <pre className="mt-2 p-3 bg-background rounded text-xs overflow-auto">
                    {JSON.stringify(submissionData.values, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Submit Another Response
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert form to FormSchema format expected by runtime
  const formSchema = {
    id: form.id,
    title: form.title,
    description: form.description,
    blocks: form.pages.flatMap((page) =>
      page.blocks.map((block) => ({
        ...block,
        question: block.question || "",
        type: block.type,
        label: block.label || block.question,
      }))
    ),
    theme: form.theme,
    logic: form.logic?.rules || [],
    settings: form.settings,
  } as FormSchema;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <FormRenderer
        schema={formSchema}
        config={{
          formId: form.id,
          apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
          onSubmit: handleSubmit,
          enableOffline: true,
          enableAnalytics: false, // Disable analytics for preview
          enableAntiSpam: false, // Disable anti-spam for preview
        }}
      />
    </div>
  );
}
