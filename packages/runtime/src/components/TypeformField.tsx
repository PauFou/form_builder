import React, { memo, useCallback, useState } from "react";
import type { Block, FieldValue } from "../types";

interface TypeformFieldProps {
  block: Block;
  value: FieldValue;
  error?: string;
  touched?: boolean;
  onChange: (value: FieldValue) => void;
  onBlur: () => void;
}

export const TypeformField = memo(function TypeformField({
  block,
  value,
  error,
  touched,
  onChange,
  onBlur,
}: TypeformFieldProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue =
        e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      onChange(newValue);
    },
    [onChange]
  );

  const handleFocus = () => setFocused(true);
  const handleBlur = () => {
    setFocused(false);
    onBlur();
  };

  const renderInput = () => {
    const baseProps = {
      id: block.id,
      name: block.id,
      "aria-label": block.question,
      "aria-describedby": block.description ? `${block.id}-desc` : undefined,
      "aria-invalid": !!(touched && error),
      "aria-required": block.required,
      onFocus: handleFocus,
      onBlur: handleBlur,
    };

    switch (block.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <input
            {...baseProps}
            type={block.type === "text" ? "text" : block.type === "phone" ? "tel" : block.type}
            value={typeof value === "string" ? value : value?.toString() || ""}
            onChange={handleChange}
            className="typeform-input"
            placeholder={String(block.properties?.placeholder || "Type your answer here...")}
            autoComplete={block.type === "email" ? "email" : block.type === "phone" ? "tel" : "off"}
          />
        );

      case "number":
        return (
          <input
            {...baseProps}
            type="number"
            value={typeof value === "string" ? value : value?.toString() || ""}
            onChange={handleChange}
            className="typeform-input"
            placeholder={String(block.properties?.placeholder || "Type your answer here...")}
            min={block.properties?.min}
            max={block.properties?.max}
            step={block.properties?.step}
          />
        );

      case "long_text":
        return (
          <textarea
            {...baseProps}
            value={typeof value === "string" ? value : value?.toString() || ""}
            onChange={handleChange}
            className="typeform-textarea"
            rows={4}
            placeholder={String(block.properties?.placeholder || "Type your answer here...")}
          />
        );

      case "select":
      case "dropdown":
        return (
          <div className="typeform-select-wrapper">
            <select
              {...baseProps}
              value={typeof value === "string" ? value : value?.toString() || ""}
              onChange={handleChange}
              className="typeform-select"
            >
              <option value="">Choose an option...</option>
              {block.options?.map((option) => (
                <option key={option.id} value={option.value || option.text}>
                  {option.text}
                </option>
              ))}
            </select>
            <svg className="typeform-select-arrow" viewBox="0 0 24 24">
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );

      case "checkboxGroup":
        return (
          <div
            className="typeform-checkbox-group"
            role="group"
            aria-labelledby={`${block.id}-label`}
          >
            {block.options?.map((option, index) => {
              const optionValue = option.value || option.text;
              return (
                <label key={option.id} className="typeform-checkbox-label">
                  <input
                    type="checkbox"
                    name={`${block.id}[]`}
                    value={optionValue}
                    checked={Array.isArray(value) && value.includes(optionValue)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValue = e.target.checked
                        ? [...currentValues, optionValue]
                        : currentValues.filter((v) => v !== optionValue);
                      onChange(newValue);
                    }}
                    onBlur={onBlur}
                    className="typeform-checkbox-input"
                  />
                  <span className="typeform-checkbox-custom">
                    <span className="typeform-checkbox-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option.text}
                    <svg className="typeform-checkbox-check" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </label>
              );
            })}
          </div>
        );

      case "checkbox":
        return (
          <div className="typeform-boolean">
            <label className="typeform-toggle">
              <input
                {...baseProps}
                type="checkbox"
                checked={!!value}
                onChange={handleChange}
                className="typeform-toggle-input"
              />
              <span className="typeform-toggle-track">
                <span className="typeform-toggle-thumb" />
              </span>
              <span className="typeform-toggle-label">{value ? "Yes" : "No"}</span>
            </label>
          </div>
        );

      case "rating": {
        const maxRating = block.properties?.max || 5;
        return (
          <div className="typeform-rating" role="radiogroup" aria-labelledby={`${block.id}-label`}>
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                className={`typeform-rating-star ${typeof value === "number" && value >= rating ? "active" : ""}`}
                onClick={() => onChange(rating)}
                onBlur={onBlur}
                aria-label={`${rating} out of ${maxRating}`}
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill={typeof value === "number" && value >= rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        );
      }

      case "scale": {
        const min = block.properties?.min || 1;
        const max = block.properties?.max || 10;
        const scalePoints = Array.from({ length: max - min + 1 }, (_, i) => min + i);

        return (
          <div className="typeform-scale">
            <div className="typeform-scale-labels">
              <span className="typeform-scale-label-min">
                {String(block.properties?.minLabel || min)}
              </span>
              <span className="typeform-scale-label-max">
                {String(block.properties?.maxLabel || max)}
              </span>
            </div>
            <div className="typeform-scale-options">
              {scalePoints.map((point) => (
                <button
                  key={point}
                  type="button"
                  className={`typeform-scale-option ${value === point ? "active" : ""}`}
                  onClick={() => onChange(point)}
                  onBlur={onBlur}
                >
                  {point}
                </button>
              ))}
            </div>
          </div>
        );
      }

      case "date":
        return (
          <input
            {...baseProps}
            type="date"
            value={typeof value === "string" ? value : value?.toString() || ""}
            onChange={handleChange}
            className="typeform-input typeform-date-input"
            min={block.properties?.min}
            max={block.properties?.max}
          />
        );

      case "time":
        return (
          <input
            {...baseProps}
            type="time"
            value={typeof value === "string" ? value : value?.toString() || ""}
            onChange={handleChange}
            className="typeform-input typeform-time-input"
          />
        );

      default:
        return (
          <input
            {...baseProps}
            type="text"
            value={typeof value === "string" ? value : value?.toString() || ""}
            onChange={handleChange}
            className="typeform-input"
            placeholder="Type your answer here..."
          />
        );
    }
  };

  return (
    <div
      className={`typeform-field ${focused ? "typeform-field-focused" : ""}`}
      data-type={block.type}
    >
      {renderInput()}
    </div>
  );
});
