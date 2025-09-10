/**
 * Analytics Service for form runtime
 * Tracks user interactions and sends events to analytics backend
 */

export interface AnalyticsEvent {
  event_type: string;
  form_id: string;
  respondent_id: string;
  session_id: string;
  timestamp?: Date;
  step_id?: string;
  field_id?: string;
  field_type?: string;
  field_value?: string;
  error_type?: string;
  error_message?: string;
  outcome_id?: string;
  submission_id?: string;
  is_partial?: boolean;
  device_type?: string;
  browser?: string;
  os?: string;
  country_code?: string;
  page_load_time_ms?: number;
  time_to_interactive_ms?: number;
  time_on_step_ms?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_domain?: string;
}

export interface AnalyticsConfig {
  apiUrl: string;
  apiKey?: string;
  enableTracking: boolean;
  batchSize: number;
  flushInterval: number;
  enableDebug?: boolean;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private stepStartTimes: Map<string, number> = new Map();
  private pageLoadTime: number;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      apiUrl: config.apiUrl || "/api/v1/analytics/events",
      enableTracking: config.enableTracking !== false,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      enableDebug: config.enableDebug || false,
      ...config,
    };

    // Generate session ID
    this.sessionId = this.generateSessionId();

    // Record page load time
    this.pageLoadTime = performance.now();

    // Set up automatic flushing
    if (this.config.enableTracking) {
      this.startFlushTimer();
    }

    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flush();
      });
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): Partial<AnalyticsEvent> {
    if (typeof navigator === "undefined") return {};

    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);

    // Simple browser detection
    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edge")) browser = "Edge";

    // Simple OS detection
    let os = "Unknown";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    return {
      device_type: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
      browser,
      os,
    };
  }

  private getUTMParams(): Partial<AnalyticsEvent> {
    if (typeof window === "undefined") return {};

    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    const referrerDomain = referrer ? new URL(referrer).hostname : undefined;

    return {
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      referrer_domain: referrerDomain,
    };
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (!this.config.enableTracking || this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.config.apiUrl}/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok && this.config.enableDebug) {
        console.error("Analytics batch failed:", response.status);
      }
    } catch (error) {
      if (this.config.enableDebug) {
        console.error("Analytics batch error:", error);
      }
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  public track(event: Partial<AnalyticsEvent>): void {
    if (!this.config.enableTracking) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      event_type: event.event_type || "unknown",
      form_id: event.form_id || "",
      respondent_id: event.respondent_id || "",
      session_id: this.sessionId,
      timestamp: new Date(),
      ...this.getDeviceInfo(),
      ...this.getUTMParams(),
    };

    if (this.config.enableDebug) {
      console.log("Analytics event:", fullEvent);
    }

    this.eventQueue.push(fullEvent);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public trackFormView(formId: string, respondentId: string): void {
    const timeToInteractive = performance.now() - this.pageLoadTime;

    this.track({
      event_type: "form_view",
      form_id: formId,
      respondent_id: respondentId,
      page_load_time_ms: Math.round(this.pageLoadTime),
      time_to_interactive_ms: Math.round(timeToInteractive),
    });
  }

  public trackFormStart(formId: string, respondentId: string): void {
    this.track({
      event_type: "form_start",
      form_id: formId,
      respondent_id: respondentId,
    });
  }

  public trackStepView(formId: string, respondentId: string, stepId: string): void {
    // Record step start time for duration tracking
    this.stepStartTimes.set(stepId, performance.now());

    this.track({
      event_type: "step_view",
      form_id: formId,
      respondent_id: respondentId,
      step_id: stepId,
    });
  }

  public trackStepComplete(formId: string, respondentId: string, stepId: string): void {
    const startTime = this.stepStartTimes.get(stepId);
    const timeOnStep = startTime ? performance.now() - startTime : undefined;

    this.track({
      event_type: "step_complete",
      form_id: formId,
      respondent_id: respondentId,
      step_id: stepId,
      time_on_step_ms: timeOnStep ? Math.round(timeOnStep) : undefined,
    });

    // Clean up
    this.stepStartTimes.delete(stepId);
  }

  public trackFieldChange(
    formId: string,
    respondentId: string,
    fieldId: string,
    fieldType: string,
    value?: string
  ): void {
    this.track({
      event_type: "field_change",
      form_id: formId,
      respondent_id: respondentId,
      field_id: fieldId,
      field_type: fieldType,
      field_value: value,
    });
  }

  public trackFieldError(
    formId: string,
    respondentId: string,
    fieldId: string,
    errorType: string,
    errorMessage: string
  ): void {
    this.track({
      event_type: "field_error",
      form_id: formId,
      respondent_id: respondentId,
      field_id: fieldId,
      error_type: errorType,
      error_message: errorMessage,
    });
  }

  public trackFormSubmit(
    formId: string,
    respondentId: string,
    submissionId: string,
    isPartial: boolean = false
  ): void {
    this.track({
      event_type: "form_submit",
      form_id: formId,
      respondent_id: respondentId,
      submission_id: submissionId,
      is_partial: isPartial,
    });
  }

  public trackFormAbandon(formId: string, respondentId: string, lastStepId?: string): void {
    this.track({
      event_type: "form_abandon",
      form_id: formId,
      respondent_id: respondentId,
      step_id: lastStepId,
    });
  }

  public trackOutcome(formId: string, respondentId: string, outcomeId: string): void {
    this.track({
      event_type: "outcome_reached",
      form_id: formId,
      respondent_id: respondentId,
      outcome_id: outcomeId,
    });
  }

  public destroy(): void {
    // Flush remaining events
    this.flush();

    // Clear timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Clear data
    this.eventQueue = [];
    this.stepStartTimes.clear();
  }
}
