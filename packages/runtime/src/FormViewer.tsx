import React, { useState } from "react";
import { FormSchema, Block, FieldValue } from "./types";

export interface FormViewerProps {
  schema: FormSchema;
  config: {
    formId: string;
    apiUrl?: string;
    enableOffline?: boolean;
    autoSaveInterval?: number;
    onSubmit: (data: Record<string, FieldValue>) => Promise<void>;
    onPartialSave?: (data: Record<string, FieldValue>) => void;
    onError?: (error: Error) => void;
  };
}

export function FormViewer({ schema, config }: FormViewerProps) {
  const [formData, setFormData] = useState<Record<string, FieldValue>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all blocks from all pages
  const allBlocks = schema.pages?.flatMap((page) => page.blocks || []) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await config.onSubmit(formData);
      setCurrentStep(allBlocks.length); // Show thank you
    } catch (error) {
      config.onError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (blockId: string, value: FieldValue) => {
    setFormData((prev) => ({ ...prev, [blockId]: value }));
    config.onPartialSave?.({ ...formData, [blockId]: value });
  };

  // Show thank you message after submission
  if (currentStep >= allBlocks.length) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2rem",
          background: "white",
          borderRadius: schema.theme?.borderRadius || "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: schema.settings?.thankYouMessage || "<h2>Thank you!</h2>",
          }}
        />
      </div>
    );
  }

  const currentBlock = allBlocks[currentStep];

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "2rem",
        background: "white",
        borderRadius: schema.theme?.borderRadius || "8px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Progress bar */}
      {schema.settings?.showProgressBar && (
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
              background: schema.theme?.primaryColor || "#4F46E5",
              height: "100%",
              width: `${((currentStep + 1) / allBlocks.length) * 100}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Question */}
      <h2 style={{ marginBottom: "0.5rem" }}>{currentBlock.question}</h2>
      {currentBlock.description && (
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{currentBlock.description}</p>
      )}

      {/* Input field */}
      {renderField(currentBlock, formData[currentBlock.id], (value) =>
        handleChange(currentBlock.id, value)
      )}

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "2rem",
          gap: "1rem",
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 0}
          style={{
            padding: "0.75rem 1.5rem",
            border: `1px solid ${schema.theme?.primaryColor || "#4F46E5"}`,
            background: "white",
            color: schema.theme?.primaryColor || "#4F46E5",
            borderRadius: schema.theme?.borderRadius || "8px",
            cursor: currentStep === 0 ? "not-allowed" : "pointer",
            opacity: currentStep === 0 ? 0.5 : 1,
          }}
        >
          Previous
        </button>

        {currentStep < allBlocks.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev + 1)}
            style={{
              padding: "0.75rem 1.5rem",
              background: schema.theme?.primaryColor || "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: schema.theme?.borderRadius || "8px",
              cursor: "pointer",
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "0.75rem 1.5rem",
              background: schema.theme?.primaryColor || "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: schema.theme?.borderRadius || "8px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Submitting..." : schema.settings?.submitText || "Submit"}
          </button>
        )}
      </div>
    </form>
  );
}

function renderField(block: Block, value: FieldValue, onChange: (value: FieldValue) => void) {
  const baseStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "1rem",
  };

  switch (block.type) {
    case "text":
    case "email":
      return (
        <input
          type={block.type}
          value={typeof value === "string" ? value : value?.toString() || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={block.properties?.placeholder as string | undefined}
          required={block.required}
          style={baseStyle}
        />
      );

    case "long_text":
      return (
        <textarea
          value={typeof value === "string" ? value : value?.toString() || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={block.properties?.placeholder as string | undefined}
          rows={(block.properties?.rows as number) || 4}
          required={block.required}
          style={baseStyle}
        />
      );

    case "dropdown":
      return (
        <select
          value={typeof value === "string" ? value : value?.toString() || ""}
          onChange={(e) => onChange(e.target.value)}
          required={block.required}
          style={baseStyle}
        >
          <option value="">Choose an option...</option>
          {(block.properties?.options as string[] | undefined)?.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "rating":
      return (
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "2rem" }}>
          {Array.from({ length: block.properties?.max || 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "2rem",
                color: typeof value === "number" && value > i ? "#f59e0b" : "#d1d5db",
                transition: "color 0.2s",
              }}
            >
              ★
            </button>
          ))}
        </div>
      );

    default:
      return <div>Unsupported field type: {block.type}</div>;
  }
}
