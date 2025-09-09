/**
 * Analytics SDK for tracking form events
 */

export interface AnalyticsConfig {
  endpoint: string;
  organizationId: string;
  debug?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export interface EventData {
  eventType: 'form_view' | 'form_start' | 'step_view' | 'field_focus' | 
             'field_change' | 'field_error' | 'step_complete' | 'form_submit' | 
             'form_abandon' | 'outcome_reached' | 'payment_initiated' | 
             'payment_completed' | 'partial_save';
  formId: string;
  respondentId: string;
  sessionId: string;
  timestamp?: Date;
  stepId?: string;
  fieldId?: string;
  fieldType?: string;
  fieldValue?: string;
  errorType?: string;
  errorMessage?: string;
  outcomeId?: string;
  submissionId?: string;
  isPartial?: boolean;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  countryCode?: string;
  pageLoadTimeMs?: number;
  timeToInteractiveMs?: number;
  timeOnStepMs?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerDomain?: string;
}

export class Analytics {
  private config: AnalyticsConfig;
  private queue: EventData[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private startTime: number;
  private stepStartTimes: Map<string, number> = new Map();

  constructor(config: AnalyticsConfig) {
    this.config = {
      batchSize: 10,
      flushInterval: 5000,
      ...config,
    };
    
    // Generate session ID
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Start batch flush timer
    this.startBatchTimer();
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private getRespondentId(): string {
    if (typeof window === 'undefined') return 'anonymous';
    
    // Check for existing ID in localStorage
    let respondentId = localStorage.getItem('forms_respondent_id');
    if (!respondentId) {
      respondentId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('forms_respondent_id', respondentId);
    }
    return respondentId;
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private getBrowserInfo(): { browser: string; os: string } {
    if (typeof window === 'undefined') {
      return { browser: 'unknown', os: 'unknown' };
    }
    
    const userAgent = navigator.userAgent;
    let browser = 'unknown';
    let os = 'unknown';
    
    // Detect browser
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/firefox/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/edge/i.test(userAgent)) {
      browser = 'Edge';
    }
    
    // Detect OS
    if (/windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/mac/i.test(userAgent)) {
      os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      os = 'Android';
    } else if (/ios|iphone|ipad/i.test(userAgent)) {
      os = 'iOS';
    }
    
    return { browser, os };
  }

  private getUTMParams(): Partial<EventData> {
    if (typeof window === 'undefined') return {};
    
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    };
  }

  private getReferrer(): { referrerDomain?: string } {
    if (typeof window === 'undefined' || !document.referrer) return {};
    
    try {
      const url = new URL(document.referrer);
      return { referrerDomain: url.hostname };
    } catch {
      return {};
    }
  }

  private startBatchTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      const response = await fetch(`${this.config.endpoint}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: events.map(event => ({
            ...event,
            organizationId: this.config.organizationId,
          })),
        }),
      });
      
      if (!response.ok && this.config.debug) {
        console.error('Analytics batch failed:', await response.text());
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Analytics batch error:', error);
      }
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  track(eventData: Partial<EventData>) {
    const { browser, os } = this.getBrowserInfo();
    
    const event: EventData = {
      eventType: 'form_view',
      formId: '',
      ...eventData,
      respondentId: this.getRespondentId(),
      sessionId: this.sessionId,
      timestamp: new Date(),
      deviceType: this.getDeviceType(),
      browser,
      os,
      ...this.getUTMParams(),
      ...this.getReferrer(),
    };
    
    // Calculate time on step if completing a step
    if (event.eventType === 'step_complete' && event.stepId) {
      const startTime = this.stepStartTimes.get(event.stepId);
      if (startTime) {
        event.timeOnStepMs = Date.now() - startTime;
        this.stepStartTimes.delete(event.stepId);
      }
    }
    
    // Track step start times
    if (event.eventType === 'step_view' && event.stepId) {
      this.stepStartTimes.set(event.stepId, Date.now());
    }
    
    this.queue.push(event);
    
    // Flush if batch size reached
    if (this.queue.length >= this.config.batchSize!) {
      this.flush();
    }
    
    if (this.config.debug) {
      console.log('Analytics event tracked:', event);
    }
  }

  // Convenience methods
  trackFormView(formId: string, pageLoadTimeMs?: number) {
    this.track({
      eventType: 'form_view',
      formId,
      pageLoadTimeMs,
      timeToInteractiveMs: Date.now() - this.startTime,
    });
  }

  trackFormStart(formId: string) {
    this.track({
      eventType: 'form_start',
      formId,
    });
  }

  trackStepView(formId: string, stepId: string) {
    this.track({
      eventType: 'step_view',
      formId,
      stepId,
    });
  }

  trackFieldFocus(formId: string, stepId: string, fieldId: string, fieldType: string) {
    this.track({
      eventType: 'field_focus',
      formId,
      stepId,
      fieldId,
      fieldType,
    });
  }

  trackFieldChange(formId: string, stepId: string, fieldId: string, fieldType: string) {
    this.track({
      eventType: 'field_change',
      formId,
      stepId,
      fieldId,
      fieldType,
    });
  }

  trackFieldError(
    formId: string,
    stepId: string,
    fieldId: string,
    fieldType: string,
    errorType: string,
    errorMessage: string
  ) {
    this.track({
      eventType: 'field_error',
      formId,
      stepId,
      fieldId,
      fieldType,
      errorType,
      errorMessage,
    });
  }

  trackStepComplete(formId: string, stepId: string) {
    this.track({
      eventType: 'step_complete',
      formId,
      stepId,
    });
  }

  trackFormSubmit(formId: string, submissionId: string) {
    this.track({
      eventType: 'form_submit',
      formId,
      submissionId,
    });
  }

  trackFormAbandon(formId: string, stepId?: string) {
    this.track({
      eventType: 'form_abandon',
      formId,
      stepId,
    });
  }

  trackPartialSave(formId: string, stepId: string) {
    this.track({
      eventType: 'partial_save',
      formId,
      stepId,
      isPartial: true,
    });
  }

  trackOutcomeReached(formId: string, outcomeId: string) {
    this.track({
      eventType: 'outcome_reached',
      formId,
      outcomeId,
    });
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Export singleton instance
let analyticsInstance: Analytics | null = null;

export function initAnalytics(config: AnalyticsConfig): Analytics {
  if (analyticsInstance) {
    analyticsInstance.destroy();
  }
  analyticsInstance = new Analytics(config);
  return analyticsInstance;
}

export function getAnalytics(): Analytics | null {
  return analyticsInstance;
}