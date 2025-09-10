// Analytics tracker implementation
export interface AnalyticsEvent {
  event: string;
  formId: string;
  sessionId: string;
  timestamp: number;
  data?: Record<string, any>;
}

export class Analytics {
  private queue: AnalyticsEvent[] = [];
  private apiUrl: string;
  private batchSize = 10;
  private flushInterval = 5000;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.startBatchTimer();
  }

  track(event: Omit<AnalyticsEvent, "timestamp">) {
    this.queue.push({
      ...event,
      timestamp: Date.now(),
    });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(`${this.apiUrl}/analytics/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  private startBatchTimer() {
    setInterval(() => this.flush(), this.flushInterval);
  }
}
