import { useState, useEffect, useCallback, useRef } from "react";
import mitt from "mitt";
import type { FormSchema, FormState, RuntimeConfig, FormData } from "./types";
import { OfflineService } from "./services/offline-service";
import { AnalyticsService } from "./services/analytics-service";
import { validateField, shouldShowBlock } from "./utils";
import { useAntiSpam } from "./hooks/use-anti-spam";

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

  const offlineServiceRef = useRef<OfflineService | null>(null);
  const analyticsRef = useRef<AnalyticsService | null>(null);
  const respondentKeyRef = useRef(config.respondentKey || `anon-${Date.now()}-${Math.random()}`);
  const startTimeRef = useRef(new Date().toISOString());

  // Anti-spam protection
  const { validateAntiSpam, getCompletionTime } = useAntiSpam({
    enabled: config.enableAntiSpam ?? true,
    minCompletionTime: config.minCompletionTime ?? 3000,
  });

  // Initialize services
  useEffect(() => {
    // Initialize analytics
    if (config.enableAnalytics !== false && typeof window !== "undefined") {
      analyticsRef.current = new AnalyticsService({
        apiUrl: config.analyticsApiUrl || config.apiUrl,
        enableTracking: config.enableAnalytics !== false,
        enableDebug: config.enableAnalyticsDebug,
      });

      // Track form view
      analyticsRef.current.trackFormView(config.formId, respondentKeyRef.current);
    }

    // Initialize offline service
    if (config.enableOffline && typeof window !== "undefined") {
      offlineServiceRef.current = new OfflineService(config);

      // Load saved state
      offlineServiceRef.current.getState().then((saved) => {
        if (saved) {
          setState(saved.state);
          respondentKeyRef.current = saved.respondentKey;
          if (saved.data.startedAt) {
            startTimeRef.current = saved.data.startedAt;
          }
        }
      });

      // Listen to online/offline events
      const handleOnline = () => {
        console.log("Form is back online, syncing data...");
      };

      const handleOffline = () => {
        console.log("Form is offline, data will be saved locally");
      };

      offlineServiceRef.current.on("online", handleOnline);
      offlineServiceRef.current.on("offline", handleOffline);

      return () => {
        offlineServiceRef.current?.off("online", handleOnline);
        offlineServiceRef.current?.off("offline", handleOffline);
      };
    }

    return () => {
      offlineServiceRef.current?.destroy();
      analyticsRef.current?.destroy();
    };
  }, [config]);

  // Auto-save logic
  const saveOffline = useCallback(async () => {
    if (!config.enableOffline || !offlineServiceRef.current) return;

    const data: Partial<FormData> = {
      formId: config.formId,
      values: state.values,
      startedAt: startTimeRef.current,
      metadata: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        locale: config.locale,
        currentStep: state.currentStep,
        progress: ((state.currentStep + 1) / schema.blocks.length) * 100,
      },
    };

    // Save to IndexedDB (throttled internally)
    await offlineServiceRef.current.saveState(respondentKeyRef.current, state, data);

    emitter.emit("form:save", { data });
  }, [config, state, schema.blocks.length]);

  // Save on state change
  useEffect(() => {
    saveOffline();
  }, [state.values, state.currentStep, saveOffline]);

  // Field handlers
  const setValue = useCallback(
    (field: string, value: any) => {
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
        errors: { ...prev.errors, [field]: "" },
      }));

      // Track field change
      const block = schema.blocks.find((b) => b.id === field);
      if (analyticsRef.current && block) {
        analyticsRef.current.trackFieldChange(
          config.formId,
          respondentKeyRef.current,
          field,
          block.type,
          typeof value === "string" ? value : JSON.stringify(value)
        );
      }

      emitter.emit("field:change", { field, value });
    },
    [config.formId, schema.blocks]
  );

  const setError = useCallback(
    (field: string, error: string) => {
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [field]: error },
      }));

      // Track field error
      if (analyticsRef.current && error) {
        analyticsRef.current.trackFieldError(
          config.formId,
          respondentKeyRef.current,
          field,
          "validation",
          error
        );
      }
    },
    [config.formId]
  );

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
      // Track step completion
      const currentBlock = schema.blocks[state.currentStep];
      if (analyticsRef.current && currentBlock) {
        analyticsRef.current.trackStepComplete(
          config.formId,
          respondentKeyRef.current,
          currentBlock.id
        );
      }

      setState((prev) => ({
        ...prev,
        currentStep: nextStep,
      }));

      // Track new step view
      const nextBlock = schema.blocks[nextStep];
      if (analyticsRef.current && nextBlock) {
        analyticsRef.current.trackStepView(config.formId, respondentKeyRef.current, nextBlock.id);
      }

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
          .then((responseData) => {
            setState((prev) => ({
              ...prev,
              isSubmitting: false,
              isComplete: true,
            }));

            // Track form submission
            if (analyticsRef.current) {
              analyticsRef.current.trackFormSubmit(
                config.formId,
                respondentKeyRef.current,
                responseData.id || "unknown",
                false
              );
            }

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

      // Track step navigation
      const prevBlock = schema.blocks[prevStep];
      if (analyticsRef.current && prevBlock) {
        analyticsRef.current.trackStepView(config.formId, respondentKeyRef.current, prevBlock.id);
      }

      emitter.emit("step:prev", {
        from: state.currentStep,
        to: prevStep,
      });
    }
  }, [state, config.formId, schema.blocks]);

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

    // Anti-spam validation
    const spamCheck = validateAntiSpam();
    if (!spamCheck.isValid) {
      console.warn(`Form submission blocked: ${spamCheck.reason}`);
      if (config.onSpamDetected) {
        config.onSpamDetected(spamCheck.reason!);
      }
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    const data: FormData = {
      formId: config.formId,
      values: state.values,
      startedAt: startTimeRef.current,
      completedAt: new Date().toISOString(),
      metadata: {
        locale: config.locale,
        userAgent: navigator.userAgent,
        respondentKey: respondentKeyRef.current,
        completionTime: getCompletionTime(),
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

        const responseData = await response.json();

        // Track form submission with response ID
        if (analyticsRef.current) {
          analyticsRef.current.trackFormSubmit(
            config.formId,
            respondentKeyRef.current,
            responseData.id || "unknown",
            false
          );
        }
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        isComplete: true,
      }));

      // Track form submission for custom handler
      if (config.onSubmit && analyticsRef.current) {
        analyticsRef.current.trackFormSubmit(
          config.formId,
          respondentKeyRef.current,
          data.metadata?.submissionId || "unknown",
          false
        );
      }

      // Clear offline storage
      if (offlineServiceRef.current) {
        await offlineServiceRef.current.deleteState();
      }

      emitter.emit("form:submit", { data });
    } catch (error) {
      setState((prev) => ({ ...prev, isSubmitting: false }));

      if (config.onError) {
        config.onError(error as Error);
      }

      emitter.emit("form:error", { error: error as Error });
    }
  }, [config, state, validate, validateAntiSpam, getCompletionTime]);

  // Get visible blocks based on logic
  const visibleBlocks = schema.blocks.filter((block) => shouldShowBlock(block, state.values));

  const currentBlock = visibleBlocks[state.currentStep];
  const progress = ((state.currentStep + 1) / visibleBlocks.length) * 100;

  // Track form start on first interaction
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (!hasStartedRef.current && Object.keys(state.values).length > 0) {
      hasStartedRef.current = true;
      if (analyticsRef.current) {
        analyticsRef.current.trackFormStart(config.formId, respondentKeyRef.current);
      }
    }
  }, [state.values, config.formId]);

  // Track initial step view
  useEffect(() => {
    if (currentBlock && analyticsRef.current) {
      analyticsRef.current.trackStepView(config.formId, respondentKeyRef.current, currentBlock.id);
    }
  }, []); // Only on mount

  // Track form abandonment on unmount
  useEffect(() => {
    return () => {
      if (!state.isComplete && hasStartedRef.current && analyticsRef.current) {
        analyticsRef.current.trackFormAbandon(
          config.formId,
          respondentKeyRef.current,
          currentBlock?.id
        );
      }
    };
  }, [state.isComplete, config.formId, currentBlock]);

  // Check for unsynced data
  const [hasUnsyncedData, setHasUnsyncedData] = useState(false);
  useEffect(() => {
    offlineServiceRef.current?.hasUnsyncedData().then(setHasUnsyncedData);
  }, [state.values]);

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
    hasUnsyncedData,
    isOnline: offlineServiceRef.current?.online ?? true,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
  };
}
