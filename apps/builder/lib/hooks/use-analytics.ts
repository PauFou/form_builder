import { useCallback, useRef, useEffect } from "react";
import {
  analyticsApi,
  createSessionId,
  createRespondentId,
  detectDeviceType,
  getBrowserInfo,
  getUtmParameters,
  getReferrerDomain,
  type AnalyticsEvent,
  type EventType,
} from "../api/analytics";

export interface AnalyticsConfig {
  formId: string;
  organizationId: string;
  enabled?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export function useAnalytics(config: AnalyticsConfig) {
  const sessionId = useRef<string>();
  const respondentId = useRef<string>();
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const flushTimer = useRef<NodeJS.Timeout>();
  const startTime = useRef<number>();
  const currentStepStartTime = useRef<number>();

  const { formId, organizationId, enabled = true, batchSize = 10, flushInterval = 5000 } = config;

  // Initialize session and respondent IDs
  useEffect(() => {
    if (!enabled) return;

    sessionId.current = createSessionId();
    respondentId.current = createRespondentId();
    startTime.current = Date.now();

    // Track initial form view
    trackEvent("form_view");

    // Cleanup on unmount
    return () => {
      flushEvents();
    };
  }, [formId, organizationId, enabled]);

  // Flush events periodically
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(flushEvents, flushInterval);
    return () => clearInterval(timer);
  }, [enabled, flushInterval]);

  const addToQueue = useCallback(
    (event: AnalyticsEvent) => {
      if (!enabled) return;

      eventQueue.current.push(event);

      // Auto-flush if batch size reached
      if (eventQueue.current.length >= batchSize) {
        flushEvents();
      }
    },
    [enabled, batchSize]
  );

  const flushEvents = useCallback(async () => {
    if (!enabled || eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      if (events.length === 1) {
        await analyticsApi.trackEvent(events[0]);
      } else {
        await analyticsApi.trackEventsBatch(events);
      }
    } catch (error) {
      console.error("Failed to flush analytics events:", error);
      // In case of error, don't retry to avoid infinite loops
    }
  }, [enabled]);

  const trackEvent = useCallback(
    (eventType: EventType, eventData?: Partial<AnalyticsEvent>) => {
      if (!enabled || !sessionId.current || !respondentId.current) return;

      const deviceInfo = getBrowserInfo();
      const utmParams = getUtmParameters();

      const event: AnalyticsEvent = {
        event_type: eventType,
        form_id: formId,
        organization_id: organizationId,
        respondent_id: respondentId.current,
        session_id: sessionId.current,
        timestamp: new Date().toISOString(),
        device_type: detectDeviceType(),
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        referrer_domain: getReferrerDomain(),
        ...utmParams,
        ...eventData,
      };

      addToQueue(event);
    },
    [enabled, formId, organizationId, addToQueue]
  );

  // Specific tracking methods
  const trackFormStart = useCallback(() => {
    trackEvent("form_start");
  }, [trackEvent]);

  const trackStepView = useCallback(
    (stepId: string) => {
      currentStepStartTime.current = Date.now();
      trackEvent("step_view", { step_id: stepId });
    },
    [trackEvent]
  );

  const trackStepComplete = useCallback(
    (stepId: string) => {
      const timeOnStep = currentStepStartTime.current
        ? Date.now() - currentStepStartTime.current
        : undefined;

      trackEvent("step_complete", {
        step_id: stepId,
        time_on_step_ms: timeOnStep,
      });
    },
    [trackEvent]
  );

  const trackFieldFocus = useCallback(
    (fieldId: string, fieldType: string) => {
      trackEvent("field_focus", {
        field_id: fieldId,
        field_type: fieldType,
      });
    },
    [trackEvent]
  );

  const trackFieldChange = useCallback(
    (fieldId: string, fieldType: string, fieldValue?: string) => {
      trackEvent("field_change", {
        field_id: fieldId,
        field_type: fieldType,
        field_value: fieldValue,
      });
    },
    [trackEvent]
  );

  const trackFieldError = useCallback(
    (fieldId: string, fieldType: string, errorType: string, errorMessage: string) => {
      trackEvent("field_error", {
        field_id: fieldId,
        field_type: fieldType,
        error_type: errorType,
        error_message: errorMessage,
      });
    },
    [trackEvent]
  );

  const trackFormSubmit = useCallback(
    (submissionId?: string) => {
      const totalTime = startTime.current ? Date.now() - startTime.current : undefined;

      trackEvent("form_submit", {
        submission_id: submissionId,
        time_on_step_ms: totalTime,
      });

      // Flush immediately for important events
      setTimeout(flushEvents, 100);
    },
    [trackEvent, flushEvents]
  );

  const trackFormAbandon = useCallback(
    (stepId?: string) => {
      const totalTime = startTime.current ? Date.now() - startTime.current : undefined;

      trackEvent("form_abandon", {
        step_id: stepId,
        time_on_step_ms: totalTime,
      });

      // Flush immediately
      setTimeout(flushEvents, 100);
    },
    [trackEvent, flushEvents]
  );

  const trackPartialSave = useCallback(
    (stepId?: string) => {
      trackEvent("partial_save", { step_id: stepId });
    },
    [trackEvent]
  );

  const trackOutcomeReached = useCallback(
    (outcomeId: string) => {
      trackEvent("outcome_reached", { outcome_id: outcomeId });
    },
    [trackEvent]
  );

  const trackPaymentInitiated = useCallback(() => {
    trackEvent("payment_initiated");
  }, [trackEvent]);

  const trackPaymentCompleted = useCallback(() => {
    trackEvent("payment_completed");

    // Flush immediately for important events
    setTimeout(flushEvents, 100);
  }, [trackEvent, flushEvents]);

  // Performance tracking
  const trackPerformance = useCallback(
    (performanceData: { pageLoadTime?: number; timeToInteractive?: number }) => {
      if (!enabled) return;

      // Update the last queued event with performance data
      const lastEvent = eventQueue.current[eventQueue.current.length - 1];
      if (lastEvent) {
        if (performanceData.pageLoadTime) {
          lastEvent.page_load_time_ms = performanceData.pageLoadTime;
        }
        if (performanceData.timeToInteractive) {
          lastEvent.time_to_interactive_ms = performanceData.timeToInteractive;
        }
      }
    },
    [enabled]
  );

  // Track page visibility changes (form abandonment detection)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushEvents();
      }
    };

    const handleBeforeUnload = () => {
      flushEvents();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, flushEvents]);

  return {
    // Basic tracking
    trackEvent,
    flushEvents,

    // Form-specific tracking
    trackFormStart,
    trackStepView,
    trackStepComplete,
    trackFieldFocus,
    trackFieldChange,
    trackFieldError,
    trackFormSubmit,
    trackFormAbandon,
    trackPartialSave,
    trackOutcomeReached,
    trackPaymentInitiated,
    trackPaymentCompleted,
    trackPerformance,

    // Session info
    sessionId: sessionId.current,
    respondentId: respondentId.current,
  };
}
