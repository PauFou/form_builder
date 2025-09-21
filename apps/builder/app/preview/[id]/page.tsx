"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FormRenderer, type FormSchema } from "@skemya/runtime";
import { formsApi } from "../../../lib/api/forms";
import { DEMO_FORMS } from "../../../lib/demo-forms";

// Import the runtime styles
import "@skemya/runtime/styles";

export default function PreviewPage() {
  const params = useParams();
  const formId = params.id as string;
  const [submissionData, setSubmissionData] = useState<any>(null);

  // Fetch form data from API or use demo form
  const {
    data: form,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["form", formId, "preview"],
    queryFn: async () => {
      // Check if it's a demo form first
      if (DEMO_FORMS[formId]) {
        return DEMO_FORMS[formId];
      }
      return formsApi.get(formId);
    },
  });

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

  if (isLoading) {
    return (
      <div className="typeform-container">
        <div className="typeform-content">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-700 mx-auto mb-4" />
          <p className="text-gray-600 text-center">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="typeform-container">
        <div className="typeform-content">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Form not found</h3>
            <p className="text-gray-600">Please check if the form exists and try again</p>
          </div>
        </div>
      </div>
    );
  }

  if (submissionData) {
    return (
      <div className="typeform-container">
        <div className="typeform-content typeform-complete">
          <div className="typeform-checkmark">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" stroke="#27ae60" strokeWidth="2" />
              <path fill="none" stroke="#27ae60" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>

          <h1 className="typeform-thank-you-title">All done! 🎉</h1>
          <p className="typeform-thank-you-subtitle">
            Thanks for completing this form. Your response has been recorded.
          </p>

          {/* Debug info for preview */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg max-w-2xl">
            <h3 className="font-semibold mb-3 text-gray-700">Preview Data (Debug Info):</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Form ID:</span> {submissionData.formId}
              </div>
              <div>
                <span className="font-medium text-gray-600">Started at:</span>{" "}
                {new Date(submissionData.startedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-600">Completed at:</span>{" "}
                {new Date(submissionData.completedAt).toLocaleString()}
              </div>
              {submissionData.metadata?.completionTime && (
                <div>
                  <span className="font-medium text-gray-600">Completion time:</span>{" "}
                  {(submissionData.metadata.completionTime / 1000).toFixed(1)}s
                </div>
              )}
              <div className="mt-4">
                <span className="font-medium text-gray-600">Responses:</span>
                <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto border">
                  {JSON.stringify(submissionData.values, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  // Convert form to FormSchema format expected by runtime
  const formSchema: FormSchema = {
    id: form.id,
    title: form.title,
    description: form.description,
    blocks: form.pages.flatMap((page: any) =>
      page.blocks.map((block: any) => ({
        ...block,
        question: block.question || "",
        type: block.type,
        label: block.label || block.question,
        options: block.options || block.properties?.options,
        properties: {
          ...block.properties,
          placeholder: block.placeholder,
        },
      }))
    ),
    theme: typeof form.theme === "string" ? { primaryColor: form.theme } : form.theme,
    logic: (form.logic?.rules || []) as any,
    settings: {
      ...form.settings,
      showProgressBar: true,
      submitText: "Submit",
      thankYouMessage: form.settings?.thankYouMessage,
    },
  };

  return (
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
  );
}
