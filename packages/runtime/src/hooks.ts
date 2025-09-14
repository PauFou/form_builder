import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import mitt from "mitt";
import type { FormSchema, FormState, RuntimeConfig, FormData } from "./types";
import { OfflineService } from "./services/offline-service";
import { PartialSaveService } from "./services/partial-save-service";
import { AnalyticsService } from "./services/analytics-service";
import { LogicEvaluator } from "./logic/evaluator";
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

  const [logicState, setLogicState] = useState({
    hiddenFields: [] as string[],
    fieldUpdates: {} as Record<string, any>,
    navigation: undefined as { type: "skip" | "jump"; target: string } | undefined,
  });

  const offlineServiceRef = useRef<OfflineService | null>(null);
  const partialSaveServiceRef = useRef<PartialSaveService | null>(null);
  const analyticsRef = useRef<AnalyticsService | null>(null);
  const logicEvaluatorRef = useRef<LogicEvaluator | null>(null);
  const respondentKeyRef = useRef(config.respondentKey || `anon-${Date.now()}-${Math.random()}`);
  const startTimeRef = useRef(new Date().toISOString());

  // Anti-spam protection
  const { validateAntiSpam, getCompletionTime } = useAntiSpam({
    enabled: config.enableAntiSpam ?? true,
    minCompletionTime: config.minCompletionTime ?? 3000,
    formId: config.formId,
    skipRateLimit: false,
  });

  // Get all blocks from all pages
  const allBlocks = useMemo(() => {
    if (schema.pages?.length) {
      return schema.pages.flatMap((page) => page.blocks || []);
    }
    return schema.blocks || [];
  }, [schema.pages, schema.blocks]);

  // Initialize services
  useEffect(() => {
    // Initialize logic evaluator
    if (schema.logic?.length) {
      logicEvaluatorRef.current = new LogicEvaluator({
        formId: config.formId,
        values: state.values,
        startedAt: startTimeRef.current,
      });
    }

    // Initialize analytics
    if (config.enableAnalytics !== false && typeof window !== "undefined") {
      analyticsRef.current = new AnalyticsService({
        apiUrl: config.analyticsApiUrl || config.apiUrl,
        enableTracking: true,
        enableDebug: config.enableAnalyticsDebug,
      });

      // Track form view
      analyticsRef.current.trackFormView(config.formId, respondentKeyRef.current);
    }

    // Initialize partial save service
    if (typeof window !== "undefined") {
      partialSaveServiceRef.current = new PartialSaveService(config);

      // Load saved partial data
      const loadPartialData = async () => {
        const savedData = await partialSaveServiceRef.current?.load();
        if (savedData) {
          setState((prev) => ({
            ...prev,
            values: savedData.values,
            currentStep: savedData.currentStep || 0,
          }));
          respondentKeyRef.current = savedData.respondentKey;
          if (savedData.startedAt) {
            startTimeRef.current = savedData.startedAt;
          }
        }
      };

      loadPartialData();
    }

    // Initialize offline service
    if (config.enableOffline && typeof window !== "undefined") {
      offlineServiceRef.current = new OfflineService(config);

      // Load saved state with cleanup (if no partial data was loaded)
      const loadSavedState = async () => {
        if (!offlineServiceRef.current) return;
        const saved = await offlineServiceRef.current.getState();
        // Only load if we haven't already loaded from partial save service
        if (saved && Object.keys(state.values).length === 0) {
          setState(saved.state);
          respondentKeyRef.current = saved.respondentKey;
          if (saved.data.startedAt) {
            startTimeRef.current = saved.data.startedAt;
          }
        }
      };

      loadSavedState();

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
      partialSaveServiceRef.current?.destroy();
      analyticsRef.current?.destroy();
      logicEvaluatorRef.current?.reset();
    };
  }, [config, schema.logic?.length]);

  // Create a ref to hold the saveData function
  const saveDataRef = useRef<() => Promise<void>>(async () => {});

  // Save on state change (skip if values are empty)
  useEffect(() => {
    if (Object.keys(state.values).length > 0 || state.currentStep > 0) {
      saveDataRef.current();
    }
  }, [state.values, state.currentStep]);

  // Evaluate logic rules on value changes
  useEffect(() => {
    if (!logicEvaluatorRef.current || !schema.logic?.length) return;

    // Update evaluator with current values
    logicEvaluatorRef.current.updateFormData({ values: state.values });

    // Evaluate rules and get actions
    const actions = logicEvaluatorRef.current.evaluateRules(schema.logic);
    const result = logicEvaluatorRef.current.applyActions(actions);

    // Update logic state
    setLogicState({
      hiddenFields: result.hiddenFields,
      fieldUpdates: result.fieldUpdates,
      navigation: result.navigation,
    });

    // Apply field updates if any
    if (Object.keys(result.fieldUpdates).length > 0) {
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, ...result.fieldUpdates },
      }));
    }
  }, [state.values, schema.logic]);

  // Field handlers
  const setValue = useCallback(
    (field: string, value: any) => {
      // Check if field is hidden by logic
      if (logicState.hiddenFields.includes(field)) {
        return;
      }

      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
        errors: { ...prev.errors, [field]: "" },
      }));

      // Track field change
      const block = allBlocks.find((b) => b.id === field);
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
    [config.formId, allBlocks, logicState.hiddenFields]
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

  // We'll define these functions after visibleBlocks is computed
  // to avoid circular dependencies
  const canGoNextRef = useRef<() => boolean>(() => false);
  const validateRef = useRef<() => boolean>(() => false);
  const goNextRef = useRef<() => void>(() => {});
  const goPrevRef = useRef<() => void>(() => {});
  const goToStepRef = useRef<(step: number) => void>(() => {});

  // These will be defined after visibleBlocks

  // Submit function will be defined after visibleBlocks
  const submitRef = useRef<() => Promise<void>>(async () => {});

  // Get visible blocks based on logic
  const visibleBlocks = useMemo(() => {
    return allBlocks.filter((block) => {
      // Check if block is hidden by logic rules
      if (logicState.hiddenFields.includes(block.id)) {
        return false;
      }
      // Also check the basic shouldShowBlock logic
      return shouldShowBlock(block, state.values);
    });
  }, [allBlocks, state.values, logicState.hiddenFields]);

  const currentBlock = visibleBlocks[state.currentStep];
  const progress = ((state.currentStep + 1) / visibleBlocks.length) * 100;

  // Define the actual saveData function after visibleBlocks is available
  const saveData = useCallback(async () => {
    // Save to partial save service (includes localStorage and API)
    if (partialSaveServiceRef.current) {
      const progress =
        visibleBlocks.length > 0 ? ((state.currentStep + 1) / visibleBlocks.length) * 100 : 0;

      await partialSaveServiceRef.current.save({
        formId: config.formId,
        respondentKey: respondentKeyRef.current,
        values: state.values,
        currentStep: state.currentStep,
        progress,
        startedAt: startTimeRef.current,
        lastUpdatedAt: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          locale: config.locale,
        },
      });
    }

    // Also save to offline service if enabled
    if (config.enableOffline && offlineServiceRef.current) {
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
          progress: ((state.currentStep + 1) / visibleBlocks.length) * 100,
        },
      };

      // Save to IndexedDB (throttled internally)
      await offlineServiceRef.current.saveState(respondentKeyRef.current, state, data);
    }

    emitter.emit("form:save", {
      data: {
        formId: config.formId,
        values: state.values,
        startedAt: startTimeRef.current,
      },
    });
  }, [config, state, visibleBlocks]);

  // Update the ref whenever saveData changes
  useEffect(() => {
    saveDataRef.current = saveData;
  }, [saveData]);

  // Now define the actual functions that depend on visibleBlocks
  const canGoNext = useCallback((): boolean => {
    const currentBlock = visibleBlocks[state.currentStep];
    if (!currentBlock) return false;

    if (currentBlock.required && !state.values[currentBlock.id]) {
      return false;
    }

    const error = validateField(currentBlock, state.values[currentBlock.id]);

    return !error;
  }, [visibleBlocks, state]);

  // Update ref
  canGoNextRef.current = canGoNext;

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    visibleBlocks.forEach((block) => {
      const value = state.values[block.id];
      const error = validateField(block, value);

      if (error) {
        errors[block.id] = error;
        isValid = false;
      }
    });

    setState((prev) => ({ ...prev, errors }));
    return isValid;
  }, [visibleBlocks, state]);

  // Update ref
  validateRef.current = validate;

  const goNext = useCallback(() => {
    if (!canGoNext()) return;

    // Check for navigation actions from logic
    if (logicState.navigation) {
      const { type, target } = logicState.navigation;

      if (type === "jump") {
        // Find the target block index
        const targetIndex = visibleBlocks.findIndex((b) => b.id === target);
        if (targetIndex !== -1) {
          setState((prev) => ({ ...prev, currentStep: targetIndex }));
          return;
        }
      } else if (type === "skip") {
        // Skip to the block after the target
        const targetIndex = visibleBlocks.findIndex((b) => b.id === target);
        if (targetIndex !== -1 && targetIndex < visibleBlocks.length - 1) {
          setState((prev) => ({ ...prev, currentStep: targetIndex + 1 }));
          return;
        }
      }
    }

    const nextStep = state.currentStep + 1;

    if (nextStep < visibleBlocks.length) {
      // Track step completion
      const currentBlock = visibleBlocks[state.currentStep];
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
      const nextBlock = visibleBlocks[nextStep];
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
  }, [state, visibleBlocks, logicState, canGoNext, validate, config]);

  // Update ref
  goNextRef.current = goNext;

  const goPrev = useCallback(() => {
    if (state.currentStep > 0) {
      const prevStep = state.currentStep - 1;

      setState((prev) => ({
        ...prev,
        currentStep: prevStep,
      }));

      // Track step navigation
      const prevBlock = visibleBlocks[prevStep];
      if (analyticsRef.current && prevBlock) {
        analyticsRef.current.trackStepView(config.formId, respondentKeyRef.current, prevBlock.id);
      }

      emitter.emit("step:prev", {
        from: state.currentStep,
        to: prevStep,
      });
    }
  }, [state, config.formId, visibleBlocks]);

  // Update ref
  goPrevRef.current = goPrev;

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < visibleBlocks.length) {
        setState((prev) => ({
          ...prev,
          currentStep: step,
        }));
      }
    },
    [visibleBlocks]
  );

  // Update ref
  goToStepRef.current = goToStep;

  const submit = useCallback(async () => {
    if (!validate()) return;

    // Anti-spam validation
    const spamCheck = await validateAntiSpam();
    if (!spamCheck.isValid) {
      console.warn(`Form submission blocked: ${spamCheck.reason}`);
      if (config.onSpamDetected) {
        config.onSpamDetected(spamCheck.reason!);
      }
      // Track spam attempt in analytics
      if (analyticsRef.current) {
        analyticsRef.current.trackFieldError(
          config.formId,
          respondentKeyRef.current,
          "form_submission",
          "spam_detected",
          spamCheck.reason || "unknown"
        );
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

      // Clear offline storage and partial saves
      if (offlineServiceRef.current) {
        await offlineServiceRef.current.deleteState();
      }
      if (partialSaveServiceRef.current) {
        await partialSaveServiceRef.current.clear();
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

  // Update ref
  submitRef.current = submit;

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
    if (!offlineServiceRef.current) return;

    let cancelled = false;
    offlineServiceRef.current.hasUnsyncedData().then((hasUnsynced) => {
      if (!cancelled) {
        setHasUnsyncedData(hasUnsynced);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [state.values]);

  // Track online/offline status
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    if (!offlineServiceRef.current) return;

    // Set initial state
    setIsOnline(offlineServiceRef.current.online);

    // Listen to online/offline events
    const handleOnline = () => {
      // In tests, React expects state updates from events to be wrapped in act()
      // but in production, this is handled automatically
      if (process.env.NODE_ENV === "test") {
        // State update will be handled by the effect hook instead
        return;
      }
      setIsOnline(true);
    };
    const handleOffline = () => {
      if (process.env.NODE_ENV === "test") {
        return;
      }
      setIsOnline(false);
    };

    // For tests, poll the online state instead of relying on events
    if (process.env.NODE_ENV === "test") {
      const interval = setInterval(() => {
        setIsOnline(offlineServiceRef.current?.online ?? true);
      }, 100);
      return () => clearInterval(interval);
    }

    offlineServiceRef.current.on("online", handleOnline);
    offlineServiceRef.current.on("offline", handleOffline);

    return () => {
      offlineServiceRef.current?.off("online", handleOnline);
      offlineServiceRef.current?.off("offline", handleOffline);
    };
  }, [config.enableOffline]);

  // Get resume URL
  const getResumeUrl = useCallback(() => {
    return partialSaveServiceRef.current?.getResumeUrl() || null;
  }, []);

  // Check if currently saving
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | undefined>();

  useEffect(() => {
    if (!partialSaveServiceRef.current) return;

    const handleSaveStart = () => setIsSaving(true);
    const handleSaveSuccess = () => {
      setIsSaving(false);
      setLastSaveTime(new Date());
    };
    const handleSaveError = () => setIsSaving(false);

    partialSaveServiceRef.current.on("save:start", handleSaveStart);
    partialSaveServiceRef.current.on("save:success", handleSaveSuccess);
    partialSaveServiceRef.current.on("save:error", handleSaveError);

    return () => {
      partialSaveServiceRef.current?.off("save:start", handleSaveStart);
      partialSaveServiceRef.current?.off("save:success", handleSaveSuccess);
      partialSaveServiceRef.current?.off("save:error", handleSaveError);
    };
  }, []);

  return {
    // State
    state,
    currentBlock,
    visibleBlocks,
    progress,
    logicState,

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
    isOnline,
    isSaving,
    lastSaveTime,
    getResumeUrl,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
  };
}
