import React, { memo, useCallback } from "react";
import type { Block } from "../types";

interface FormFieldProps {
  block: Block;
  value: any;
  error?: string;
  touched?: boolean;
  onChange: (value: any) => void;
  onBlur: () => void;
}

export const FormField = memo(function FormField({
  block,
  value,
  error,
  touched,
  onChange,
  onBlur,
}: FormFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue =
        e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      onChange(newValue);
    },
    [onChange]
  );

  const renderInput = () => {
    const baseProps = {
      id: block.id,
      name: block.id,
      "aria-label": block.question,
      "aria-describedby": block.description ? `${block.id}-desc` : undefined,
      "aria-invalid": !!(touched && error),
      "aria-required": block.required,
      onBlur,
    };

    switch (block.type) {
      case "text":
      case "email":
      case "phone":
      case "number":
        return (
          <input
            {...baseProps}
            type={block.type === "number" ? "number" : block.type}
            value={value || ""}
            onChange={handleChange}
            className="fr-input"
            placeholder={block.properties?.placeholder}
          />
        );

      case "long_text":
        return (
          <textarea
            {...baseProps}
            value={value || ""}
            onChange={handleChange}
            className="fr-textarea"
            rows={block.properties?.rows || 4}
            placeholder={block.properties?.placeholder}
          />
        );

      case "dropdown":
      case "select":
        return (
          <select {...baseProps} value={value || ""} onChange={handleChange} className="fr-select">
            <option value="">Choose an option</option>
            {block.properties?.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "checkboxGroup":
        return (
          <div className="fr-checkbox-group" role="group" aria-labelledby={`${block.id}-label`}>
            {block.properties?.options?.map((option: string) => (
              <label key={option} className="fr-checkbox-label">
                <input
                  type="checkbox"
                  name={`${block.id}[]`}
                  value={option}
                  checked={Array.isArray(value) && (value as string[]).includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValue = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v) => v !== option);
                    onChange(newValue);
                  }}
                  onBlur={onBlur}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="fr-checkbox-label">
            <input {...baseProps} type="checkbox" checked={!!value} onChange={handleChange} />
            <span>{block.properties?.label || "Check this box"}</span>
          </label>
        );

      case "rating": {
        const maxRating = block.properties?.max || 5;
        return (
          <div className="fr-rating" role="radiogroup" aria-labelledby={`${block.id}-label`}>
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                className={`fr-rating-star ${value >= rating ? "active" : ""}`}
                onClick={() => onChange(rating)}
                onBlur={onBlur}
                aria-label={`${rating} out of ${maxRating}`}
              >
                ★
              </button>
            ))}
          </div>
        );
      }

      case "date":
        return (
          <input
            {...baseProps}
            type="date"
            value={value || ""}
            onChange={handleChange}
            className="fr-input"
            min={block.properties?.min}
            max={block.properties?.max}
          />
        );

      default:
        return (
          <input
            {...baseProps}
            type="text"
            value={value || ""}
            onChange={handleChange}
            className="fr-input"
          />
        );
    }
  };

  return (
    <div className="fr-field" data-error={!!(touched && error)}>
      <label id={`${block.id}-label`} htmlFor={block.id} className="fr-label">
        {block.question}
        {block.required && (
          <span className="fr-required" aria-label="required">
            *
          </span>
        )}
      </label>

      {block.description && (
        <p id={`${block.id}-desc`} className="fr-description">
          {block.description}
        </p>
      )}

      {renderInput()}

      {touched && error && (
        <p className="fr-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
