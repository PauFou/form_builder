"use client";

import React from "react";
import { FormViewerWrapper } from "@skemya/runtime";
import type { FormSchema, RuntimeConfig } from "@skemya/runtime";

export default function GridModeDemo() {
  const demoSchema: FormSchema = {
    id: "demo-grid-form",
    title: "Grid Mode Demo Form",
    pages: [
      {
        id: "personal-info",
        blocks: [
          {
            id: "first_name",
            type: "text",
            question: "First Name",
            placeholder: "Enter your first name",
            required: true,
          },
          {
            id: "last_name",
            type: "text",
            question: "Last Name",
            placeholder: "Enter your last name",
            required: true,
          },
          {
            id: "email",
            type: "email",
            question: "Email Address",
            description: "We'll never share your email with anyone else.",
            placeholder: "john.doe@example.com",
            required: true,
          },
          {
            id: "phone",
            type: "phone",
            question: "Phone Number",
            placeholder: "+1 (555) 123-4567",
            required: false,
          },
        ],
      },
      {
        id: "preferences",
        blocks: [
          {
            id: "experience",
            type: "rating",
            question: "Rate your experience with forms",
            description: "1 being poor, 5 being excellent",
            properties: {
              max: 5,
            },
            required: true,
          },
          {
            id: "favorite_features",
            type: "checkboxGroup",
            question: "What features do you like?",
            properties: {
              options: [
                "Grid Mode",
                "One Question Mode",
                "Progress Bar",
                "Auto-save",
                "Offline Support",
              ],
            },
            required: false,
          },
          {
            id: "feedback",
            type: "long_text",
            question: "Additional Feedback",
            description: "Tell us what you think about the new Grid mode",
            placeholder: "Your feedback helps us improve...",
            properties: {
              rows: 5,
            },
            required: false,
          },
        ],
      },
    ],
    settings: {
      showProgressBar: true,
      submitText: "Submit Feedback",
      thankYouMessage:
        "<h2>Thank you for your feedback!</h2><p>We appreciate your time and input. Your responses have been recorded successfully.</p>",
      displayMode: "grid",
      allowModeSwitch: true,
    },
    theme: {
      primaryColor: "#4F46E5",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "8px",
    },
  };

  const config: RuntimeConfig = {
    formId: "demo-grid-form",
    apiUrl: "/api",
    enableOffline: true,
    enableAnalytics: true,
    onSubmit: async (data: any) => {
      console.log("Form submitted:", data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Submission successful!");
    },
    onPartialSave: (data: any) => {
      console.log("Partial save:", data);
    },
    onError: (error: any) => {
      console.error("Form error:", error);
      alert("There was an error submitting the form. Please try again.");
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Grid Mode Demo</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the new Grid mode that shows multiple fields on one page. Switch between Grid
            and One-Question modes using the toggle below.
          </p>
        </div>

        <FormViewerWrapper schema={demoSchema} config={config} className="max-w-3xl mx-auto" />

        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Features Demonstrated:</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Grid mode showing multiple fields per page</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Mode switcher to toggle between Grid and One-Question views</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Multi-page forms with smooth navigation</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Progress bar showing completion percentage</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Field validation with error messages</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Accessible form with proper ARIA labels</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Offline support with auto-save</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Smooth animations and transitions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
