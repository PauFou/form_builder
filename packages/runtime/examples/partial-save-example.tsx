import React, { useState, useEffect } from "react";
import {
  SaveStatus,
  ResumeBanner,
  useFormRuntime,
  type FormSchema,
  type RuntimeConfig,
} from "../src";

// Example form schema
const formSchema: FormSchema = {
  id: "example-form",
  title: "User Feedback Form",
  pages: [
    {
      id: "page-1",
      blocks: [
        {
          id: "name",
          type: "text",
          question: "What's your name?",
          required: true,
          placeholder: "John Doe",
        },
        {
          id: "email",
          type: "email",
          question: "What's your email?",
          required: true,
          placeholder: "john@example.com",
        },
      ],
    },
    {
      id: "page-2",
      blocks: [
        {
          id: "rating",
          type: "rating",
          question: "How would you rate our service?",
          required: true,
          properties: {
            max: 5,
          },
        },
        {
          id: "feedback",
          type: "long_text",
          question: "Any additional feedback?",
          placeholder: "Tell us what you think...",
        },
      ],
    },
  ],
  settings: {
    showProgressBar: true,
    allowSave: true,
    submitText: "Submit Feedback",
    thankYouMessage: "<h2>Thank you for your feedback!</h2><p>We appreciate your time.</p>",
  },
};

export function PartialSaveExample() {
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);

  // Configuration for the form runtime
  const config: RuntimeConfig = {
    formId: "example-form",
    apiUrl: "https://api.example.com/forms",
    enableOffline: true,
    autoSaveInterval: 5000, // Save every 5 seconds
    onSubmit: async (data) => {
      console.log("Form submitted:", data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Form submitted successfully!");
    },
    onPartialSave: async (data) => {
      console.log("Partial save:", data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onError: (error) => {
      console.error("Form error:", error);
      alert("An error occurred. Please try again.");
    },
  };

  // Use the form runtime hook
  const {
    state,
    currentBlock,
    visibleBlocks,
    progress,
    setValue,
    setTouched,
    goNext,
    goPrev,
    submit,
    canGoNext,
    hasUnsyncedData,
    isOnline,
    isSaving,
    getResumeUrl,
  } = useFormRuntime(formSchema, config);

  // Check for saved data on mount
  useEffect(() => {
    const checkForSavedData = async () => {
      // This would be handled by the partial save service
      // Just simulating the check here
      const hasSaved = localStorage.getItem(
        `form-partial-${config.formId}-${config.respondentKey || "anon"}`
      );
      if (hasSaved) {
        setShowResumeBanner(true);
        setSavedData(JSON.parse(hasSaved));
      }
    };

    checkForSavedData();
  }, [config.formId, config.respondentKey]);

  // Handle resume
  const handleResume = () => {
    // The useFormRuntime hook already loads saved data
    setShowResumeBanner(false);
  };

  // Handle start fresh
  const handleStartFresh = async () => {
    // Clear saved data
    localStorage.removeItem(`form-partial-${config.formId}-${config.respondentKey || "anon"}`);
    setShowResumeBanner(false);
    window.location.reload(); // Reload to start fresh
  };

  // Show completion screen
  if (state.isComplete) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "3rem",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          dangerouslySetInnerHTML={{ __html: formSchema.settings?.thankYouMessage || "" }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      {/* Resume banner */}
      {showResumeBanner && savedData && (
        <ResumeBanner
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          lastUpdated={savedData.savedAt ? new Date(savedData.savedAt) : undefined}
          progress={savedData.progress}
        />
      )}

      {/* Form container */}
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Save status */}
        <div style={{ marginBottom: "1rem" }}>
          <SaveStatus
            isSaving={isSaving}
            hasUnsyncedData={hasUnsyncedData}
            isOnline={isOnline}
            resumeUrl={getResumeUrl()}
          />
        </div>

        {/* Progress bar */}
        {formSchema.settings?.showProgressBar && (
          <div
            style={{
              marginBottom: "2rem",
              background: "#e5e7eb",
              borderRadius: "9999px",
              height: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#4F46E5",
                height: "100%",
                width: `${progress}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}

        {/* Current block */}
        {currentBlock && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{currentBlock.question}</h2>
            {currentBlock.description && (
              <p style={{ color: "#6B7280", marginBottom: "1rem" }}>{currentBlock.description}</p>
            )}

            {/* Render appropriate input based on block type */}
            {currentBlock.type === "text" && (
              <input
                type="text"
                value={state.values[currentBlock.id] || ""}
                onChange={(e) => setValue(currentBlock.id, e.target.value)}
                onBlur={() => setTouched(currentBlock.id)}
                placeholder={currentBlock.placeholder}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #D1D5DB",
                  borderRadius: "0.375rem",
                  fontSize: "1rem",
                }}
              />
            )}

            {currentBlock.type === "email" && (
              <input
                type="email"
                value={state.values[currentBlock.id] || ""}
                onChange={(e) => setValue(currentBlock.id, e.target.value)}
                onBlur={() => setTouched(currentBlock.id)}
                placeholder={currentBlock.placeholder}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #D1D5DB",
                  borderRadius: "0.375rem",
                  fontSize: "1rem",
                }}
              />
            )}

            {currentBlock.type === "rating" && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setValue(currentBlock.id, rating)}
                    style={{
                      width: "3rem",
                      height: "3rem",
                      borderRadius: "0.375rem",
                      border: "1px solid",
                      borderColor: state.values[currentBlock.id] === rating ? "#4F46E5" : "#D1D5DB",
                      background: state.values[currentBlock.id] === rating ? "#4F46E5" : "white",
                      color: state.values[currentBlock.id] === rating ? "white" : "#374151",
                      fontSize: "1.125rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            )}

            {currentBlock.type === "long_text" && (
              <textarea
                value={state.values[currentBlock.id] || ""}
                onChange={(e) => setValue(currentBlock.id, e.target.value)}
                onBlur={() => setTouched(currentBlock.id)}
                placeholder={currentBlock.placeholder}
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #D1D5DB",
                  borderRadius: "0.375rem",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
              />
            )}

            {/* Error message */}
            {state.errors[currentBlock.id] && state.touched[currentBlock.id] && (
              <p style={{ color: "#EF4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                {state.errors[currentBlock.id]}
              </p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={goPrev}
            disabled={state.currentStep === 0}
            style={{
              padding: "0.75rem 1.5rem",
              background: state.currentStep === 0 ? "#E5E7EB" : "white",
              color: state.currentStep === 0 ? "#9CA3AF" : "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "0.375rem",
              cursor: state.currentStep === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Previous
          </button>

          {state.currentStep < visibleBlocks.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext()}
              style={{
                padding: "0.75rem 1.5rem",
                background: canGoNext() ? "#4F46E5" : "#E5E7EB",
                color: canGoNext() ? "white" : "#9CA3AF",
                border: "none",
                borderRadius: "0.375rem",
                cursor: canGoNext() ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={state.isSubmitting || !canGoNext()}
              style={{
                padding: "0.75rem 1.5rem",
                background: state.isSubmitting || !canGoNext() ? "#E5E7EB" : "#10B981",
                color: state.isSubmitting || !canGoNext() ? "#9CA3AF" : "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: state.isSubmitting || !canGoNext() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {state.isSubmitting ? "Submitting..." : formSchema.settings?.submitText || "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
