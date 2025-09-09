import { useState, useEffect, useCallback, useRef } from "react";
import mitt from "mitt";
import type { FormSchema, FormState, RuntimeConfig, FormData } from "./types";
import { OfflineStore } from "./store";
import { validateField, shouldShowBlock } from "./utils";

type Events = {
  "field:change": { field: string; value: any };
  "field:blur": { field: string };
  "step:next": { from: number; to: number };
  "step:prev": { from: number; to: number };
  "form:submit": { data: FormData };
  "form:save": { data: Partial<FormData> };
  "form:error": { error: Error };
};

const emitter = mitt<Events>();

export function useFormRuntime(schema: FormSchema, config: RuntimeConfig) {
  const [state, setState] = useState<FormState>(() => ({
    currentStep: 0,
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    isComplete: false,
  }));

  const storeRef = useRef<OfflineStore | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const respondentKeyRef = useRef(config.respondentKey || `anon-${Date.now()}-${Math.random()}`);

  // Initialize offline store
  useEffect(() => {
    if (config.enableOffline && typeof window !== "undefined") {
      storeRef.current = new OfflineStore();

      // Load saved state
      storeRef.current.getState(config.formId).then((saved) => {
        if (saved) {
          setState(saved.state);
        }
      });
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [config.formId, config.enableOffline]);

  // Auto-save logic
  const scheduleSave = useCallback(() => {
    if (!config.enableOffline || !storeRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const data: Partial<FormData> = {
        formId: config.formId,
        values: state.values,
        startedAt: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      storeRef.current?.saveState(config.formId, respondentKeyRef.current, state, data);

      if (config.onPartialSave) {
        config.onPartialSave(data);
      }

      emitter.emit("form:save", { data });
    }, config.autoSaveInterval || 5000);
  }, [config, state]);

  // Schedule save on state change
  useEffect(() => {
    scheduleSave();
  }, [state.values, scheduleSave]);

  // Field handlers
  const setValue = useCallback((field: string, value: any) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      errors: { ...prev.errors, [field]: "" },
    }));

    emitter.emit("field:change", { field, value });
  }, []);

  const setError = useCallback((field: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  }, []);

  const setTouched = useCallback((field: string) => {
    setState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));

    emitter.emit("field:blur", { field });
  }, []);

  // Navigation
  const canGoNext = useCallback((): boolean => {
    const currentBlock = schema.blocks[state.currentStep];
    if (!currentBlock) return false;

    if (currentBlock.required && !state.values[currentBlock.id]) {
      return false;
    }

    const error = validateField(currentBlock, state.values[currentBlock.id]);

    return !error;
  }, [schema, state]);

  // Validation
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    schema.blocks.forEach((block) => {
      const value = state.values[block.id];
      const error = validateField(block, value);

      if (error) {
        errors[block.id] = error;
        isValid = false;
      }
    });

    setState((prev) => ({ ...prev, errors }));
    return isValid;
  }, [schema, state]);

  const goNext = useCallback(() => {
    if (!canGoNext()) return;

    const nextStep = state.currentStep + 1;

    if (nextStep < schema.blocks.length) {
      setState((prev) => ({
        ...prev,
        currentStep: nextStep,
      }));

      emitter.emit("step:next", {
        from: state.currentStep,
        to: nextStep,
      });
    } else {
      // Form complete - submit form
      if (!validate()) return;

      setState((prev) => ({ ...prev, isSubmitting: true }));

      const data: FormData = {
        formId: config.formId,
        values: state.values,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        metadata: {
          locale: config.locale,
          userAgent: navigator.userAgent,
        },
      };

      if (config.onSubmit) {
        Promise.resolve(config.onSubmit(data)).catch((error) => {
          setState((prev) => ({ ...prev, isSubmitting: false }));
          emitter.emit("form:error", { error: error as Error });
        });
      } else {
        // Default API submission
        fetch(`${config.apiUrl}/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
          })
          .then(() => {
            setState((prev) => ({
              ...prev,
              isSubmitting: false,
              isComplete: true,
            }));
            emitter.emit("form:submit", { data });
          })
          .catch((error) => {
            setState((prev) => ({ ...prev, isSubmitting: false }));
            emitter.emit("form:error", { error: error as Error });
          });
      }
    }
  }, [state, schema, canGoNext, validate, config]);

  const goPrev = useCallback(() => {
    if (state.currentStep > 0) {
      const prevStep = state.currentStep - 1;

      setState((prev) => ({
        ...prev,
        currentStep: prevStep,
      }));

      emitter.emit("step:prev", {
        from: state.currentStep,
        to: prevStep,
      });
    }
  }, [state]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < schema.blocks.length) {
        setState((prev) => ({
          ...prev,
          currentStep: step,
        }));
      }
    },
    [schema]
  );

  // Manual submit function
  const submit = useCallback(async () => {
    if (!validate()) return;

    setState((prev) => ({ ...prev, isSubmitting: true }));

    const data: FormData = {
      formId: config.formId,
      values: state.values,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      metadata: {
        locale: config.locale,
        userAgent: navigator.userAgent,
      },
    };

    try {
      if (config.onSubmit) {
        await config.onSubmit(data);
      } else {
        // Default API submission
        const response = await fetch(`${config.apiUrl}/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Submission failed: ${response.statusText}`);
        }
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        isComplete: true,
      }));

      // Clear offline storage
      if (storeRef.current) {
        await storeRef.current.deleteState(config.formId);
      }

      emitter.emit("form:submit", { data });
    } catch (error) {
      setState((prev) => ({ ...prev, isSubmitting: false }));

      if (config.onError) {
        config.onError(error as Error);
      }

      emitter.emit("form:error", { error: error as Error });
    }
  }, [config, state, validate]);

  // Get visible blocks based on logic
  const visibleBlocks = schema.blocks.filter((block) => shouldShowBlock(block, state.values));

  const currentBlock = visibleBlocks[state.currentStep];
  const progress = ((state.currentStep + 1) / visibleBlocks.length) * 100;

  return {
    // State
    state,
    currentBlock,
    visibleBlocks,
    progress,

    // Actions
    setValue,
    setError,
    setTouched,
    goNext,
    goPrev,
    goToStep,
    submit,
    validate,

    // Utilities
    canGoNext,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
  };
}
