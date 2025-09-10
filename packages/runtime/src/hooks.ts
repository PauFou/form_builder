import { useState, useEffect, useCallback, useRef } from "react";
import mitt from "mitt";
import type { FormSchema, FormState, RuntimeConfig, FormData } from "./types";
import { OfflineService } from "./services/offline-service";
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
  const respondentKeyRef = useRef(config.respondentKey || `anon-${Date.now()}-${Math.random()}`);
  const startTimeRef = useRef(new Date().toISOString());

  // Anti-spam protection
  const { validateAntiSpam, getCompletionTime } = useAntiSpam({
    enabled: config.enableAntiSpam ?? true,
    minCompletionTime: config.minCompletionTime ?? 3000,
  });

  // Initialize offline service
  useEffect(() => {
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
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        isComplete: true,
      }));

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
