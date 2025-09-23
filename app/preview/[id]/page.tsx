"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";
import { formsApi } from "../../../lib/api/forms";
import type { Form } from "@skemya/contracts";

// Dynamically import viewers to prevent SSR issues
const OneQuestionViewer = dynamic(
  () => import("@skemya/runtime").then((mod) => mod.OneQuestionViewer),
  { ssr: false }
);

const FormViewer = dynamic(() => import("@skemya/runtime").then((mod) => mod.FormViewer), {
  ssr: false,
});

export default function PreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params.id as string;
  const mode = searchParams.get("mode") || "one-question";
  const version = searchParams.get("version");

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const response = await formsApi.get(formId, { version });
        setForm(response.data);
      } catch (error) {
        console.error("Failed to load form:", error);
        toast.error("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      loadForm();
    }
  }, [formId, version]);

  const handleSubmit = async (data: any) => {
    console.log("Form submitted:", data);
    setSubmitted(true);
    toast.success("Form submitted successfully!");
  };

  const handlePartialSave = (data: any) => {
    console.log("Partial save:", data);
    // In production, this would save to API
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Form not found</h1>
          <p className="text-gray-600">The form you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-4">Thank you!</h1>
          <p className="text-gray-600 mb-8">
            Your response has been recorded. We appreciate your time.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mode Switcher (for preview only) */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 flex gap-2">
        <button
          onClick={() => (window.location.href = `/preview/${formId}?mode=one-question`)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "one-question" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          One Question
        </button>
        <button
          onClick={() => (window.location.href = `/preview/${formId}?mode=grid`)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "grid" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Grid View
        </button>
      </div>

      {/* Form Viewer */}
      {mode === "one-question" ? (
        <OneQuestionViewer
          form={form}
          onSubmit={handleSubmit}
          onPartialSave={handlePartialSave}
          className="bg-white"
        />
      ) : (
        <div className="container max-w-3xl mx-auto py-12 px-4">
          <FormViewer form={form} onSubmit={handleSubmit} onPartialSave={handlePartialSave} />
        </div>
      )}
    </div>
  );
}
