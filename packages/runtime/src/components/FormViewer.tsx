import React, { useEffect, useRef } from 'react';
import { FormField } from './FormField';
import { ProgressBar } from './ProgressBar';
import { useFormRuntime } from '../hooks';
import type { FormSchema, RuntimeConfig } from '../types';

interface FormViewerProps {
  schema: FormSchema;
  config: RuntimeConfig;
  className?: string;
}

export function FormViewer({ schema, config, className = '' }: FormViewerProps) {
  const {
    state,
    currentBlock,
    progress,
    setValue,
    setTouched,
    goNext,
    goPrev,
    submit,
    canGoNext,
  } = useFormRuntime(schema, config);

  const formRef = useRef<HTMLFormElement>(null);

  // Focus management
  useEffect(() => {
    if (currentBlock && formRef.current) {
      const input = formRef.current.querySelector<HTMLElement>(
        `#${currentBlock.id}, [name="${currentBlock.id}"]`
      );
      input?.focus();
    }
  }, [currentBlock]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && canGoNext()) {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, goNext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.currentStep === schema.blocks.length - 1) {
      submit();
    } else {
      goNext();
    }
  };

  if (state.isComplete) {
    return (
      <div className={`fr-container ${className}`}>
        <div className="fr-complete">
          {schema.settings.thankYouMessage ? (
            <div dangerouslySetInnerHTML={{ __html: schema.settings.thankYouMessage }} />
          ) : (
            <>
              <h2>Thank you!</h2>
              <p>Your response has been submitted successfully.</p>
            </>
          )}
          {schema.settings.redirectUrl && (
            <p>Redirecting...</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentBlock) {
    return null;
  }

  return (
    <div className={`fr-container ${className}`} data-theme={schema.theme}>
      {schema.settings.showProgressBar && (
        <ProgressBar progress={progress} />
      )}
      
      <form ref={formRef} onSubmit={handleSubmit} className="fr-form">
        <div className="fr-step" key={currentBlock.id}>
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
              ? 'Submitting...'
              : state.currentStep === schema.blocks.length - 1
              ? (schema.settings.submitText || 'Submit')
              : 'Next'}
          </button>
        </div>
      </form>
      
      {config.enableOffline && (
        <p className="fr-offline-notice">
          Your progress is automatically saved
        </p>
      )}
    </div>
  );
}