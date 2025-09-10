import type { Theme } from "./types";

export function generateStyles(theme?: Theme): string {
  const vars = theme
    ? `
    --fr-primary: ${theme.primaryColor || "#4F46E5"};
    --fr-font: ${theme.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
    --fr-radius: ${theme.borderRadius || "6px"};
    --fr-spacing: ${theme.spacing || "1rem"};
  `
    : "";

  return `
    .fr-container {
      ${vars}
      font-family: var(--fr-font);
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: var(--fr-spacing);
    }

    .fr-progress {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      margin-bottom: calc(var(--fr-spacing) * 2);
      overflow: hidden;
    }

    .fr-progress-fill {
      height: 100%;
      background: var(--fr-primary);
      transition: width 0.3s ease;
    }

    .fr-form {
      animation: fr-fade-in 0.3s ease;
    }

    .fr-field {
      margin-bottom: calc(var(--fr-spacing) * 1.5);
    }

    .fr-label {
      display: block;
      font-weight: 500;
      margin-bottom: calc(var(--fr-spacing) * 0.5);
    }

    .fr-required {
      color: #dc2626;
      margin-left: 4px;
    }

    .fr-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: calc(var(--fr-spacing) * 0.5);
    }

    .fr-input,
    .fr-textarea,
    .fr-select {
      width: 100%;
      padding: calc(var(--fr-spacing) * 0.5) calc(var(--fr-spacing) * 0.75);
      border: 1px solid #d1d5db;
      border-radius: var(--fr-radius);
      font-size: 1rem;
      font-family: var(--fr-font);
      transition: border-color 0.2s;
    }

    .fr-input:focus,
    .fr-textarea:focus,
    .fr-select:focus {
      outline: none;
      border-color: var(--fr-primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .fr-field[data-error="true"] .fr-input,
    .fr-field[data-error="true"] .fr-textarea,
    .fr-field[data-error="true"] .fr-select {
      border-color: #dc2626;
    }

    .fr-error {
      font-size: 0.875rem;
      color: #dc2626;
      margin-top: calc(var(--fr-spacing) * 0.25);
    }

    .fr-checkbox-group {
      display: flex;
      flex-direction: column;
      gap: calc(var(--fr-spacing) * 0.5);
    }

    .fr-checkbox-label {
      display: flex;
      align-items: center;
      gap: calc(var(--fr-spacing) * 0.5);
      cursor: pointer;
    }

    .fr-checkbox-label input {
      width: 1.25rem;
      height: 1.25rem;
      cursor: pointer;
    }

    .fr-rating {
      display: flex;
      gap: calc(var(--fr-spacing) * 0.25);
    }

    .fr-rating-star {
      font-size: 1.5rem;
      color: #d1d5db;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }

    .fr-rating-star:hover,
    .fr-rating-star.active {
      color: #fbbf24;
    }

    .fr-actions {
      display: flex;
      gap: var(--fr-spacing);
      margin-top: calc(var(--fr-spacing) * 2);
    }

    .fr-btn {
      padding: calc(var(--fr-spacing) * 0.5) calc(var(--fr-spacing) * 1.5);
      border: none;
      border-radius: var(--fr-radius);
      font-size: 1rem;
      font-weight: 500;
      font-family: var(--fr-font);
      cursor: pointer;
      transition: all 0.2s;
    }

    .fr-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .fr-btn-primary {
      background: var(--fr-primary);
      color: white;
    }

    .fr-btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .fr-btn-secondary {
      background: #e5e7eb;
      color: #374151;
    }

    .fr-btn-secondary:hover:not(:disabled) {
      background: #d1d5db;
    }

    .fr-complete {
      text-align: center;
      padding: calc(var(--fr-spacing) * 3);
    }

    .fr-complete h2 {
      font-size: 1.875rem;
      margin-bottom: var(--fr-spacing);
    }

    .fr-offline-notice {
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
      margin-top: var(--fr-spacing);
    }

    @keyframes fr-fade-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 640px) {
      .fr-container {
        padding: calc(var(--fr-spacing) * 0.75);
      }

      .fr-actions {
        flex-direction: column;
      }

      .fr-btn {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .fr-form,
      .fr-progress-fill,
      .fr-rating-star {
        animation: none;
        transition: none;
      }
    }
  `.trim();
}

// Inject styles function for runtime
export function injectStyles(theme?: Theme): void {
  if (typeof document === "undefined") return;

  const styleId = "form-runtime-styles";

  // Remove existing styles if any
  const existing = document.getElementById(styleId);
  if (existing) {
    existing.remove();
  }

  // Create and inject new styles
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = generateStyles(theme);
  document.head.appendChild(style);
}
