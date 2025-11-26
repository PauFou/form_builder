import React, { useEffect, useRef, useState } from "react";
import { TypeformField } from "./TypeformField";
import { SkemyaLogo } from "./SkemyaLogo";
import { InactivityWarningModal } from "./InactivityWarningModal";
import { useFormRuntime } from "../hooks";
import { useInactivityRefresh } from "../hooks/useInactivityRefresh";
import { createTimer, clearTimer } from "../utils/test-utils";
import type { FormSchema, RuntimeConfig } from "../types";

interface TypeformViewerProps {
  schema: FormSchema;
  config: RuntimeConfig;
  className?: string;
}

export function TypeformViewer({ schema, config, className = "" }: TypeformViewerProps) {
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
    isOnline,
  } = useFormRuntime(schema, config);

  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "prev" | "none">("none");
  const previousStepRef = useRef(state.currentStep);
  const [showWelcome, setShowWelcome] = useState(true);

  // Inactivity refresh hook
  const { showWarning, countdown, handleRefresh, handleContinue } = useInactivityRefresh({
    enabled: schema.settings?.access?.autoRefreshOnInactivity ?? false,
    timeoutMinutes: schema.settings?.access?.inactivityTimeout ?? 10,
  });

  // Detect keyboard vs mouse navigation
  useEffect(() => {
    const handleMouseDown = () => document.body.classList.remove("keyboard-nav");
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-nav");
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle step transitions with animations
  useEffect(() => {
    const currentStep = state.currentStep;
    const previousStep = previousStepRef.current;

    if (currentStep !== previousStep) {
      setTransitionDirection(currentStep > previousStep ? "next" : "prev");
      setIsTransitioning(true);

      const timer = createTimer(() => {
        setIsTransitioning(false);
        setTransitionDirection("none");
      }, 400);

      previousStepRef.current = currentStep;
      return () => clearTimer(timer);
    }
  }, [state.currentStep]);

  // Focus management
  useEffect(() => {
    if (currentBlock && formRef.current && !isTransitioning && !showWelcome) {
      const timer = createTimer(
        () => {
          const input = formRef.current?.querySelector<HTMLElement>(
            `#${currentBlock.id}, [name="${currentBlock.id}"]`
          );
          if (input) {
            input.focus();
          }
        },
        isTransitioning ? 450 : 100
      );

      return () => clearTimer(timer);
    }
  }, [currentBlock, isTransitioning, showWelcome]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && canGoNext()) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "TEXTAREA" && target.tagName !== "BUTTON") {
          e.preventDefault();
          if (state.currentStep === visibleBlocks.length - 1) {
            submit();
          } else {
            goNext();
          }
        }
      } else if (e.key === "Escape") {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoNext, goNext, submit, state.currentStep, visibleBlocks.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.currentStep === visibleBlocks.length - 1) {
      submit();
    } else {
      goNext();
    }
  };

  const handleStart = () => {
    setShowWelcome(false);
  };

  // Thank you screen
  if (state.isComplete) {
    return (
      <div className="typeform-container">
        <div className="typeform-content typeform-complete">
          <div className="typeform-checkmark">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" stroke="#27ae60" strokeWidth="2" />
              <path fill="none" stroke="#27ae60" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          {schema.settings?.thankYouMessage ? (
            <div
              className="typeform-thank-you-content"
              dangerouslySetInnerHTML={{ __html: schema.settings.thankYouMessage }}
            />
          ) : (
            <>
              <h1 className="typeform-thank-you-title">All done!</h1>
              <p className="typeform-thank-you-subtitle">
                Thanks for completing this form. Your response has been recorded.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Welcome screen
  if (showWelcome && schema.title) {
    return (
      <div className="typeform-container">
        <div className="typeform-content typeform-welcome">
          <div className="typeform-brand">
            <SkemyaLogo className="typeform-logo" />
            <span className="typeform-brand-name">Skemya</span>
          </div>

          <div className="typeform-welcome-content">
            <h1 className="typeform-title">{schema.title}</h1>
            {schema.description && <p className="typeform-description">{schema.description}</p>}
            <button onClick={handleStart} className="typeform-start-button" autoFocus>
              Start
              <svg className="typeform-button-arrow" viewBox="0 0 24 24">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="typeform-footer">
              <span className="typeform-key-hint">
                press <strong>Enter</strong> ↵
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBlock) {
    return null;
  }

  const questionNumber = state.currentStep + 1;

  return (
    <div className={`typeform-container ${className}`} data-theme={schema.theme}>
      {/* Minimal brand header */}
      <div className="typeform-header">
        <div className="typeform-brand-small">
          <SkemyaLogo className="typeform-logo-small" />
        </div>

        {/* Progress */}
        <div className="typeform-progress">
          <div className="typeform-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="typeform-form">
        <div className="typeform-content">
          <div
            className={`typeform-question ${isTransitioning ? `typeform-transition-${transitionDirection}` : ""}`}
            key={currentBlock.id}
          >
            <div className="typeform-question-number">
              {questionNumber}
              <svg className="typeform-arrow-right" viewBox="0 0 24 24">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="typeform-question-text">
              {currentBlock.question}
              {currentBlock.required && <span className="typeform-required">*</span>}
            </h2>

            {currentBlock.description && (
              <p className="typeform-question-description">{currentBlock.description}</p>
            )}

            <div className="typeform-field-wrapper">
              <TypeformField
                block={currentBlock}
                value={state.values[currentBlock.id]}
                error={state.errors[currentBlock.id]}
                touched={state.touched[currentBlock.id]}
                onChange={(value) => setValue(currentBlock.id, value)}
                onBlur={() => setTouched(currentBlock.id)}
              />

              {state.errors[currentBlock.id] && state.touched[currentBlock.id] && (
                <div className="typeform-error">{state.errors[currentBlock.id]}</div>
              )}
            </div>

            <div className="typeform-actions">
              <button
                type="submit"
                className="typeform-submit-button"
                disabled={state.isSubmitting || !canGoNext()}
              >
                {state.isSubmitting
                  ? "Submitting..."
                  : state.currentStep === visibleBlocks.length - 1
                    ? "Submit"
                    : "OK"}
                <svg
                  className="typeform-button-check"
                  viewBox="0 0 24 24"
                  style={{
                    display: state.currentStep < visibleBlocks.length - 1 ? "block" : "none",
                  }}
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <span className="typeform-key-hint">
                press <strong>Enter</strong> ↵
              </span>
            </div>
          </div>
        </div>

        {/* Navigation footer */}
        <div className="typeform-navigation">
          {state.currentStep > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="typeform-nav-button typeform-nav-up"
              disabled={state.isSubmitting}
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 19V5M5 12l7-7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {state.currentStep < visibleBlocks.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="typeform-nav-button typeform-nav-down"
              disabled={!canGoNext() || state.isSubmitting}
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 5v14M19 12l-7 7-7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Offline status */}
      {config.enableOffline && !isOnline && (
        <div className="typeform-offline">
          <span className="typeform-offline-icon">⚡</span>
          Working offline
        </div>
      )}

      {/* Inactivity warning modal */}
      {showWarning && (
        <InactivityWarningModal
          countdown={countdown}
          onRefresh={handleRefresh}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
