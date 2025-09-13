interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface AntiSpamConfig {
  honeypot: {
    enabled: boolean;
    fieldName: string;
  };
  timeTrap: {
    enabled: boolean;
    minCompletionTimeMs: number;
  };
  rateLimit: {
    enabled: boolean;
    byIP: RateLimitConfig;
    byFormId: RateLimitConfig;
  };
}

interface SubmissionAttempt {
  timestamp: number;
  ip?: string;
  formId?: string;
}

export class AntiSpamService {
  private static instance: AntiSpamService;
  private config: AntiSpamConfig;
  private submissionAttempts: Map<string, SubmissionAttempt[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  private honeypotValues: Map<string, string> = new Map();

  private constructor() {
    this.config = {
      honeypot: {
        enabled: true,
        fieldName: "_website_url", // Underscore prefix to avoid conflicts
      },
      timeTrap: {
        enabled: true,
        minCompletionTimeMs: 3000, // 3 seconds minimum
      },
      rateLimit: {
        enabled: true,
        byIP: {
          maxRequests: 10,
          windowMs: 60 * 1000, // 1 minute
        },
        byFormId: {
          maxRequests: 50,
          windowMs: 60 * 1000, // 1 minute
        },
      },
    };

    // Clean up old attempts periodically
    setInterval(() => this.cleanupOldAttempts(), 60 * 1000);
  }

  static getInstance(): AntiSpamService {
    if (!AntiSpamService.instance) {
      AntiSpamService.instance = new AntiSpamService();
    }
    return AntiSpamService.instance;
  }

  updateConfig(config: Partial<AntiSpamConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      honeypot: { ...this.config.honeypot, ...config.honeypot },
      timeTrap: { ...this.config.timeTrap, ...config.timeTrap },
      rateLimit: {
        ...this.config.rateLimit,
        ...config.rateLimit,
        byIP: { ...this.config.rateLimit.byIP, ...config.rateLimit?.byIP },
        byFormId: { ...this.config.rateLimit.byFormId, ...config.rateLimit?.byFormId },
      },
    };
  }

  // Initialize tracking for a form session
  initializeFormSession(sessionId: string): void {
    this.startTimes.set(sessionId, this.getCurrentTime());
    this.honeypotValues.set(sessionId, "");
  }

  // Create honeypot field element
  createHoneypotField(): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    input.name = this.config.honeypot.fieldName;
    input.id = this.config.honeypot.fieldName;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.setAttribute("autocomplete", "off");

    // Make it invisible but still accessible to bots
    input.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    // Add a label for better bot attraction
    const label = document.createElement("label");
    label.htmlFor = this.config.honeypot.fieldName;
    label.textContent = "Website URL (leave blank)";
    label.style.cssText = input.style.cssText;

    const wrapper = document.createElement("div");
    wrapper.className = "fr-honeypot-wrapper";
    wrapper.style.cssText = input.style.cssText;
    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return input;
  }

  // Update honeypot value
  updateHoneypotValue(sessionId: string, value: string): void {
    this.honeypotValues.set(sessionId, value);
  }

  // Validate anti-spam measures
  async validate(
    sessionId: string,
    options?: {
      ip?: string;
      formId?: string;
      skipRateLimit?: boolean;
    }
  ): Promise<{
    isValid: boolean;
    reason?: string;
    details?: any;
  }> {
    const results = [];

    // Check honeypot
    if (this.config.honeypot.enabled) {
      const honeypotResult = this.validateHoneypot(sessionId);
      if (!honeypotResult.isValid) {
        return honeypotResult;
      }
      results.push(honeypotResult);
    }

    // Check time trap
    if (this.config.timeTrap.enabled) {
      const timeTrapResult = this.validateTimeTrap(sessionId);
      if (!timeTrapResult.isValid) {
        return timeTrapResult;
      }
      results.push(timeTrapResult);
    }

    // Check rate limits
    if (this.config.rateLimit.enabled && !options?.skipRateLimit) {
      const rateLimitResult = await this.validateRateLimit(options?.ip, options?.formId);
      if (!rateLimitResult.isValid) {
        return rateLimitResult;
      }
      results.push(rateLimitResult);
    }

    // Record successful attempt
    if (options?.ip || options?.formId) {
      this.recordAttempt(options.ip, options.formId);
    }

    return { isValid: true, details: results };
  }

  // Validate honeypot field
  private validateHoneypot(sessionId: string): {
    isValid: boolean;
    reason?: string;
  } {
    const value = this.honeypotValues.get(sessionId) || "";

    if (value.trim() !== "") {
      return {
        isValid: false,
        reason: "honeypot_filled",
      };
    }

    return { isValid: true };
  }

  // Validate time trap
  private validateTimeTrap(sessionId: string): {
    isValid: boolean;
    reason?: string;
    completionTime?: number;
  } {
    const startTime = this.startTimes.get(sessionId);
    if (!startTime && startTime !== 0) {
      return { isValid: true }; // No start time recorded, allow submission
    }

    const completionTime = this.getCurrentTime() - startTime;

    if (completionTime < this.config.timeTrap.minCompletionTimeMs) {
      return {
        isValid: false,
        reason: "too_fast",
        completionTime,
      };
    }

    return { isValid: true, completionTime };
  }

  // Validate rate limits
  private async validateRateLimit(
    ip?: string,
    formId?: string
  ): Promise<{
    isValid: boolean;
    reason?: string;
    limit?: number;
    remaining?: number;
  }> {
    // Check IP-based rate limit
    if (ip && this.config.rateLimit.enabled) {
      const ipKey = `ip:${ip}`;
      const ipAttempts = this.getRecentAttempts(ipKey, this.config.rateLimit.byIP.windowMs);

      // Check if adding current attempt would exceed limit
      if (ipAttempts.length >= this.config.rateLimit.byIP.maxRequests) {
        return {
          isValid: false,
          reason: "rate_limit_ip",
          limit: this.config.rateLimit.byIP.maxRequests,
          remaining: 0,
        };
      }
    }

    // Check form-based rate limit
    if (formId && this.config.rateLimit.enabled) {
      const formKey = `form:${formId}`;
      const formAttempts = this.getRecentAttempts(formKey, this.config.rateLimit.byFormId.windowMs);

      // Check if adding current attempt would exceed limit
      if (formAttempts.length >= this.config.rateLimit.byFormId.maxRequests) {
        return {
          isValid: false,
          reason: "rate_limit_form",
          limit: this.config.rateLimit.byFormId.maxRequests,
          remaining: 0,
        };
      }
    }

    return { isValid: true };
  }

  // Record submission attempt
  private recordAttempt(ip?: string, formId?: string): void {
    const timestamp = this.getCurrentTime();

    if (ip) {
      const ipKey = `ip:${ip}`;
      const attempts = this.submissionAttempts.get(ipKey) || [];
      attempts.push({ timestamp, ip });
      this.submissionAttempts.set(ipKey, attempts);
    }

    if (formId) {
      const formKey = `form:${formId}`;
      const attempts = this.submissionAttempts.get(formKey) || [];
      attempts.push({ timestamp, formId });
      this.submissionAttempts.set(formKey, attempts);
    }
  }

  // Get recent attempts within time window
  private getRecentAttempts(key: string, windowMs: number): SubmissionAttempt[] {
    const now = this.getCurrentTime();
    const attempts = this.submissionAttempts.get(key) || [];
    return attempts.filter((attempt) => now - attempt.timestamp < windowMs);
  }

  // Clean up old attempts
  private cleanupOldAttempts(): void {
    const now = this.getCurrentTime();
    const maxWindowMs = Math.max(
      this.config.rateLimit.byIP.windowMs,
      this.config.rateLimit.byFormId.windowMs
    );

    for (const [key, attempts] of this.submissionAttempts.entries()) {
      const recentAttempts = attempts.filter(
        (attempt) => now - attempt.timestamp < maxWindowMs * 2
      );

      if (recentAttempts.length === 0) {
        this.submissionAttempts.delete(key);
      } else {
        this.submissionAttempts.set(key, recentAttempts);
      }
    }
  }

  // Get statistics
  getStatistics(): {
    totalAttempts: number;
    recentAttempts: { [key: string]: number };
    honeypotCatches: number;
    timeTrapCatches: number;
  } {
    const stats = {
      totalAttempts: 0,
      recentAttempts: {} as { [key: string]: number },
      honeypotCatches: 0, // Would need to track these
      timeTrapCatches: 0, // Would need to track these
    };

    for (const [key, attempts] of this.submissionAttempts.entries()) {
      stats.recentAttempts[key] = attempts.length;
      stats.totalAttempts += attempts.length;
    }

    return stats;
  }

  // Clear session data
  clearSession(sessionId: string): void {
    this.startTimes.delete(sessionId);
    this.honeypotValues.delete(sessionId);
  }

  // Test utilities (for accessing private properties in tests)
  getSessionStartTime(sessionId: string): number | undefined {
    return this.startTimes.get(sessionId);
  }

  // Override current time for testing
  private testCurrentTime?: number;

  setCurrentTime(time: number): void {
    this.testCurrentTime = time;
  }

  private getCurrentTime(): number {
    return this.testCurrentTime ?? Date.now();
  }
}

// Export singleton instance
export const antiSpamService = AntiSpamService.getInstance();
