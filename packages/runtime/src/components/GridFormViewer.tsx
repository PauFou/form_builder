import React, { useEffect, useRef, useState } from "react";
import { FormField } from "./FormField";
import { ProgressBar } from "./ProgressBar";
import { useFormRuntime } from "../hooks";
import type { FormSchema, RuntimeConfig } from "../types";

interface GridFormViewerProps {
  schema: FormSchema;
  config: RuntimeConfig;
  className?: string;
}

export function GridFormViewer({ schema, config, className = "" }: GridFormViewerProps) {
  const {
    state,
    visibleBlocks,
    progress,
    setValue,
    setTouched,
    goNext,
    goPrev,
    submit,
    validate,
    hasUnsyncedData,
    isOnline,
  } = useFormRuntime(schema, config);

  const formRef = useRef<HTMLFormElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageErrors, setPageErrors] = useState<Record<string, string>>({});

  // Group blocks by page
  const pages = schema.pages || [{ id: "default", blocks: visibleBlocks }];
  const currentPageData = pages[currentPage];
  const currentPageBlocks = currentPageData?.blocks || [];
  
  // Calculate total pages considering visible blocks
  const totalPages = pages.length;
  const isLastPage = currentPage === totalPages - 1;

  // Focus first field on page change
  useEffect(() => {
    if (formRef.current && currentPageBlocks.length > 0) {
      const timer = setTimeout(() => {
        const firstField = formRef.current?.querySelector<HTMLElement>(
          `#${currentPageBlocks[0].id}, [name="${currentPageBlocks[0].id}"]`
        );
        if (firstField) {
          firstField.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentPage, currentPageBlocks]);

  const validateCurrentPage = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    currentPageBlocks.forEach((block) => {
      if (block.required && !state.values[block.id]) {
        errors[block.id] = `${block.question} is required`;
        isValid = false;
      }
      // Add more validation as needed based on block.validation rules
    });

    setPageErrors(errors);
    return isValid;
  };

  const handleNextPage = () => {
    if (!validateCurrentPage()) {
      // Mark all fields on current page as touched to show errors
      currentPageBlocks.forEach((block) => {
        setTouched(block.id);
      });
      return;
    }

    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setPageErrors({});
      // Scroll to top of form
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setPageErrors({});
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentPage()) {
      currentPageBlocks.forEach((block) => {
        setTouched(block.id);
      });
      return;
    }

    // Validate all pages before submission
    const allValid = validate();
    if (!allValid) {
      // Find first page with error and navigate to it
      for (let i = 0; i < pages.length; i++) {
        const pageBlocks = pages[i].blocks || [];
        const hasError = pageBlocks.some((block) => state.errors[block.id]);
        if (hasError) {
          setCurrentPage(i);
          break;
        }
      }
      return;
    }

    await submit();
  };

  if (state.isComplete) {
    return (
      <div className={`fr-container ${className}`}>
        <div className="fr-complete">
          {schema.settings?.thankYouMessage ? (
            <div dangerouslySetInnerHTML={{ __html: schema.settings.thankYouMessage }} />
          ) : (
            <>
              <h2>Thank you!</h2>
              <p>Your response has been submitted successfully.</p>
            </>
          )}
          {schema.settings?.redirectUrl && <p>Redirecting...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`fr-container fr-grid-mode ${className}`} data-theme={schema.theme}>
      {schema.settings?.showProgressBar && (
        <div className="fr-progress-wrapper">
          <ProgressBar progress={(currentPage / totalPages) * 100} />
          <div className="fr-page-indicator">
            Page {currentPage + 1} of {totalPages}
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="fr-form fr-form-grid">
        <div className="fr-grid-fields">
          {currentPageBlocks.map((block, index) => (
            <div
              key={block.id}
              className={`fr-grid-field-wrapper ${
                state.errors[block.id] || pageErrors[block.id] ? "fr-field-error" : ""
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <FormField
                block={block}
                value={state.values[block.id]}
                error={state.errors[block.id] || pageErrors[block.id]}
                touched={state.touched[block.id]}
                onChange={(value) => {
                  setValue(block.id, value);
                  // Clear page error when user starts typing
                  if (pageErrors[block.id]) {
                    setPageErrors((prev) => {
                      const next = { ...prev };
                      delete next[block.id];
                      return next;
                    });
                  }
                }}
                onBlur={() => setTouched(block.id)}
              />
            </div>
          ))}
        </div>

        <div className="fr-actions fr-grid-actions">
          {currentPage > 0 && (
            <button
              type="button"
              onClick={handlePrevPage}
              className="fr-btn fr-btn-secondary"
              disabled={state.isSubmitting}
            >
              Previous
            </button>
          )}

          {!isLastPage ? (
            <button
              type="button"
              onClick={handleNextPage}
              className="fr-btn fr-btn-primary"
              disabled={state.isSubmitting}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="fr-btn fr-btn-primary"
              disabled={state.isSubmitting}
            >
              {state.isSubmitting
                ? "Submitting..."
                : schema.settings?.submitText || "Submit"}
            </button>
          )}
        </div>

        {/* Error summary for accessibility */}
        {Object.keys(pageErrors).length > 0 && (
          <div className="fr-error-summary" role="alert" aria-live="polite">
            <h3>Please fix the following errors:</h3>
            <ul>
              {Object.entries(pageErrors).map(([fieldId, error]) => {
                const block = currentPageBlocks.find((b) => b.id === fieldId);
                return (
                  <li key={fieldId}>
                    <a href={`#${fieldId}`} onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(fieldId);
                      element?.focus();
                    }}>
                      {error}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </form>

      {config.enableOffline && (
        <div className="fr-status">
          {!isOnline && (
            <div className="fr-offline-badge">
              <span className="fr-offline-icon">⚡</span>
              Working offline
            </div>
          )}
          {hasUnsyncedData && isOnline && (
            <div className="fr-syncing-badge">
              <span className="fr-syncing-icon">↻</span>
              Syncing...
            </div>
          )}
          <p className="fr-offline-notice">Your progress is automatically saved</p>
        </div>
      )}
    </div>
  );
}