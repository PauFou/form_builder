import React, { useEffect, useRef, useState } from "react";
import { FormField } from "./FormField";
import { ProgressBar } from "./ProgressBar";
import { useFormRuntime } from "../hooks";
import { createTimer, clearTimer } from "../utils/test-utils";
import type { FormSchema, RuntimeConfig } from "../types";

interface FormViewerProps {
  schema: FormSchema;
  config: RuntimeConfig;
  className?: string;
}

export function FormViewer({ schema, config, className = "" }: FormViewerProps) {
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
  } = useFormRuntime(schema, config);

  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev" | "none">("none");
  const previousStepRef = useRef(state.currentStep);

  // Handle step transitions with animations
  useEffect(() => {
    const currentStep = state.currentStep;
    const previousStep = previousStepRef.current;

    if (currentStep !== previousStep) {
      setTransitionDirection(currentStep > previousStep ? "next" : "prev");
      setIsTransitioning(true);

      // Clear transition after animation
      const timer = createTimer(() => {
        setIsTransitioning(false);
        setTransitionDirection("none");
      }, 150); // Brief-specified 150ms duration

      previousStepRef.current = currentStep;
      return () => clearTimer(timer);
    }
  }, [state.currentStep]);

  // Focus management with accessibility
  useEffect(() => {
    if (currentBlock && formRef.current && !isTransitioning) {
      // Delay focus to allow transition to complete
      const timer = createTimer(
        () => {
          const input = formRef.current?.querySelector<HTMLElement>(
            `#${currentBlock.id}, [name="${currentBlock.id}"]`
          );
          if (input) {
            input.focus();
            // Announce step change to screen readers
            const announcement = `Step ${state.currentStep + 1} of ${visibleBlocks.length}. ${currentBlock.question}`;
            const ariaLive = document.createElement("div");
            ariaLive.setAttribute("aria-live", "polite");
            ariaLive.setAttribute("aria-atomic", "true");
            ariaLive.className = "sr-only";
            ariaLive.textContent = announcement;
            document.body.appendChild(ariaLive);
            setTimeout(() => document.body.removeChild(ariaLive), 1000);
          }
        },
        isTransitioning ? 150 : 0
      );

      return () => clearTimer(timer);
    }
  }, [currentBlock, isTransitioning, state.currentStep, visibleBlocks.length]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter = Next (as specified in brief)
      if (e.key === "Enter" && !e.shiftKey && canGoNext()) {
        const target = e.target as HTMLElement;
        // Don't interfere with textarea line breaks or form submissions
        if (target.tagName !== "TEXTAREA" && target.tagName !== "BUTTON") {
          e.preventDefault();
          goNext();
        }
      }
      // Shift+Enter = line break for textarea (handled by textarea)
      // Esc = cancel focus (as specified)
      else if (e.key === "Escape") {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoNext, goNext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.currentStep === visibleBlocks.length - 1) {
      submit();
    } else {
      goNext();
    }
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

  if (!currentBlock) {
    return null;
  }

  return (
    <div className={`fr-container ${className}`} data-theme={schema.theme}>
      {schema.settings?.showProgressBar && <ProgressBar progress={progress} />}

      <form ref={formRef} onSubmit={handleSubmit} className="fr-form">
        <div
          className={`fr-step ${isTransitioning ? `fr-step-${transitionDirection}` : ""}`}
          key={currentBlock.id}
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning
              ? `translateX(${transitionDirection === "next" ? "20px" : "-20px"})`
              : "translateX(0)",
            transition: "opacity 150ms ease-in-out, transform 150ms ease-in-out",
          }}
        >
          <FormField
            block={currentBlock}
            value={state.values[currentBlock.id]}
            error={state.errors[currentBlock.id]}
            touched={state.touched[currentBlock.id]}
            onChange={(value) => setValue(currentBlock.id, value)}
            onBlur={() => setTouched(currentBlock.id)}
          />
        </div>

        <div className="fr-actions">
          {state.currentStep > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="fr-btn fr-btn-secondary"
              disabled={state.isSubmitting}
            >
              Previous
            </button>
          )}

          <button
            type="submit"
            className="fr-btn fr-btn-primary"
            disabled={state.isSubmitting || !canGoNext()}
          >
            {state.isSubmitting
              ? "Submitting..."
              : state.currentStep === visibleBlocks.length - 1
                ? schema.settings?.submitText || "Submit"
                : "Next"}
          </button>
        </div>
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
